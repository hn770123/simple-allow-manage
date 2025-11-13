/**
 * メインアプリケーションエントリーポイント
 * シンプルなCLIインターフェースを提供
 */

import readline from 'readline';
import { initializeDatabase, getDatabase, closeDatabase } from './db/database.js';
import * as users from './api/users.js';
import * as templates from './api/templates.js';
import * as approvals from './api/approvals.js';

// データベースの初期化
initializeDatabase();

// readline インターフェースの作成
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * プロンプト表示とユーザー入力待ち
 * @param {string} question 質問文
 * @returns {Promise<string>} ユーザーの入力
 */
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * メインメニューを表示
 */
function displayMainMenu() {
  console.log('\n=== 承認管理システム ===');
  console.log('1. ユーザー管理');
  console.log('2. テンプレート管理');
  console.log('3. 承認リクエスト管理');
  console.log('4. 承認リクエストを作成');
  console.log('5. 承認リクエストを処理（承認/却下）');
  console.log('6. 承認リクエストを表示');
  console.log('0. 終了');
  console.log('========================\n');
}

/**
 * ユーザー管理メニュー
 */
async function userManagement() {
  console.log('\n--- ユーザー管理 ---');
  console.log('1. ユーザー一覧');
  console.log('2. ユーザー追加');
  console.log('3. ユーザー更新');
  console.log('0. 戻る');

  const choice = await prompt('選択してください: ');

  switch (choice) {
    case '1':
      const allUsers = users.getAllUsers();
      console.log('\n【ユーザー一覧】');
      allUsers.forEach(u => {
        console.log(`ID:${u.id} ${u.username} (${u.display_name}) - ${u.email || 'メールなし'}`);
      });
      break;

    case '2':
      const username = await prompt('ユーザー名: ');
      const displayName = await prompt('表示名: ');
      const email = await prompt('メールアドレス (任意): ');
      try {
        const newUser = users.createUser({ username, display_name: displayName, email });
        console.log('✓ ユーザーを作成しました:', newUser);
      } catch (error) {
        console.error('✗ エラー:', error.message);
      }
      break;

    case '3':
      const userId = await prompt('ユーザーID: ');
      const newDisplayName = await prompt('新しい表示名 (空白で変更なし): ');
      const newEmail = await prompt('新しいメールアドレス (空白で変更なし): ');
      try {
        const updated = users.updateUser(parseInt(userId), {
          display_name: newDisplayName || undefined,
          email: newEmail || undefined
        });
        console.log('✓ ユーザーを更新しました:', updated);
      } catch (error) {
        console.error('✗ エラー:', error.message);
      }
      break;
  }
}

/**
 * テンプレート管理メニュー
 */
async function templateManagement() {
  console.log('\n--- テンプレート管理 ---');
  console.log('1. テンプレート一覧');
  console.log('2. テンプレート追加');
  console.log('3. テンプレート表示');
  console.log('0. 戻る');

  const choice = await prompt('選択してください: ');

  switch (choice) {
    case '1':
      const allTemplates = templates.getAllTemplates();
      console.log('\n【テンプレート一覧】');
      allTemplates.forEach(t => {
        console.log(`ID:${t.id} ${t.name} - ${t.description || '説明なし'}`);
      });
      break;

    case '2':
      const name = await prompt('テンプレート名: ');
      const description = await prompt('説明 (任意): ');
      console.log('Markdown形式の内容を入力してください (終了は空行):');
      let content = '';
      while (true) {
        const line = await prompt('');
        if (!line) break;
        content += line + '\n';
      }
      try {
        const newTemplate = templates.createTemplate({ name, description, content });
        console.log('✓ テンプレートを作成しました:', newTemplate.name);
      } catch (error) {
        console.error('✗ エラー:', error.message);
      }
      break;

    case '3':
      const templateId = await prompt('テンプレートID: ');
      try {
        const template = templates.getTemplateById(parseInt(templateId));
        if (template) {
          console.log('\n【テンプレート】');
          console.log(`名前: ${template.name}`);
          console.log(`説明: ${template.description || 'なし'}`);
          console.log('--- 内容 ---');
          console.log(template.content);
          console.log('-------------');
        } else {
          console.log('テンプレートが見つかりません');
        }
      } catch (error) {
        console.error('✗ エラー:', error.message);
      }
      break;
  }
}

/**
 * 承認リクエスト一覧表示
 */
async function listApprovals() {
  console.log('\n--- 承認リクエスト一覧 ---');
  console.log('1. 全て');
  console.log('2. 申請者でフィルタ');
  console.log('3. 承認者でフィルタ');
  console.log('4. ステータスでフィルタ');

  const choice = await prompt('選択してください: ');
  let filters = {};

  switch (choice) {
    case '2':
      const fromUserId = await prompt('申請者ID: ');
      filters.fromUserId = parseInt(fromUserId);
      break;
    case '3':
      const toUserId = await prompt('承認者ID: ');
      filters.toUserId = parseInt(toUserId);
      break;
    case '4':
      const status = await prompt('ステータス (pending/allowed/rejected): ');
      filters.status = status;
      break;
  }

  const allApprovals = approvals.getAllApprovals(filters);
  console.log('\n【承認リクエスト一覧】');
  allApprovals.forEach(a => {
    const statusText = a.status === 'pending' ? '保留中' : a.status === 'allowed' ? '承認済' : '却下済';
    console.log(`ID:${a.id} [${statusText}] ${a.title}`);
    console.log(`  申請者: ${a.from_display_name} → 承認者: ${a.to_display_name}`);
    console.log(`  作成日: ${a.created_at}`);
  });
}

