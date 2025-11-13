# クイックスタートガイド

## セットアップ（初回のみ）

```bash
# 1. 依存パッケージをインストール
npm install

# 2. データベースを初期化
npm run init-db
```

## 使い方

### 方法1: CLIインターフェースを使用

```bash
npm start
```

メニューから操作を選択します：
- ユーザー管理
- テンプレート管理
- 承認リクエスト管理
- 承認/却下処理

### 方法2: サンプルコードを実行

```bash
node example.js
```

様々な機能の使用例を確認できます。

### 方法3: プログラムから使用

```javascript
import { initializeDatabase, closeDatabase } from './src/db/database.js';
import * as users from './src/api/users.js';
import * as approvals from './src/api/approvals.js';

// 初期化
initializeDatabase();

// ユーザー作成
const user = users.createUser({
  username: 'tanaka',
  display_name: '田中太郎',
  email: 'tanaka@example.com'
});

// 承認リクエスト作成
const request = approvals.createApproval({
  fromUserId: user.id,
  toUserId: 1,
  title: '休暇申請',
  description: '来週の休暇を申請します'
});

// 承認
approvals.approveRequest(request.id, '承認しました');

// クリーンアップ
closeDatabase();
```

## 主要な機能

### ユーザー管理
- `users.createUser(userData)` - ユーザー作成
- `users.getAllUsers()` - 全ユーザー取得
- `users.updateUser(id, userData)` - ユーザー更新

### テンプレート管理
- `templates.createTemplate(data)` - テンプレート作成（Markdown形式）
- `templates.getAllTemplates()` - 全テンプレート取得
- `templates.updateTemplate(id, data)` - テンプレート更新

### 承認リクエスト
- `approvals.createApproval(requestData)` - リクエスト作成
- `approvals.approveRequest(id, comment)` - 承認
- `approvals.rejectRequest(id, comment)` - 却下
- `approvals.addComment(requestId, userId, comment)` - コメント追加
- `approvals.getRelatedApprovals(requestId)` - 関連承認取得

## ファイルの保存場所

- **データベース**: `data/approval_system.db`
- **ログファイル**: `logs/approvals_YYYY-MM-DD.log`

## トラブルシューティング

### データベースをリセットしたい
```bash
rm -rf data/
npm run init-db
```

### ログファイルをクリア
```bash
rm -rf logs/*.log
```

## より詳しい情報

詳細な使い方は [README.md](README.md) を参照してください。
