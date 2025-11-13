/**
 * データベーススキーマ定義
 * SQLiteデータベースのテーブル構造を定義
 */

export const SCHEMA = {
  // ユーザーテーブル
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      email TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `,

  // 承認テンプレートテーブル（Markdownで管理）
  approval_templates: `
    CREATE TABLE IF NOT EXISTS approval_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `,

  // 承認リクエストテーブル
  approval_requests: `
    CREATE TABLE IF NOT EXISTS approval_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      template_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'allowed', 'rejected')),
      result_comment TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (from_user_id) REFERENCES users(id),
      FOREIGN KEY (to_user_id) REFERENCES users(id),
      FOREIGN KEY (template_id) REFERENCES approval_templates(id)
    )
  `,

  // 承認リクエストのコメントテーブル
  approval_comments: `
    CREATE TABLE IF NOT EXISTS approval_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (request_id) REFERENCES approval_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `,

  // 関連承認テーブル（前の承認との関連付け）
  related_approvals: `
    CREATE TABLE IF NOT EXISTS related_approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      related_request_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (request_id) REFERENCES approval_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (related_request_id) REFERENCES approval_requests(id) ON DELETE CASCADE,
      UNIQUE(request_id, related_request_id)
    )
  `,

  // インデックス作成
  indexes: [
    'CREATE INDEX IF NOT EXISTS idx_requests_from_user ON approval_requests(from_user_id)',
    'CREATE INDEX IF NOT EXISTS idx_requests_to_user ON approval_requests(to_user_id)',
    'CREATE INDEX IF NOT EXISTS idx_requests_status ON approval_requests(status)',
    'CREATE INDEX IF NOT EXISTS idx_comments_request ON approval_comments(request_id)',
    'CREATE INDEX IF NOT EXISTS idx_related_request ON related_approvals(request_id)',
    'CREATE INDEX IF NOT EXISTS idx_related_related_request ON related_approvals(related_request_id)'
  ]
};
