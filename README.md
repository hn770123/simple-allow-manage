# 承認管理システム (Simple Allow Manage)

Node.js + SQLiteを使用したユーザー間の承認（許可）リクエスト管理システムです。

## 機能

- ✅ ユーザー管理（追加・変更・一覧表示）
- ✅ 承認テンプレート管理（Markdown形式）
- ✅ 承認リクエストの作成
- ✅ 承認（Allow）/ 却下（Reject）機能
- ✅ コメント機能（承認/却下時、途中経過）
- ✅ 関連承認の紐付け機能
- ✅ 関連承認の参照（結果を含む）
- ✅ 承認結果のログファイル出力

## システム要件

- Node.js 18以上
- npm または yarn

## インストール

```bash
# リポジトリをクローン
git clone https://github.com/hn770123/simple-allow-manage.git
cd simple-allow-manage

# 依存パッケージをインストール
npm install

# データベースを初期化（サンプルデータ付き）
npm run init-db
```

## 使い方

### システムの起動

```bash
npm start
```

起動するとCLIメニューが表示されます：

```
=== 承認管理システム ===
1. ユーザー管理
2. テンプレート管理
3. 承認リクエスト管理
4. 承認リクエストを作成
5. 承認リクエストを処理（承認/却下）
6. 承認リクエストを表示
0. 終了
========================
```

### 基本的な使用フロー

#### 1. ユーザーの作成

メニューから「1. ユーザー管理」→「2. ユーザー追加」を選択し、必要な情報を入力します。

```
ユーザー名: tanaka
表示名: 田中太郎
メールアドレス: tanaka@example.com
```

#### 2. 承認テンプレートの作成（任意）

メニューから「2. テンプレート管理」→「2. テンプレート追加」を選択します。

Markdown形式でテンプレートを作成できます：

```markdown
# 休暇申請

## 申請内容
- 休暇期間: 2024/01/10 ～ 2024/01/15
- 休暇種類: 有給休暇
- 理由: 家族旅行

## 連絡事項
緊急時は携帯電話にご連絡ください。
```

#### 3. 承認リクエストの作成

メニューから「4. 承認リクエストを作成」を選択します。

```
申請者ID: 1
承認者ID: 2
タイトル: 2024年1月の休暇申請
説明: 1/10-1/15の期間で休暇を取得したいです
テンプレートID: 1
関連する承認ID: （あれば入力、なければ空白）
```

#### 4. 承認リクエストの処理

メニューから「5. 承認リクエストを処理（承認/却下）」を選択します。

- リクエストの詳細が表示されます
- 関連する承認がある場合、その結果も表示されます
- 承認（Allow）または却下（Reject）を選択
- 必要に応じてコメントを追加

#### 5. 承認リクエストの参照

メニューから「6. 承認リクエストを表示」を選択すると、詳細情報を確認できます：

- リクエストの基本情報
- ステータス（保留中/承認済/却下済）
- コメント履歴
- 関連する承認とその結果

## データベース構造

### テーブル

- **users** - ユーザー情報
- **approval_templates** - 承認テンプレート（Markdown）
- **approval_requests** - 承認リクエスト
- **approval_comments** - コメント
- **related_approvals** - 関連承認の紐付け

### データの保存場所

- データベースファイル: `data/approval_system.db`
- ログファイル: `logs/approvals_YYYY-MM-DD.log`

## ログファイル

承認/却下の結果は自動的にログファイルに記録されます：

```
[2024-01-09 14:30:15] ID:1 承認
  申請者: 田中太郎
  承認者: 山田花子
  タイトル: 2024年1月の休暇申請
  コメント: 承認します。良い休暇を！

```

ログファイルは日付ごとに分割され、`logs/`ディレクトリに保存されます。

## ドキュメント

- [クイックスタートガイド](QUICKSTART.md) - 素早く始めるための簡易ガイド
- [アーキテクチャ設計書](ARCHITECTURE.md) - システムアーキテクチャと設計詳細

## プロジェクト構造

```
simple-allow-manage/
├── src/
│   ├── api/              # API層
│   │   ├── users.js      # ユーザー管理
│   │   ├── templates.js  # テンプレート管理
│   │   └── approvals.js  # 承認リクエスト管理
│   ├── db/               # データベース層
│   │   ├── schema.js     # スキーマ定義
│   │   ├── database.js   # DB接続管理
│   │   └── init.js       # 初期化スクリプト
│   ├── utils/            # ユーティリティ
│   │   └── logger.js     # ログ出力
│   └── index.js          # メインエントリーポイント
├── data/                 # データベースファイル（自動生成）
├── logs/                 # ログファイル（自動生成）
├── templates/            # テンプレート保存用
├── package.json
└── README.md
```

## API仕様

### ユーザー管理 (users.js)

- `getAllUsers()` - 全ユーザー取得
- `getUserById(id)` - ID指定でユーザー取得
- `getUserByUsername(username)` - ユーザー名で取得
- `createUser(userData)` - ユーザー作成
- `updateUser(id, userData)` - ユーザー更新
- `deleteUser(id)` - ユーザー削除

### テンプレート管理 (templates.js)

- `getAllTemplates()` - 全テンプレート取得
- `getTemplateById(id)` - ID指定でテンプレート取得
- `createTemplate(templateData)` - テンプレート作成
- `updateTemplate(id, templateData)` - テンプレート更新
- `deleteTemplate(id)` - テンプレート削除

### 承認リクエスト管理 (approvals.js)

- `getAllApprovals(filters)` - 承認リクエスト一覧取得
- `getApprovalById(id)` - 承認リクエスト詳細取得
- `createApproval(requestData)` - 承認リクエスト作成
- `approveRequest(id, comment)` - 承認（Allow）
- `rejectRequest(id, comment)` - 却下（Reject）
- `addComment(requestId, userId, comment)` - コメント追加
- `getComments(requestId)` - コメント取得
- `getRelatedApprovals(requestId)` - 関連承認取得
- `addRelatedApproval(requestId, relatedRequestId)` - 関連承認追加

## 開発

### テストの実行

```bash
npm test
```

### データベースの再初期化

データベースをクリーンな状態に戻したい場合：

```bash
# データベースファイルを削除
rm -rf data/

# 再初期化
npm run init-db
```

## ライセンス

ISC

## 作者

hn770123
