/**
 * ログ出力ユーティリティ
 * 承認結果をファイルとコンソールに出力
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ログディレクトリのパス
const LOG_DIR = path.join(__dirname, '../../logs');

/**
 * ログディレクトリを初期化
 */
function ensureLogDirectory() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * 現在の日付をYYYY-MM-DD形式で取得
 * @returns {string} 日付文字列
 */
function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * 現在の日時をフォーマット
 * @returns {string} 日時文字列
 */
function getCurrentDateTime() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * 承認結果をログファイルに出力
 * @param {Object} logData ログデータ
 * @param {number} logData.requestId リクエストID
 * @param {string} logData.fromUser 申請者
 * @param {string} logData.toUser 承認者
 * @param {string} logData.title タイトル
 * @param {string} logData.status 結果（allowed/rejected）
 * @param {string} logData.comment コメント（任意）
 */
export function logApprovalResult(logData) {
  ensureLogDirectory();

  const { requestId, fromUser, toUser, title, status, comment } = logData;
  const date = getCurrentDate();
  const datetime = getCurrentDateTime();
  const logFile = path.join(LOG_DIR, `approvals_${date}.log`);

  // ログメッセージの作成
  const statusText = status === 'allowed' ? '承認' : '却下';
  let logMessage = `[${datetime}] ID:${requestId} ${statusText}\n`;
  logMessage += `  申請者: ${fromUser}\n`;
  logMessage += `  承認者: ${toUser}\n`;
  logMessage += `  タイトル: ${title}\n`;
  if (comment) {
    logMessage += `  コメント: ${comment}\n`;
  }
  logMessage += '\n';

  // ファイルに追記
  fs.appendFileSync(logFile, logMessage, 'utf8');

  // コンソールにも出力
  console.log(`承認結果をログに記録しました: ${logFile}`);
  console.log(logMessage);
}

/**
 * 一般的なログメッセージを出力
 * @param {string} message ログメッセージ
 * @param {string} level ログレベル（info/warn/error）
 */
export function log(message, level = 'info') {
  ensureLogDirectory();

  const date = getCurrentDate();
  const datetime = getCurrentDateTime();
  const logFile = path.join(LOG_DIR, `system_${date}.log`);

  const logMessage = `[${datetime}] [${level.toUpperCase()}] ${message}\n`;

  // ファイルに追記
  fs.appendFileSync(logFile, logMessage, 'utf8');

  // コンソールにも出力
  console.log(logMessage.trim());
}
