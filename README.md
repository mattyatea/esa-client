# ESA API Client for TypeScript

TypeScriptで実装されたesa.io API v1のクライアントライブラリです。
標準のfetch APIを使用しています。
また、コードの作成にClaudeを使用しています。

## インストール

```bash
npm install esa-api-client
```

または

```bash
yarn add esa-api-client
```

または

```bash
pnpm add esa-api-client
```

## 使い方

### クライアントの初期化

```typescript
import { EsaClient } from 'esa-api-client';

// チーム名を指定して初期化
const client = new EsaClient({
  token: 'YOUR_ACCESS_TOKEN',
  teamName: 'your-team-name'
});

// または、後からチーム名を設定することも可能
const client = new EsaClient({
  token: 'YOUR_ACCESS_TOKEN'
});
client.setTeamName('your-team-name');
```

### チーム情報

```typescript
// 所属チーム一覧の取得
const teams = await client.getTeams();

// 特定チームの取得
const team = await client.getTeam('your-team-name');

// チームの統計情報
const stats = await client.getTeamStats('your-team-name');
```

### メンバー

```typescript
// チームメンバー一覧の取得
const members = await client.getMembers();

// 特定メンバーの取得
const member = await client.getMember('username');

// メンバーの削除 (オーナー権限が必要)
await client.deleteMember('username');
```

### 記事

```typescript
// 全ての記事を取得
const posts = await client.getPosts();

// 検索条件を指定して記事を取得
const searchedPosts = await client.getPosts({
  q: 'category:general',
  sort: 'updated',
  order: 'desc',
  page: 1,
  per_page: 20
});

// 特定の記事を取得
const post = await client.getPost(123);
// コメントも含めて取得
const postWithComments = await client.getPost(123, 'comments');

// 記事の作成
const newPost = await client.createPost({
  name: '新しい記事',
  body_md: '# はじめに\nこれは新しい記事です。',
  tags: ['api', 'dev'],
  category: 'dev/api',
  wip: true,
  message: '記事を作成しました'
});

// 記事の更新
const updatedPost = await client.updatePost(123, {
  body_md: '# はじめに\nこれは更新された記事です。',
  message: '記事を更新しました'
});

// 記事の削除
await client.deletePost(123);
```

### コメント

```typescript
// 記事のコメント一覧の取得
const comments = await client.getPostComments(123);

// 特定のコメントを取得
const comment = await client.getComment(456);

// コメントの作成
const newComment = await client.createComment(123, {
  body_md: 'いいね！'
});

// コメントの更新
const updatedComment = await client.updateComment(456, {
  body_md: 'とてもいいね！'
});

// コメントの削除
await client.deleteComment(456);
```

### Star

```typescript
// 記事のStarをしたユーザー一覧
const stargazers = await client.getPostStargazers(123);

// 記事にStarをつける
await client.starPost(123, { body: '素晴らしい記事です！' });

// 記事のStarを解除
await client.unstarPost(123);

// コメントのStarをしたユーザー一覧
const commentStargazers = await client.getCommentStargazers(456);

// コメントにStarをつける
await client.starComment(456);

// コメントのStarを解除
await client.unstarComment(456);
```

### Watch

```typescript
// 記事をWatchしているユーザー一覧
const watchers = await client.getPostWatchers(123);

// 記事をWatchする
await client.watchPost(123);

// 記事のWatchを解除
await client.unwatchPost(123);
```

### カテゴリ

```typescript
// カテゴリの一括移動
const result = await client.batchMoveCategory({
  from: '/foo/bar/',
  to: '/baz/'
});
```

### タグ

```typescript
// タグ一覧の取得
const tags = await client.getTags();
```

### 招待

```typescript
// 共通招待URLの取得
const invitation = await client.getInvitationUrl();

// 共通招待URLの再発行
const newInvitation = await client.regenerateInvitationUrl();

// メンバーの招待
const invitations = await client.inviteMembers({
  emails: ['user1@example.com', 'user2@example.com']
});

// 招待一覧の取得
const pendingInvitations = await client.getInvitations();

// 招待の削除
await client.deleteInvitation('invitation-code');
```

### 絵文字

```typescript
// チーム固有の絵文字一覧の取得
const emojis = await client.getEmojis();

// すべての絵文字一覧の取得
const allEmojis = await client.getEmojis(true);

// 絵文字の作成
const newEmoji = await client.createEmoji({
  code: 'team_emoji',
  image: 'BASE64_ENCODED_IMAGE' // または File オブジェクト
});

// 絵文字の削除
await client.deleteEmoji('team_emoji');
```

### ユーザー

```typescript
// 認証中のユーザー情報の取得
const user = await client.getAuthenticatedUser();

// チーム情報を含むユーザー情報の取得
const userWithTeams = await client.getAuthenticatedUser(true);
```

## エラーハンドリング

```typescript
import { EsaClient, EsaApiError } from 'esa-api-client';

try {
  const post = await client.getPost(123);
} catch (error) {
  if (error instanceof EsaApiError) {
    console.error(`API Error (${error.status}):`, error.data);
  } else {
    console.error('Network or other error:', error);
  }
}
```

## レート制限

esa APIには15分間に300リクエストという制限があります。このクライアントは429エラー(Too Many Requests)を検出した場合、自動的に待機して再試行します。

## 開発

### テスト実行

単体テストの実行：

```bash
npm test
```

または特定のテストファイルのみ実行：

```bash
npm test -- esa-client.test.ts
```

### 統合テスト

実際のesa APIと通信する統合テストも用意されています。実行には有効なアクセストークンとチーム名が必要です：

```bash
ESA_API_TOKEN=your_token ESA_TEAM_NAME=your_team ESA_RUN_INTEGRATION=true npm test -- integration.test.ts
```

### ビルド

TypeScriptのコンパイル：

```bash
npm run build
```

### パッケージの公開

```bash
npm publish
```

## ライセンス

MIT
