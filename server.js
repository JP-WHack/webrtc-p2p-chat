// Node.js環境で実行
const WebSocket = require('ws');
const http = require('http');
const express = require('express');

// Expressで静的ファイル（HTML/CSS/JS）をホスティング
const app = express();
app.use(express.static('public')); // 'public'フォルダにフロントエンドファイルを配置

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 接続中のクライアントを管理するためのMap
// 実際にはルーム管理などが必要ですが、シンプルな実装としてクライアントIDを割り当てます
const clients = new Map();
let clientIdCounter = 0;

wss.on('connection', (ws) => {
    // 新しいクライアントにIDを割り当て
    const id = ++clientIdCounter;
    clients.set(id, ws);
    console.log(`[SERVER] New client connected: ID ${id}`);

    // クライアントに自身のIDを送信（接続確立時の識別用）
    ws.send(JSON.stringify({ type: 'yourId', id: id }));

    // クライアントからのメッセージを受信
    ws.on('message', (message) => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            console.error('[SERVER] Invalid JSON received.');
            return;
        }

        // シグナリング情報の転送処理
        if (data.type === 'signal') {
            const targetId = data.targetId;
            const signalData = data.payload;

            // ターゲットクライアントを見つける
            const targetWs = clients.get(targetId);

            if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                // ターゲットにシグナリング情報を転送
                targetWs.send(JSON.stringify({
                    type: 'signal',
                    senderId: id, // 送信元IDを付与
                    payload: signalData
                }));
                console.log(`[SERVER] Signal from ${id} to ${targetId} (Type: ${signalData.type})`);
            } else {
                console.log(`[SERVER] Target client ${targetId} not found or not ready.`);
                // オフライン通知などを返すことも可能
            }
        } else if (data.type === 'requestTargetId') {
            // 参加しているピアのリストを返す
            const availablePeers = Array.from(clients.keys()).filter(peerId => peerId !== id);
            ws.send(JSON.stringify({
                type: 'availablePeers',
                peers: availablePeers
            }));
        }
        
        // 【重要】メッセージの'text'や'content'は一切見ないし、保存しない。
    });

    // クライアントが切断したときの処理
    ws.on('close', () => {
        clients.delete(id);
        console.log(`[SERVER] Client disconnected: ID ${id}`);
    });
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`[SERVER] Signaling server running on http://localhost:${PORT}`);
    console.log(`[SERVER] Front-end files served from http://localhost:${PORT}`);
});