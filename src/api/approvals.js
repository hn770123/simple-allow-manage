/**
 * 承認リクエスト管理API
 * 承認の作成、承認/却下、関連承認の管理を行う
 */

import { getDatabase } from '../db/database.js';
import { getUserById } from './users.js';
import { logApprovalResult } from '../utils/logger.js';

/**
 * 全承認リクエストを取得
 * @param {Object} filters フィルタ条件
 * @param {number} filters.fromUserId 申請者ID
 * @param {number} filters.toUserId 承認者ID
 * @param {string} filters.status ステータス
 * @returns {Array} 承認リクエストリスト
 */
export function getAllApprovals(filters = {}) {
  const db = getDatabase();
  let query = `
    SELECT 
      ar.*,
      u1.username as from_username,
      u1.display_name as from_display_name,
      u2.username as to_username,
      u2.display_name as to_display_name,
      at.name as template_name
    FROM approval_requests ar
    LEFT JOIN users u1 ON ar.from_user_id = u1.id
    LEFT JOIN users u2 ON ar.to_user_id = u2.id
    LEFT JOIN approval_templates at ON ar.template_id = at.id
    WHERE 1=1
  `;

  const params = [];

  if (filters.fromUserId) {
    query += ' AND ar.from_user_id = ?';
    params.push(filters.fromUserId);
  }

  if (filters.toUserId) {
    query += ' AND ar.to_user_id = ?';
    params.push(filters.toUserId);
  }

  if (filters.status) {
    query += ' AND ar.status = ?';
    params.push(filters.status);
  }

  query += ' ORDER BY ar.created_at DESC';

  const stmt = db.prepare(query);
  return stmt.all(...params);
}

/**
 * IDで承認リクエストを取得
 * @param {number} id 承認リクエストID
 * @returns {Object|null} 承認リクエスト情報
 */
export function getApprovalById(id) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT 
      ar.*,
      u1.username as from_username,
      u1.display_name as from_display_name,
      u2.username as to_username,
      u2.display_name as to_display_name,
      at.name as template_name,
      at.content as template_content
    FROM approval_requests ar
    LEFT JOIN users u1 ON ar.from_user_id = u1.id
    LEFT JOIN users u2 ON ar.to_user_id = u2.id
    LEFT JOIN approval_templates at ON ar.template_id = at.id
    WHERE ar.id = ?
  `);
  return stmt.get(id);
}

/**
 * 新しい承認リクエストを作成
 * @param {Object} requestData リクエストデータ
 * @param {number} requestData.fromUserId 申請者ID（必須）
 * @param {number} requestData.toUserId 承認者ID（必須）
 * @param {number} requestData.templateId テンプレートID（任意）
 * @param {string} requestData.title タイトル（必須）
 * @param {string} requestData.description 説明（任意）
 * @param {Array<number>} requestData.relatedRequestIds 関連する承認ID（任意）
 * @returns {Object} 作成された承認リクエスト情報
 */
export function createApproval(requestData) {
  const db = getDatabase();
  
  const { fromUserId, toUserId, templateId, title, description, relatedRequestIds } = requestData;

  if (!fromUserId || !toUserId || !title) {
    throw new Error('申請者、承認者、タイトルは必須です');
  }

  // ユーザーの存在確認
  if (!getUserById(fromUserId)) {
    throw new Error('申請者が見つかりません');
  }
  if (!getUserById(toUserId)) {
    throw new Error('承認者が見つかりません');
  }

  const stmt = db.prepare(`
    INSERT INTO approval_requests (from_user_id, to_user_id, template_id, title, description)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(fromUserId, toUserId, templateId || null, title, description || null);
  const newRequestId = result.lastInsertRowid;

  // 関連承認の追加
  if (relatedRequestIds && relatedRequestIds.length > 0) {
    const relatedStmt = db.prepare(`
      INSERT INTO related_approvals (request_id, related_request_id)
      VALUES (?, ?)
    `);

    for (const relatedId of relatedRequestIds) {
      try {
        relatedStmt.run(newRequestId, relatedId);
      } catch (error) {
        console.warn(`関連承認の追加に失敗: ${relatedId}`, error.message);
      }
    }
  }

  return getApprovalById(newRequestId);
}

/**
 * 承認リクエストを承認
 * @param {number} id 承認リクエストID
 * @param {string} comment コメント（任意）
 * @returns {Object} 更新された承認リクエスト情報
 */
