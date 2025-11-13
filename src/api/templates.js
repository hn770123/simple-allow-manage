/**
 * 承認テンプレート管理API
 * Markdownテンプレートの追加、編集、取得を行う
 */

import { getDatabase } from '../db/database.js';

/**
 * 全テンプレートを取得
 * @returns {Array} テンプレートリスト
 */
export function getAllTemplates() {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM approval_templates ORDER BY id');
  return stmt.all();
}

/**
 * IDでテンプレートを取得
 * @param {number} id テンプレートID
 * @returns {Object|null} テンプレート情報
 */
export function getTemplateById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM approval_templates WHERE id = ?');
  return stmt.get(id);
}

/**
 * 名前でテンプレートを取得
 * @param {string} name テンプレート名
 * @returns {Object|null} テンプレート情報
 */
export function getTemplateByName(name) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM approval_templates WHERE name = ?');
  return stmt.get(name);
}

/**
 * 新しいテンプレートを作成
 * @param {Object} templateData テンプレートデータ
 * @param {string} templateData.name テンプレート名（必須、一意）
 * @param {string} templateData.description 説明（任意）
 * @param {string} templateData.content Markdown形式の内容（必須）
 * @returns {Object} 作成されたテンプレート情報
 */
export function createTemplate(templateData) {
  const db = getDatabase();
  
  const { name, description, content } = templateData;

  if (!name || !content) {
    throw new Error('テンプレート名と内容は必須です');
  }

  const stmt = db.prepare(`
    INSERT INTO approval_templates (name, description, content)
    VALUES (?, ?, ?)
  `);

  try {
    const result = stmt.run(name, description || null, content);
    return getTemplateById(result.lastInsertRowid);
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      throw new Error('このテンプレート名は既に使用されています');
    }
    throw error;
  }
}

/**
 * テンプレートを更新
 * @param {number} id テンプレートID
 * @param {Object} templateData 更新するデータ
 * @param {string} templateData.name テンプレート名
 * @param {string} templateData.description 説明
 * @param {string} templateData.content 内容
 * @returns {Object} 更新されたテンプレート情報
 */
export function updateTemplate(id, templateData) {
  const db = getDatabase();

  const template = getTemplateById(id);
  if (!template) {
    throw new Error('テンプレートが見つかりません');
  }

  const { name, description, content } = templateData;

  const stmt = db.prepare(`
    UPDATE approval_templates
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        content = COALESCE(?, content),
        updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `);

  try {
    stmt.run(name || null, description || null, content || null, id);
    return getTemplateById(id);
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      throw new Error('このテンプレート名は既に使用されています');
    }
    throw error;
  }
}

/**
 * テンプレートを削除
 * @param {number} id テンプレートID
 * @returns {boolean} 削除成功
 */
export function deleteTemplate(id) {
  const db = getDatabase();

  const template = getTemplateById(id);
  if (!template) {
    throw new Error('テンプレートが見つかりません');
  }

  const stmt = db.prepare('DELETE FROM approval_templates WHERE id = ?');
  stmt.run(id);
  return true;
}
