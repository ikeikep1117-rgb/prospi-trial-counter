# 試練カウントツール

## 概要
プロ野球スピリッツAの特殊能力レベル上げに必要な試練素材を、合計と選手別で管理できるWebアプリです。所持素材を入力すると、登録した選手全員に必要な素材数と不足数を自動で計算します。

## 主な機能
- 選手名と特殊能力3つを登録
- 特殊能力ごとに現在Lv、目標Lv、試練タイプを入力
- 「合計」タブで所持素材と全選手分の必要素材をまとめて確認
- 「選手別」タブで特殊能力ごとの不足数と選手合計の不足数を確認
- 選手カードを開閉して、一覧をコンパクトに管理
- 新規選手を一覧の一番上に追加
- 選手ごとの優先順位（高・中・低）設定と絞り込み
- 選手カードの上下並び替え
- 証、指南、極意書、閃きの印、開眼の印、真価の印の素材画像を標準搭載
- 閃きの印、開眼の印、真価の印は全タイプ共通素材として計算
- 入力内容をブラウザに自動保存
- スマホ、タブレット、PCに対応したレスポンシブデザイン
- favicon、アプリアイコン、OGP画像、PWA用manifestを同梱

## 使用技術
- HTML
- CSS
- JavaScript
- LocalStorage
- SVG / JPGアセット

## 起動方法
このフォルダの `index.html` をブラウザで開くと使えます。

開発用サーバーで確認する場合:

```bash
npx serve .
```

## ディレクトリ構成

```text
.
├── assets/
│   ├── app-icon.svg
│   ├── favicon.svg
│   ├── icon-192.svg
│   ├── icon-512.svg
│   ├── material-photos/
│   │   ├── gikou-guide.jpg
│   │   ├── gikou-proof.jpg
│   │   ├── gikou-secret.jpg
│   │   ├── gouriki-guide.jpg
│   │   ├── gouriki-proof.jpg
│   │   ├── gouriki-secret.jpg
│   │   ├── kokoro-guide.jpg
│   │   ├── kokoro-proof.jpg
│   │   ├── kokoro-secret.jpg
│   │   ├── mark-awaken.jpg
│   │   ├── mark-flash.jpg
│   │   ├── mark-truth.jpg
│   │   ├── shunbin-guide.jpg
│   │   ├── shunbin-proof.jpg
│   │   └── shunbin-secret.jpg
│   ├── materials/
│   └── ogp.svg
├── app.js
├── index.html
├── README.md
├── site.webmanifest
└── style.css
```

## 今後の改善案
- 選手データのエクスポート / インポート
- よく使う特殊能力名の候補入力
- 実際の試練周回数の目安表示
- 複数端末で同期するためのバックエンド連携
- 目標レベルを一括変更できる機能
