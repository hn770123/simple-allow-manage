/**
 * データベース初期化スクリプト
 * テーブルの作成とサンプルデータの投入
 */

import { initializeDatabase, getDatabase, closeDatabase } from './database.js';

/**
 * サンプルデータを投入
 */
function seedData() {
  const db = getDatabase();

  // サンプルユーザーの作成
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, display_name, email)
    VALUES (?, ?, ?)
  `);

  insertUser.run('admin', '管理者', 'admin@example.com');
  insertUser.run('user1', 'ユーザー1', 'user1@example.com');
  insertUser.run('user2', 'ユーザー2', 'user2@example.com');

  console.log('サンプルユーザーを作成しました');

  // サンプルテンプレートの作成
  const insertTemplate = db.prepare(`
    INSERT OR IGNORE INTO approval_templates (name, description, content)
    VALUES (?, ?, ?)
  `);

  insertTemplate.run(
    '休暇申請',
    '休暇を申請する際のテンプレート',
    `# 休暇申請

## 申請内容
- 申請者: {申請者名}
- 休暇期間: {開始日} ～ {終了日}
- 休暇種類: {有給/無給/その他}
- 理由: {理由}

## 承認者への連絡事項
{連絡事項}
`
  );

  insertTemplate.run(
    '経費申請',
    '経費精算を申請する際のテンプレート',
    `# 経費申請

## 申請内容
- 申請者: {申請者名}
- 金額: {金額}円
- 使用目的: {目的}
- 使用日: {使用日}
- 領収書: {あり/なし}

## 詳細
{詳細説明}
`
  );

  insertTemplate.run(
    'アクセス権限申請',
    'システムやリソースへのアクセス権限を申請',
    `# アクセス権限申請

## 申請内容
- 申請者: {申請者名}
- 対象システム: {システム名}
- 権限レベル: {読み取り/書き込み/管理者}
- 必要期間: {期間}

## 理由
{理由の説明}
`
  );

  console.log('サンプルテンプレートを作成しました');
}

// 初期化実行
try {
  console.log('データベースの初期化を開始します...');
  initializeDatabase();
  seedData();
  console.log('データベースの初期化が完了しました！');
} catch (error) {
  console.error('初期化中にエラーが発生しました:', error);
} finally {
  closeDatabase();
}
