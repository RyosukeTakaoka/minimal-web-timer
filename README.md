# Minimal Web Timer

Apple製品のような「静寂」と「道具感」を追求した、ミニマルで高機能なWebタイマーです。

![Main View](https://raw.githubusercontent.com/username/project/main/screenshot.png) (公開後に差し替えてください)

## 特徴

- **ダイナミック・サイジング**: タイマー実行時のみ画面いっぱいに拡大し、集中力を高める没入型UI。
- **2つのモード**: 単一の「タイマー」と、複数フェーズを回す「サイクル」をワンクリックで切替。
- **サイクル無限ループ**: 作業と休憩を自動で繰り返すループ機能。
- **Apple風デザイン**: 余白を活かした美しく静かなデザイン、SF Pro調のタイポグラフィ。
- **履歴とショートカット**: `1-5` キーで「最近使った項目」を瞬時に呼び出し。
- **トリプルビープ・アラーム**: 確実に気づける洗練されたサウンド通知。
- **ダークモード対応**: システム設定に合わせた自動テーマ切り替え。

## 使い方

1. `index.html` をブラウザで開くだけで使用可能です。
2. **タイマーモード**: プリセット（5分/25分など）を選ぶか、直接数字を入力して開始。
3. **サイクルモード**: フェーズ（作業/休憩など）を自由に追加・カスタマイズして開始（ループON/OFF可能）。
4. **ショートカット**:
   - `Space`: 開始 / 一時停止
   - `R`: リセット
   - `1-5`: 最近の項目をロード

## 技術仕様

- **Language**: HTML5, CSS3, Vanilla JavaScript (No Frameworks)
- **Audio**: Web Audio API (Manual synthesis)
- **Persistence**: LocalStorage (Settings & History)
- **Aesthetics**: Glassmorphism, CSS Transitions (Fast & Fluid)

## 公開方法 (GitHub Pages)

このリポジトリをGitHubにプッシュした後、リポジトリの `Settings > Pages` から `main` ブランチを公開設定にすることで、自分専用のタイマーURLを作成できます。

---
Produced by Antigravity (Advanced Agentic Coding)
