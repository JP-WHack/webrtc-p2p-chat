# WebRTC P2P Terminal Chat

**WebRTCベースのピアツーピア暗号化チャットシステム**

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS%20%7C%20Windows-lightgrey.svg)

---

## 概要

WebRTCを使用したピアツーピア通信の学習ツールです。シグナリングサーバーを介して接続を確立した後、メッセージはサーバーを経由せずピア間で直接送受信されます。ターミナル風UIを備えたブラウザベースのチャットアプリケーションです。

重要: サーバーはメッセージの内容を一切閲覧・保存しません。すべてのチャットはP2Pで直接通信されます。

---

## 機能

* WebRTC DataChannelによるP2P直接通信
* シグナリングサーバーによる接続確立（メッセージ中継なし）
* ターミナル風UIによるチャットインターフェース
* ピア一覧表示・接続管理コマンド
* 接続状態のリアルタイム監視
* STUN サーバーによるNATトラバーサル

---

## 技術仕様

| 項目 | 詳細 |
|------|------|
| P2P通信 | WebRTC RTCDataChannel |
| シグナリング | WebSocket |
| STUNサーバー | stun.l.google.com:19302 |
| デフォルトポート | 8080 |
| フロントエンド | Vanilla JavaScript |
| バックエンド | Node.js (Express + ws) |

---

## アーキテクチャ

```
シグナリングフェーズ:
  Client A ──(WebSocket)──> Signaling Server <──(WebSocket)── Client B

P2Pネゴシエーション (シグナリングサーバー経由):
  Client A ──(Offer/Answer/ICE)──> Server ──> Client B

直接通信 (サーバー不介入):
  Client A ────(RTCDataChannel)──── Client B
```

---

## インストール

必要な依存関係をインストール:

```bash
npm install
```

---

## 使用方法

### サーバーの起動

```bash
node server.js
```

起動後に表示される URL にブラウザでアクセス:

```
[SERVER] Signaling server running on http://localhost:8080
```

### チャットの開始

1. ブラウザで `http://localhost:8080` を開く（複数タブまたは複数端末）
2. 自動的にピアIDが割り当てられる
3. コマンドを使って相手に接続し、メッセージを送信する

### コマンド一覧

```bash
# 接続可能なピアの一覧を表示
/list

# 指定したIDのピアに接続
/connect [ID]

# 現在の接続を切断
/disconnect

# 接続状態を表示
/status
```

### 使用例

```bash
# ピア一覧を確認
peer1@hacknet $ /list
>> 接続可能なピア (ID): 2, 3

# ピア2に接続
peer1@hacknet $ /connect 2
>> ID 2 に接続を試みます...
[[ P2P DATA CHANNEL ESTABLISHED WITH ID 2. START CHATTING. ]]

# メッセージを送信（コマンド以外のテキストはそのまま送信される）
peer1@hacknet $ こんにちは
```

---

## 教育への応用

このプロジェクトは以下の実践的な学習を提供します:

* WebRTCの接続フロー（Offer/Answer/ICE）
* シグナリングサーバーの役割と実装
* ピアツーピア通信アーキテクチャ
* WebSocketによるリアルタイム通信
* RTCDataChannelによるデータ転送
* NAT トラバーサルの仕組み

---

## プロジェクト構成

```
P2PNetwork/
├── server.js          # WebSocket シグナリングサーバー
├── package.json       # 依存関係の定義
└── public/
    ├── index.html     # ターミナル風 UI
    ├── app.js         # WebRTC P2P クライアントロジック
    └── style.css      # ターミナルスタイリング
```

---

## 制限事項

* **TURNサーバー未対応**: 厳格なNAT/ファイアウォール環境では接続できない場合があります
* **1対1通信のみ**: グループチャットには対応していません
* **LAN環境推奨**: ローカルネットワークでの使用を想定しています
* **認証機能なし**: 誰でもサーバーに接続可能です

---

## トラブルシューティング

**接続できない場合:**
```bash
# ポート8080が使用中でないか確認
lsof -i :8080          # Linux/macOS
netstat -ano | findstr 8080  # Windows

# ファイアウォールを確認
sudo ufw allow 8080/tcp     # Linux
```

**ピアとの接続が確立しない場合:**
* 両方のクライアントが同じシグナリングサーバーに接続しているか確認
* NAT環境の場合、STUN サーバーだけでは接続できないことがあります

---

## 免責事項

本ソフトウェアは教育目的で提供されています。ネットワーク通信やWebRTC技術の学習のために設計されており、ユーザーはその使用が適用される法律および規制に準拠していることを確認する責任を負います。

---

*WebRTC P2P通信の学習と理解のために開発*