export function approveRequest(id, comment = null) {
  const db = getDatabase();

  const approval = getApprovalById(id);
  if (!approval) {
    throw new Error('承認リクエストが見つかりません');
  }

  if (approval.status !== 'pending') {
    throw new Error('この承認リクエストは既に処理済みです');
  }

  const stmt = db.prepare(`
    UPDATE approval_requests
    SET status = 'allowed',
        result_comment = ?,
        updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `);

  stmt.run(comment, id);

  const updatedApproval = getApprovalById(id);

  // ログに記録
  logApprovalResult({
    requestId: id,
    fromUser: updatedApproval.from_display_name,
    toUser: updatedApproval.to_display_name,
    title: updatedApproval.title,
    status: 'allowed',
    comment: comment
  });

  return updatedApproval;
}

/**
 * 承認リクエストを却下
 * @param {number} id 承認リクエストID
 * @param {string} comment コメント（任意）
 * @returns {Object} 更新された承認リクエスト情報
 */
export function rejectRequest(id, comment = null) {
  const db = getDatabase();

  const approval = getApprovalById(id);
  if (!approval) {
    throw new Error('承認リクエストが見つかりません');
  }

  if (approval.status !== 'pending') {
    throw new Error('この承認リクエストは既に処理済みです');
  }

  const stmt = db.prepare(`
    UPDATE approval_requests
    SET status = 'rejected',
        result_comment = ?,
        updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `);

  stmt.run(comment, id);

  const updatedApproval = getApprovalById(id);

  // ログに記録
  logApprovalResult({
    requestId: id,
    fromUser: updatedApproval.from_display_name,
    toUser: updatedApproval.to_display_name,
    title: updatedApproval.title,
    status: 'rejected',
    comment: comment
  });

  return updatedApproval;
}

/**
 * 承認リクエストにコメントを追加
 * @param {number} requestId 承認リクエストID
 * @param {number} userId コメントするユーザーID
 * @param {string} comment コメント内容
 * @returns {Object} 追加されたコメント情報
 */
export function addComment(requestId, userId, comment) {
  const db = getDatabase();

  if (!getApprovalById(requestId)) {
    throw new Error('承認リクエストが見つかりません');
  }

  if (!getUserById(userId)) {
    throw new Error('ユーザーが見つかりません');
  }

  if (!comment) {
    throw new Error('コメントは必須です');
  }

  const stmt = db.prepare(`
    INSERT INTO approval_comments (request_id, user_id, comment)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(requestId, userId, comment);

  return {
    id: result.lastInsertRowid,
    requestId,
    userId,
    comment
  };
}

/**
 * 承認リクエストのコメントを取得
 * @param {number} requestId 承認リクエストID
 * @returns {Array} コメントリスト
 */
export function getComments(requestId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT 
      ac.*,
      u.username,
      u.display_name
    FROM approval_comments ac
    LEFT JOIN users u ON ac.user_id = u.id
    WHERE ac.request_id = ?
    ORDER BY ac.created_at ASC
  `);
  return stmt.all(requestId);
}

/**
 * 関連する承認リクエストを取得（結果も含む）
 * @param {number} requestId 承認リクエストID
 * @returns {Array} 関連する承認リクエストリスト
 */
export function getRelatedApprovals(requestId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT 
      ar.*,
      u1.username as from_username,
      u1.display_name as from_display_name,
      u2.username as to_username,
      u2.display_name as to_display_name
    FROM related_approvals ra
    JOIN approval_requests ar ON ra.related_request_id = ar.id
    LEFT JOIN users u1 ON ar.from_user_id = u1.id
    LEFT JOIN users u2 ON ar.to_user_id = u2.id
    WHERE ra.request_id = ?
    ORDER BY ar.created_at DESC
  `);
  return stmt.all(requestId);
}

/**
 * 承認リクエストに関連承認を追加
 * @param {number} requestId 承認リクエストID
 * @param {number} relatedRequestId 関連させる承認リクエストID
 * @returns {Object} 追加された関連情報
 */
export function addRelatedApproval(requestId, relatedRequestId) {
  const db = getDatabase();

  if (!getApprovalById(requestId)) {
    throw new Error('承認リクエストが見つかりません');
  }

  if (!getApprovalById(relatedRequestId)) {
    throw new Error('関連させる承認リクエストが見つかりません');
  }

  const stmt = db.prepare(`
    INSERT INTO related_approvals (request_id, related_request_id)
    VALUES (?, ?)
  `);

  try {
    const result = stmt.run(requestId, relatedRequestId);
    return {
      id: result.lastInsertRowid,
      requestId,
      relatedRequestId
    };
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      throw new Error('この関連は既に存在します');
    }
    throw error;
  }
}
