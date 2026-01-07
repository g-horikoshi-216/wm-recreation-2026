# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

部のレクリエーションで使用するチーム対抗クイズアプリ。
競馬の三連単のように、1着・2着・3着を順番通りに予想する形式。

詳細な要件は docs/REQUIREMENTS.md を参照。

## 技術スタック

- Next.js 16 (App Router)
- Supabase (PostgreSQL + Realtime)
- Tailwind CSS
- TypeScript

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# リント
npm run lint
```

## セットアップ

1. Supabaseプロジェクトを作成
2. `.env.local` に環境変数を設定:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_ADMIN_PASSWORD=admin
   ```
3. `supabase/migrations/001_initial_schema.sql` をSupabaseのSQLエディタで実行

## アーキテクチャ

### ディレクトリ構成

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # トップ（ロール選択）
│   ├── admin/page.tsx     # 管理者画面
│   ├── team/[teamId]/     # チーム回答画面
│   ├── viewer/page.tsx    # 閲覧用画面
│   └── api/               # APIルート
├── components/            # UIコンポーネント
├── hooks/                 # リアルタイム購読フック
└── lib/                   # 型定義・ユーティリティ
```

### 主要ファイル

- `src/lib/types.ts` - 型定義
- `src/lib/scoring.ts` - 採点ロジック（同着対応含む）
- `src/lib/constants.ts` - チーム名、配点など
- `src/hooks/useRealtime*.ts` - Supabase Realtime購読

### データフロー

1. 管理者が問題を作成・出題開始（status: pending → open）
2. チームが予想を送信（answers テーブル）
3. 管理者が回答締切（status: open → closed）
4. 管理者が正解入力・採点（status: closed → revealed）
5. 各チームのスコアが更新（teams.total_score）

## スタイルガイド

- テキストのデフォルト色は `text-gray-800` を使用
- フォーム要素（input, select, textarea）には必ず `text-gray-800` を指定
- 絵文字禁止。アイコンは MUI Icons（@mui/icons-material）を使用

## 注意事項

- 日本語で返答してください