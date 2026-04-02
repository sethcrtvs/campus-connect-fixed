<?php
if (session_status() === PHP_SESSION_NONE) session_start();
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../../includes/functions.php';
require_once '../utils/mailer.php';

$data   = json_decode(file_get_contents("php://input"), true);
$email  = strtolower(trim($data['email'] ?? ''));
$action = $data['action'] ?? 'verify';

if (empty($email)) sendResponse(false, "Email is required.");

if ($action === 'resend') {
    $user = dbQuery($conn, "SELECT full_name FROM users WHERE email = ?", [$email])->fetch();
    if (!$user) sendResponse(false, "User not found.");
    $newOtp     = mt_rand(100000, 999999);
    $newExpires = date('Y-m-d H:i:s', strtotime('+15 minutes'));
    dbQuery($conn, "UPDATE users SET verification_code = ?, code_expires_at = ? WHERE email = ?", [$newOtp, $newExpires, $email]);
    if (Mailer::sendOTP($email, $user['full_name'], $newOtp)) {
        sendResponse(true, "A new 6-digit code has been sent to your email.");
    } else {
        sendResponse(false, "Failed to send email. Check your connection.");
    }
    exit;
}

$otp = trim($data['otp'] ?? '');
if (empty($otp)) sendResponse(false, "Invalid or expired verification code.");

// Validate format — must be exactly 6 digits
if (!preg_match('/^\d{6}$/', $otp)) {
    sendResponse(false, "Invalid or expired verification code.");
}

$sql    = "SELECT user_id, full_name, university, role, verification_code, code_expires_at FROM users WHERE email = ?";
$user   = dbQuery($conn, $sql, [$email])->fetch(PDO::FETCH_ASSOC);

if (!$user) sendResponse(false, "User not found.");

if ($user['verification_code'] !== $otp) {
    sendResponse(false, "Invalid or expired verification code.");
}

if (strtotime($user['code_expires_at']) < time()) {
    sendResponse(false, "Invalid or expired verification code.");
}

dbQuery($conn, "UPDATE users SET is_verified = 1, verification_code = NULL, code_expires_at = NULL WHERE user_id = ?", [$user['user_id']]);
$_SESSION['user_id']    = $user['user_id'];
$_SESSION['full_name']  = $user['full_name'];
$_SESSION['university'] = $user['university'];
$_SESSION['role']       = $user['role'];
sendResponse(true, "Account verified successfully!");
