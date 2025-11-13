/**
 * 承認管理システムの使用例
 * プログラムから各機能を使用する方法を示します
 */

import { initializeDatabase, closeDatabase } from './src/db/database.js';
import * as users from './src/api/users.js';
import * as templates from './src/api/templates.js';
import * as approvals from './src/api/approvals.js';

// データベース初期化
initializeDatabase();

console.log('=== 承認管理システム 使用例 ===\n');

// 例1: ユーザーの作成
console.log('【例1】 ユーザーの作成');
const user1 = users.createUser({
  username: 'yamada',
  display_name: '山田太郎',
  email: 'yamada@example.com'
});
console.log(`作成されたユーザー: ${user1.username} (ID: ${user1.id})`);
console.log();

// 例2: テンプレートの作成
console.log('【例2】 Markdownテンプレートの作成');
const vacationTemplate = templates.createTemplate({
  name: '夏季休暇申請',
  description: '夏季休暇用のテンプレート',
  content: `# 夏季休暇申請

## 申請内容
- 休暇期間: 8月10日 ～ 8月20日
- 休暇日数: 10日間
- 理由: 夏季休暇

## 緊急連絡先
携帯電話: 090-XXXX-XXXX
`
});
console.log(`作成されたテンプレート: ${vacationTemplate.name} (ID: ${vacationTemplate.id})`);
console.log();

// 例3: 承認リクエストの作成
console.log('【例3】 承認リクエストの作成');
const approvalRequest = approvals.createApproval({
  fromUserId: user1.id,        // 申請者: 山田太郎
  toUserId: 1,                 // 承認者: 管理者
  templateId: vacationTemplate.id,
  title: '2024年夏季休暇の申請',
  description: '8月に家族旅行を予定しているため、休暇を申請します。'
});
console.log(`作成された承認リクエスト: ${approvalRequest.title} (ID: ${approvalRequest.id})`);
console.log();

// 例4: コメントの追加
console.log('【例4】 承認リクエストにコメントを追加');
approvals.addComment(
  approvalRequest.id,
  1,  // 管理者
  '内容を確認しました。問題ありません。'
);
console.log('コメントを追加しました');
console.log();

// 例5: 承認リクエストの承認
console.log('【例5】 承認リクエストを承認');
const approvedRequest = approvals.approveRequest(
  approvalRequest.id,
  '承認します。良い休暇をお過ごしください！'
);
console.log(`承認完了: ${approvedRequest.title}`);
console.log(`ステータス: ${approvedRequest.status}`);
console.log();

// 例6: 関連承認付きリクエストの作成
console.log('【例6】 関連承認を含むリクエストの作成');
const relatedRequest = approvals.createApproval({
  fromUserId: user1.id,
  toUserId: 1,
  title: '休暇期間中の経費精算',
  description: '先ほどの休暇申請に関連する経費精算です。',
  relatedRequestIds: [approvalRequest.id]  // 前の承認と関連付け
});
console.log(`関連承認付きリクエストを作成: ID ${relatedRequest.id}`);
console.log();

// 例7: 関連承認の取得
console.log('【例7】 関連承認の参照');
const relatedApprovals = approvals.getRelatedApprovals(relatedRequest.id);
console.log(`関連する承認: ${relatedApprovals.length}件`);
relatedApprovals.forEach(r => {
  console.log(`  - ID:${r.id} [${r.status}] ${r.title}`);
});
console.log();

// 例8: 承認リクエストの却下
console.log('【例8】 承認リクエストを却下');
const rejectedRequest = approvals.rejectRequest(
  relatedRequest.id,
  '領収書の添付が必要です。再申請してください。'
);
console.log(`却下完了: ${rejectedRequest.title}`);
console.log(`ステータス: ${rejectedRequest.status}`);
console.log();

// 例9: 承認リクエストのフィルタリング
console.log('【例9】 承認リクエストのフィルタリング');
const userApprovals = approvals.getAllApprovals({ fromUserId: user1.id });
console.log(`${user1.display_name}さんの申請: ${userApprovals.length}件`);
userApprovals.forEach(a => {
  console.log(`  - [${a.status}] ${a.title}`);
});
console.log();

// 例10: 承認リクエストの詳細表示
console.log('【例10】 承認リクエストの詳細表示');
const detail = approvals.getApprovalById(approvalRequest.id);
console.log('詳細情報:');
console.log(`  タイトル: ${detail.title}`);
console.log(`  申請者: ${detail.from_display_name}`);
console.log(`  承認者: ${detail.to_display_name}`);
console.log(`  テンプレート: ${detail.template_name}`);
console.log(`  ステータス: ${detail.status}`);
console.log(`  結果コメント: ${detail.result_comment}`);

const comments = approvals.getComments(approvalRequest.id);
if (comments.length > 0) {
  console.log('  コメント:');
  comments.forEach(c => {
    console.log(`    ${c.display_name}: ${c.comment}`);
  });
}
console.log();

console.log('=== 使用例の実行が完了しました ===');
console.log('ログファイルは logs/approvals_*.log に保存されています');

// クリーンアップ
closeDatabase();
