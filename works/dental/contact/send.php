<?php
/* ============================================================
   send.php — お問い合わせフォーム送信テンプレート
   Xserver + mail() で動作する雛形。

   【案件ごとの設定】
   1. $TO_EMAIL を納品先のメールアドレスに変更
   2. $SITE_NAME をサイト名に変更
   3. 必要に応じてフィールドを追加・変更
   4. Xserverの場合、php.ini の sendmail_path はデフォルトでOK

   【設置場所】
   サイトルート/contact/send.php
   form.js の SUBMIT_URL を './contact/send.php' に設定
============================================================ */

// ============================================================
// 案件ごとに差し替え
// ============================================================
$TO_EMAIL  = 'info@example.com';       // 送信先メールアドレス
$SITE_NAME = 'サイト名';               // メール件名に使用
$FROM_NAME = 'お問い合わせフォーム';    // 送信者名（From表示）

// ============================================================
// POST以外は拒否
// ============================================================
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method Not Allowed']);
    exit;
}

// ============================================================
// JSON で返す
// ============================================================
header('Content-Type: application/json; charset=utf-8');

// ============================================================
// 入力取得・サニタイズ
// ============================================================
$name    = trim(strip_tags($_POST['name']    ?? ''));
$email   = trim(strip_tags($_POST['email']   ?? ''));
$message = trim(strip_tags($_POST['message'] ?? ''));

// ============================================================
// バリデーション
// ============================================================
$errors = [];

if ($name === '') {
    $errors['name'] = 'お名前を入力してください。';
}

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = '正しいメールアドレスを入力してください。';
}

if ($message === '') {
    $errors['message'] = 'メッセージを入力してください。';
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'errors' => $errors]);
    exit;
}

// ============================================================
// メール送信
// ============================================================
$subject = "【{$SITE_NAME}】お問い合わせ：{$name} 様";

$body = <<<EOT
{$SITE_NAME} お問い合わせフォームから送信されました。

━━━━━━━━━━━━━━━━━━━━
お名前: {$name}
メール: {$email}
━━━━━━━━━━━━━━━━━━━━

{$message}

━━━━━━━━━━━━━━━━━━━━
EOT;

$headers  = "From: {$FROM_NAME} <{$TO_EMAIL}>\r\n";
$headers .= "Reply-To: {$name} <{$email}>\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$result = mb_send_mail($TO_EMAIL, $subject, $body, $headers);

if ($result) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'メール送信に失敗しました。']);
}
