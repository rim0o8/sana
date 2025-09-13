## Mastra Tweet Agent (Minimal)

Mastra を使ったツイート対応 AI エージェントの最小構成サンプルです。クリーンアーキテクチャで構成し、ロガー、環境変数の検証、Twitter(X) API アダプタ、コアユースケースのユニットテストを含みます。

### 要件

- Node.js >= 20
- Bun 1.1+（推奨）または pnpm/npm/yarn のいずれか

### ディレクトリ構成

- `src/domain`: エンティティとポート(インターフェース)
- `src/application`: ユースケース（純粋なビジネスロジック）
- `src/infrastructure`: ロガー、設定、Mastra エージェント、Twitter アダプタ
- `src/presentation/cli`: CLI エントリポイント
- `tests`: ユニットテスト（Vitest）

### セットアップ

1. `.env.example` をコピーして `.env` を作成し、値を設定します。

```
OPENAI_API_KEY=sk-...            # 任意（未設定でもドライラン可）
TWITTER_APP_KEY=...              # X アプリの API Key（投稿する場合に必要）
TWITTER_APP_SECRET=...           # X アプリの API Secret
TWITTER_ACCESS_TOKEN=...         # X ユーザーの Access Token
TWITTER_ACCESS_SECRET=...        # X ユーザーの Access Secret
LOG_LEVEL=info                   # 任意（pino ログレベル）
```

2. 依存関係をインストールします。

```
bun install
```

> pnpm を使う場合: `pnpm i`

3. 実行（デフォルトはドライラン）

```
# 生成のみ（投稿しない）
bun run dev -- --topic "新機能を公開しました" --style tech --hashtags off

# 実際に投稿（--post を付ける）
# 事前に X アプリの権限が Write になっていることと、.env のトークンが正しいことを確認してください
bun run dev -- --topic "新機能を公開しました" --post
```

### 動作のポイント

- デフォルトはドライラン（投稿しない）です。実投稿は `--post` を付与します。
- `OPENAI_API_KEY` が未設定のときは、オフラインの簡易ジェネレータでツイート文を生成します。
- `OPENAI_API_KEY` を設定し、`@mastra/core` が導入されていれば、モデル（OpenAI）を用いた生成に切り替わります。
- 投稿は `twitter-api-v2`（OAuth 1.0a ユーザーコンテキスト）で行います。X 側アプリの権限が `Read and write` である必要があります。

### スクリプト

- `bun run dev` — CLI を起動（引数は `--` の後に指定）
- `bun run build` — TypeScript をビルド
- `bun start` — ビルド成果物から起動
- `bun run test` — ユニットテスト（Vitest）
- `bun run lint` — ESLint（Flat Config）

### テスト

```
bun run test
```

### 実装メモ

- `PostTweetUseCase` は 280 文字超過を防ぐための簡易チェックを実装しています。
- Mastra の API/設定はバージョンにより変わる可能性があります。必要に応じて `src/infrastructure/ai/agent.ts` を調整してください。
- ログは開発時に `pino-pretty` で整形表示されます。`LOG_LEVEL` で閾値を変更できます。
