/**
 * データベース接続とヘルパー関数
 * SQLiteデータベースとの接続を管理
 */

import Database from 'better-sqlite3';
import { SCHEMA } from './schema.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// データベースファイルのパス
const DB_PATH = path.join(__dirname, '../../data/approval_system.db');

let db = null;

/**
 * データベース接続を取得
 * @returns {Database} SQLiteデータベースインスタンス
 */
export function getDatabase() {
  if (!db) {
    // dataディレクトリが存在しない場合は作成
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL'); // Write-Ahead Logging有効化
    db.pragma('foreign_keys = ON'); // 外部キー制約有効化
  }
  return db;
}

/**
 * データベースを初期化（テーブル作成）
 */
export function initializeDatabase() {
  const database = getDatabase();

  // テーブル作成
  database.exec(SCHEMA.users);
  database.exec(SCHEMA.approval_templates);
  database.exec(SCHEMA.approval_requests);
  database.exec(SCHEMA.approval_comments);
  database.exec(SCHEMA.related_approvals);

  // インデックス作成
  SCHEMA.indexes.forEach(indexSQL => {
    database.exec(indexSQL);
  });

  console.log('データベースの初期化が完了しました');
}

/**
 * データベース接続をクローズ
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('データベース接続をクローズしました');
  }
}
