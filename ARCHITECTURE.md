# システムアーキテクチャ

## システム構成図

```mermaid
graph TB
    CLI[CLIインターフェース<br/>src/index.js]
    APP[アプリケーション層]
    
    subgraph API層
        USER_API[ユーザー管理API<br/>src/api/users.js]
        TEMPLATE_API[テンプレート管理API<br/>src/api/templates.js]
        APPROVAL_API[承認リクエスト管理API<br/>src/api/approvals.js]
    end
    
    subgraph データベース層
        DB[データベース接続<br/>src/db/database.js]
        SCHEMA[スキーマ定義<br/>src/db/schema.js]
        INIT[初期化スクリプト<br/>src/db/init.js]
    end
    
    subgraph ユーティリティ
        LOGGER[ログ出力<br/>src/utils/logger.js]
    end
    
    subgraph データストレージ
        SQLITE[(SQLiteデータベース<br/>data/approval_system.db)]
        LOGS[ログファイル<br/>logs/approvals_*.log]
    end
    
    CLI --> APP
    APP --> USER_API
    APP --> TEMPLATE_API
    APP --> APPROVAL_API
    
    USER_API --> DB
    TEMPLATE_API --> DB
    APPROVAL_API --> DB
    APPROVAL_API --> LOGGER
    
    DB --> SCHEMA
    DB --> SQLITE
    INIT --> DB
    LOGGER --> LOGS
```

## データベーススキーマ

```mermaid
erDiagram
    users ||--o{ approval_requests : "申請者/承認者"
    users ||--o{ approval_comments : "投稿"
    approval_templates ||--o{ approval_requests : "使用"
    approval_requests ||--o{ approval_comments : "持つ"
    approval_requests ||--o{ related_approvals : "関連元"
    approval_requests ||--o{ related_approvals : "関連先"
    
    users {
        int id PK
        string username UK
        string display_name
        string email
        datetime created_at
        datetime updated_at
    }
    
    approval_templates {
        int id PK
        string name UK
        string description
        text content
        datetime created_at
        datetime updated_at
    }
    
    approval_requests {
        int id PK
        int from_user_id FK
        int to_user_id FK
        int template_id FK
        string title
        text description
        string status
        text result_comment
        datetime created_at
        datetime updated_at
    }
    
    approval_comments {
        int id PK
        int request_id FK
        int user_id FK
        text comment
        datetime created_at
    }
    
    related_approvals {
        int id PK
        int request_id FK
        int related_request_id FK
        datetime created_at
    }
```

## 承認フロー

```mermaid
stateDiagram-v2
    [*] --> 作成: 承認リクエスト作成
    作成 --> 保留中: pending
    
    保留中 --> コメント追加: コメント
    コメント追加 --> 保留中
    
    保留中 --> 承認済: approveRequest()
    保留中 --> 却下済: rejectRequest()
    
    承認済 --> ログ出力: 承認ログ記録
    却下済 --> ログ出力: 却下ログ記録
    
    ログ出力 --> [*]
```

## 機能別処理フロー

### 承認リクエスト作成
```mermaid
sequenceDiagram
    participant User as ユーザー
    participant CLI as CLIインターフェース
    participant API as 承認API
    participant DB as データベース
    
    User->>CLI: 承認リクエスト作成
    CLI->>API: createApproval(requestData)
    API->>DB: ユーザー存在確認
    DB-->>API: ユーザー情報
    API->>DB: リクエスト挿入
    API->>DB: 関連承認の紐付け
    DB-->>API: 作成されたリクエスト
    API-->>CLI: リクエスト情報
    CLI-->>User: 作成完了通知
```

### 承認/却下処理
```mermaid
sequenceDiagram
    participant User as 承認者
    participant CLI as CLIインターフェース
    participant API as 承認API
    participant DB as データベース
    participant Logger as ログ
    
    User->>CLI: 承認/却下処理
    CLI->>API: getApprovalById(id)
    API->>DB: リクエスト取得
    DB-->>API: リクエスト情報
    API->>API: getRelatedApprovals(id)
    API-->>CLI: 詳細表示（関連承認含む）
    CLI-->>User: 詳細表示
    
    User->>CLI: 承認/却下選択
    CLI->>API: approveRequest(id, comment)
    API->>DB: ステータス更新
    DB-->>API: 更新完了
    API->>Logger: logApprovalResult()
    Logger->>Logger: ファイル書き込み
    API-->>CLI: 処理完了
    CLI-->>User: 結果通知
```

## セキュリティ対策

1. **SQLインジェクション対策**
   - Prepared Statements（プリペアドステートメント）を使用
   - better-sqlite3のパラメータバインディング機能を活用

2. **外部キー制約**
   - データの整合性を保証
   - CASCADE DELETE設定によるデータ削除の連鎖

3. **入力検証**
   - 必須項目のチェック
   - ユーザー存在確認
   - 一意制約の検証

4. **ログ記録**
   - すべての承認/却下処理をログファイルに記録
   - 監査証跡の確保

## 拡張性

システムは以下の拡張が容易です：

1. **Webインターフェースの追加**
   - Express.jsサーバーの追加
   - REST API エンドポイントの実装
   - フロントエンドUIの追加

2. **認証・認可の追加**
   - ユーザー認証機能
   - ロールベースアクセス制御（RBAC）
   - セッション管理

3. **通知機能**
   - メール通知
   - Slack/Teams連携
   - プッシュ通知

4. **ワークフロー機能**
   - 複数承認者の設定
   - 承認フローの定義
   - エスカレーション機能

5. **レポート機能**
   - 承認統計の表示
   - ダッシュボード
   - エクスポート機能