/**
 * 承認リクエスト作成
 */
async function createApproval() {
  console.log('\n--- 承認リクエスト作成 ---');

  const fromUserId = await prompt('申請者ID: ');
  const toUserId = await prompt('承認者ID: ');
  const title = await prompt('タイトル: ');
  const description = await prompt('説明 (任意): ');
  const templateId = await prompt('テンプレートID (任意): ');
  const relatedIds = await prompt('関連する承認ID (カンマ区切り、任意): ');

  try {
    const requestData = {
      fromUserId: parseInt(fromUserId),
      toUserId: parseInt(toUserId),
      title,
      description: description || undefined,
      templateId: templateId ? parseInt(templateId) : undefined,
      relatedRequestIds: relatedIds ? relatedIds.split(',').map(id => parseInt(id.trim())) : undefined
    };

    const newApproval = approvals.createApproval(requestData);
    console.log('✓ 承認リクエストを作成しました:', newApproval);
  } catch (error) {
    console.error('✗ エラー:', error.message);
  }
}

/**
 * 承認リクエスト処理
 */
async function processApproval() {
  console.log('\n--- 承認リクエスト処理 ---');

  const requestId = await prompt('承認リクエストID: ');
  const approval = approvals.getApprovalById(parseInt(requestId));

  if (!approval) {
    console.log('承認リクエストが見つかりません');
    return;
  }

  console.log('\n【承認リクエスト詳細】');
  console.log(`タイトル: ${approval.title}`);
  console.log(`申請者: ${approval.from_display_name}`);
  console.log(`承認者: ${approval.to_display_name}`);
  console.log(`ステータス: ${approval.status}`);
  if (approval.description) {
    console.log(`説明: ${approval.description}`);
  }

  // 関連承認の表示
  const related = approvals.getRelatedApprovals(parseInt(requestId));
  if (related.length > 0) {
    console.log('\n【関連する承認】');
    related.forEach(r => {
      const statusText = r.status === 'pending' ? '保留中' : r.status === 'allowed' ? '承認済' : '却下済';
      console.log(`  ID:${r.id} [${statusText}] ${r.title}`);
    });
  }

  if (approval.status !== 'pending') {
    console.log('\nこの承認リクエストは既に処理済みです');
    return;
  }

  console.log('\n1. 承認 (allow)');
  console.log('2. 却下 (reject)');
  console.log('0. キャンセル');

  const choice = await prompt('選択してください: ');
  const comment = await prompt('コメント (任意): ');

  try {
    let result;
    if (choice === '1') {
      result = approvals.approveRequest(parseInt(requestId), comment || null);
      console.log('✓ 承認しました');
    } else if (choice === '2') {
      result = approvals.rejectRequest(parseInt(requestId), comment || null);
      console.log('✓ 却下しました');
    } else {
      console.log('キャンセルしました');
      return;
    }
    console.log(result);
  } catch (error) {
    console.error('✗ エラー:', error.message);
  }
}

/**
 * 承認リクエスト詳細表示
 */
async function viewApproval() {
  console.log('\n--- 承認リクエスト詳細 ---');

  const requestId = await prompt('承認リクエストID: ');
  const approval = approvals.getApprovalById(parseInt(requestId));

  if (!approval) {
    console.log('承認リクエストが見つかりません');
    return;
  }

  console.log('\n【承認リクエスト詳細】');
  console.log(`ID: ${approval.id}`);
  console.log(`タイトル: ${approval.title}`);
  console.log(`申請者: ${approval.from_display_name} (${approval.from_username})`);
  console.log(`承認者: ${approval.to_display_name} (${approval.to_username})`);
  console.log(`ステータス: ${approval.status}`);
  console.log(`作成日: ${approval.created_at}`);
  
  if (approval.description) {
    console.log(`\n説明:\n${approval.description}`);
  }

  if (approval.template_name) {
    console.log(`\nテンプレート: ${approval.template_name}`);
  }

  if (approval.result_comment) {
    console.log(`\n結果コメント: ${approval.result_comment}`);
  }

  // コメント表示
  const comments = approvals.getComments(parseInt(requestId));
  if (comments.length > 0) {
    console.log('\n【コメント】');
    comments.forEach(c => {
      console.log(`  ${c.display_name} (${c.created_at}): ${c.comment}`);
    });
  }

  // 関連承認の表示
  const related = approvals.getRelatedApprovals(parseInt(requestId));
  if (related.length > 0) {
    console.log('\n【関連する承認】');
    related.forEach(r => {
      const statusText = r.status === 'pending' ? '保留中' : r.status === 'allowed' ? '承認済' : '却下済';
      console.log(`  ID:${r.id} [${statusText}] ${r.title}`);
      console.log(`    申請者: ${r.from_display_name} → 承認者: ${r.to_display_name}`);
    });
  }
}

/**
 * メインループ
 */
async function main() {
  console.log('承認管理システムを起動しました');

  while (true) {
    displayMainMenu();
    const choice = await prompt('選択してください: ');

    switch (choice) {
      case '1':
        await userManagement();
        break;
      case '2':
        await templateManagement();
        break;
      case '3':
        await listApprovals();
        break;
      case '4':
        await createApproval();
        break;
      case '5':
        await processApproval();
        break;
      case '6':
        await viewApproval();
        break;
      case '0':
        console.log('システムを終了します');
        closeDatabase();
        rl.close();
        process.exit(0);
      default:
        console.log('無効な選択です');
    }
  }
}

// アプリケーション開始
main().catch(error => {
  console.error('エラーが発生しました:', error);
  closeDatabase();
  rl.close();
  process.exit(1);
});
