// WebRTC設定
const CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // 外部のSTUNサーバーを利用。TURNサーバーは有料のため今回は省略。
    ]
};

const output = document.getElementById('output');
const input = document.getElementById('input');
const myIdDisplay = document.getElementById('my-id-display');
const promptPrefix = document.getElementById('prompt-prefix');

let localId = null; // 自身のID
let remoteId = null; // 接続中の相手のID
let peerConnection = null; // RTCPeerConnectionオブジェクト
let dataChannel = null; // RTCDataChannelオブジェクト
let isCaller = false; // 接続を開始した側か

// WebSocket接続 (シグナリング)
const ws = new WebSocket(`ws://${location.hostname}:8080`);

ws.onopen = () => {
    logOutput('prompt', '[[ SIGNALING CONNECTION ESTABLISHED. ]]');
};

ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'yourId') {
        localId = data.id;
        myIdDisplay.textContent = localId;
        logOutput('info', `>> 自身のID: ${localId}`);
        promptPrefix.textContent = `peer${localId}@hacknet $`;
    } else if (data.type === 'availablePeers') {
        logOutput('info', `>> 接続可能なピア (ID): ${data.peers.join(', ') || 'なし'}`);
    } else if (data.type === 'signal') {
        const payload = data.payload;
        const senderId = data.senderId;

        // 接続相手が確定していない場合は、送信元を相手とする
        if (!remoteId && payload.type === 'offer') {
            remoteId = senderId;
            logOutput('info', `>> ID ${remoteId} からの接続リクエストを受信しました。`);
            await handleSignal(payload);
        } else if (senderId === remoteId) {
            // 接続相手が確定している場合の処理
            await handleSignal(payload);
        }
    }
};

ws.onclose = () => {
    logOutput('error', '[[ WARNING: SIGNALING CONNECTION LOST. ]]');
};

ws.onerror = (err) => {
    logOutput('error', `[[ ERROR: ${err.message || 'Unknown signaling error'} ]]`);
};

// ----------------------------------------------------
// ターミナル操作
// ----------------------------------------------------

input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const text = input.value.trim();
        input.value = '';

        if (text) {
            logOutput('prompt', `${promptPrefix.textContent} ${text}`);
            if (text.startsWith('/')) {
                handleCommand(text);
            } else {
                sendMessage(text);
            }
        }
    }
});

function logOutput(className, message) {
    const pre = document.createElement('pre');
    pre.className = className;
    pre.textContent = message;
    output.appendChild(pre);
    output.scrollTop = output.scrollHeight; // スクロールを最下部に
}

function handleCommand(command) {
    const parts = command.split(' ');
    const cmd = parts[0].toLowerCase();

    if (cmd === '/connect' && parts.length === 2) {
        const targetId = parseInt(parts[1], 10);
        if (targetId === localId) {
            logOutput('error', '>> 自身のIDには接続できません。');
            return;
        }
        remoteId = targetId;
        isCaller = true;
        logOutput('info', `>> ID ${remoteId} に接続を試みます...`);
        createPeerConnection();
    } else if (cmd === '/disconnect') {
        if (peerConnection) {
            closePeerConnection();
            logOutput('info', `>> ID ${remoteId} との接続を切断しました。`);
        } else {
            logOutput('error', '>> 現在、接続中のピアはありません。');
        }
    } else if (cmd === '/list') {
        ws.send(JSON.stringify({ type: 'requestTargetId' }));
    } else if (cmd === '/status') {
        logOutput('info', `>> Local ID: ${localId}`);
        logOutput('info', `>> Remote ID: ${remoteId || 'N/A'}`);
        logOutput('info', `>> P2P Status: ${peerConnection ? peerConnection.connectionState : 'Closed'}`);
        logOutput('info', `>> DataChannel: ${dataChannel ? dataChannel.readyState : 'Closed'}`);
    }
     else {
        logOutput('error', `>> 不明なコマンド: ${cmd}`);
    }
}

// ----------------------------------------------------
// WebRTC P2P処理
// ----------------------------------------------------

function createPeerConnection() {
    // 既に接続がある場合は切断
    if (peerConnection) {
        closePeerConnection();
    }

    peerConnection = new RTCPeerConnection(CONFIG);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            // ICE候補をシグナリングサーバー経由で送信
            sendSignal({ type: 'candidate', candidate: event.candidate });
        }
    };

    peerConnection.onconnectionstatechange = () => {
        logOutput('info', `>> P2P Connection State: ${peerConnection.connectionState}`);
        if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'closed') {
            closePeerConnection();
            logOutput('error', `[[ CONNECTION WITH ID ${remoteId} LOST. ]]`);
        }
    };
    
    // データチャネル受信側
    peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel;
        setupDataChannel(dataChannel);
    };

    if (isCaller) {
        // データチャネル送信側（Offerer）
        dataChannel = peerConnection.createDataChannel('chat');
        setupDataChannel(dataChannel);
        createOffer();
    }
}

function closePeerConnection() {
    if (dataChannel) {
        dataChannel.close();
        dataChannel = null;
    }
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    remoteId = null;
    isCaller = false;
}

function setupDataChannel(channel) {
    channel.onopen = () => {
        logOutput('prompt', `[[ P2P DATA CHANNEL ESTABLISHED WITH ID ${remoteId}. START CHATTING. ]]`);
    };

    channel.onmessage = (event) => {
        // 【重要】サーバーを介さず、ピアから直接メッセージを受信する
        logOutput('remote-msg', `[ID ${remoteId}] > ${event.data}`);
    };

    channel.onclose = () => {
        logOutput('error', '[[ P2P DATA CHANNEL CLOSED. ]]');
        closePeerConnection();
    };

    channel.onerror = (err) => {
        logOutput('error', `[[ DATA CHANNEL ERROR: ${err.message} ]]`);
    };
}


async function createOffer() {
    try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        sendSignal(peerConnection.localDescription);
    } catch (err) {
        logOutput('error', `[[ OFFER CREATION FAILED: ${err.message} ]]`);
    }
}

async function createAnswer(offer) {
    try {
        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        sendSignal(peerConnection.localDescription);
    } catch (err) {
        logOutput('error', `[[ ANSWER CREATION FAILED: ${err.message} ]]`);
    }
}

async function handleSignal(signal) {
    // 接続相手が確定していない状態でOfferを受け取ったら、Answererとして接続を開始
    if (!peerConnection) {
        isCaller = false;
        createPeerConnection();
    }
    
    if (signal.type === 'offer') {
        await createAnswer(new RTCSessionDescription(signal));
    } else if (signal.type === 'answer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
    } else if (signal.type === 'candidate') {
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (e) {
            console.error('Error adding received ice candidate:', e);
        }
    }
}

// シグナリングサーバーへ情報を転送
function sendSignal(data) {
    const message = {
        type: 'signal',
        targetId: remoteId,
        payload: data
    };
    ws.send(JSON.stringify(message));
}

// P2Pデータチャネルでメッセージを送信
function sendMessage(message) {
    if (dataChannel && dataChannel.readyState === 'open') {
        // P2Pチャネルで直接送信
        dataChannel.send(message);
        logOutput('user-msg', `[You] > ${message}`);
    } else {
        logOutput('error', '>> データチャネルがまだ開いていません。/connect [ID] で接続してください。');
    }
}