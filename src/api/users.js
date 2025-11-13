/**
 * ユーザー管理API
 * ユーザーの追加、変更、取得を行う
 */

import { getDatabase } from '../db/database.js';

/**
 * 全ユーザーを取得
 * @returns {Array} ユーザーリスト
 */
export function getAllUsers() {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users ORDER BY id');
  return stmt.all();
}

/**
 * IDでユーザーを取得
 * @param {number} id ユーザーID
 * @returns {Object|null} ユーザー情報
 */
export function getUserById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id);
}

/**
 * ユーザー名でユーザーを取得
 * @param {string} username ユーザー名
 * @returns {Object|null} ユーザー情報
 */
export function getUserByUsername(username) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username);
}

/**
 * 新しいユーザーを作成
 * @param {Object} userData ユーザーデータ
 * @param {string} userData.username ユーザー名（必須、一意）
 * @param {string} userData.display_name 表示名（必須）
 * @param {string} userData.email メールアドレス（任意）
 * @returns {Object} 作成されたユーザー情報
 */
export function createUser(userData) {
  const db = getDatabase();
  
  const { username, display_name, email } = userData;

  if (!username || !display_name) {
    throw new Error('ユーザー名と表示名は必須です');
  }

  const stmt = db.prepare(`
    INSERT INTO users (username, display_name, email)
    VALUES (?, ?, ?)
  `);

  try {
    const result = stmt.run(username, display_name, email || null);
    return getUserById(result.lastInsertRowid);
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      throw new Error('このユーザー名は既に使用されています');
    }
    throw error;
  }
}

/**
 * ユーザー情報を更新
 * @param {number} id ユーザーID
 * @param {Object} userData 更新するデータ
 * @param {string} userData.display_name 表示名
 * @param {string} userData.email メールアドレス
 * @returns {Object} 更新されたユーザー情報
 */
export function updateUser(id, userData) {
  const db = getDatabase();

  const user = getUserById(id);
  if (!user) {
    throw new Error('ユーザーが見つかりません');
  }

  const { display_name, email } = userData;

  const stmt = db.prepare(`
    UPDATE users
    SET display_name = COALESCE(?, display_name),
        email = COALESCE(?, email),
        updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `);

  stmt.run(display_name || null, email || null, id);
  return getUserById(id);
}

/**
 * ユーザーを削除
 * @param {number} id ユーザーID
 * @returns {boolean} 削除成功
 */
export function deleteUser(id) {
  const db = getDatabase();

  const user = getUserById(id);
  if (!user) {
    throw new Error('ユーザーが見つかりません');
  }

  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  stmt.run(id);
  return true;
}
