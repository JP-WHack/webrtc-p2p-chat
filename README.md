<div align="center">

# WebRTC P2P Terminal Chat

**WebRTC ベースのピアツーピア暗号化チャットシステム**

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-P2P-333333?style=for-the-badge&logo=webrtc&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-3DA639?style=for-the-badge)

</div>

---

## 📖 概要

WebRTC を使用したピアツーピア通信の学習ツールです。シグナリングサーバーを介して接続を確立した後、メッセージはサーバーを経由せずピア間で直接送受信されます。ターミナル風 UI を備えたブラウザベースのチャットアプリケーションです。

> ⚠️ **重要**: サーバーはメッセージの内容を一切閲覧・保存しません。すべてのチャットは P2P で直接通信されます。

---

## ✨ 主な機能

* WebRTC DataChannel による P2P 直接通信
* シグナリングサーバーによる接続確立（メッセージ中継なし）
* ターミナル風 UI によるチャットインターフェース
* ピア一覧表示・接続管理コマンド
* 接続状態のリアルタイム監視
* STUN サーバーによる NAT トラバーサル

---

## 🛠️ 技術仕様

| 項目 | 詳細 |
|------|------|
| P2P 通信 | WebRTC RTCDataChannel |
| シグナリング | WebSocket |
| STUN サーバー | stun.l.google.com:19302 |
| デフォルトポート | 8080 |
| フロントエンド | Vanilla JavaScript |
| バックエンド | Node.js (Express + ws) |

---

## 🏗️ アーキテクチャ

```
シグナリングフェーズ:
  Client A ──(WebSocket)──> Signaling Server <──(WebSocket)── Client B

P2P ネゴシエーション (シグナリングサーバー経由):
  Client A ──(Offer/Answer/ICE)──> Server ──> Client B

直接通信 (サーバー不介入):
  Client A ────(RTCDataChannel)──── Client B
```

---

## 📥 インストール

必要な依存関係をインストール:

```bash
npm install
```

---

## 💻 使用方法

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
2. 自動的にピア ID が割り当てられる
3. コマンドを使って相手に接続し、メッセージを送信する

### コマンド一覧

```bash
# 接続可能なピアの一覧を表示
/list

# 指定した ID のピアに接続
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

## 📂 ファイル構成

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

## 🔍 トラブルシューティング

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
* NAT 環境の場合、STUN サーバーだけでは接続できないことがあります

---

## 📊 制限事項

* **TURN サーバー未対応**: 厳格な NAT/ファイアウォール環境では接続できない場合があります
* **1対1通信のみ**: グループチャットには対応していません
* **LAN 環境推奨**: ローカルネットワークでの使用を想定しています
* **認証機能なし**: 誰でもサーバーに接続可能です

---

## 🎓 教育への応用

このプロジェクトは以下の実践的な学習を提供します:

* WebRTC の接続フロー（Offer/Answer/ICE）
* シグナリングサーバーの役割と実装
* ピアツーピア通信アーキテクチャ
* WebSocket によるリアルタイム通信
* RTCDataChannel によるデータ転送
* NAT トラバーサルの仕組み

---

## ⚠️ 免責事項

本ソフトウェアは教育目的で提供されています。ネットワーク通信や WebRTC 技術の学習のために設計されており、ユーザーはその使用が適用される法律および規制に準拠していることを確認する責任を負います。

---

<div align="center">

*WebRTC P2P 通信の学習と理解のために開発*

</div>
