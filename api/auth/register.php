<?php
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../../includes/functions.php';
require_once '../utils/mailer.php';

$data       = json_decode(file_get_contents("php://input"), true);
$fullName   = trim($data['fullName']   ?? '');
$email      = strtolower(trim($data['email'] ?? ''));
$password   = $data['password']   ?? '';
$university = $data['university'] ?? '';

// 1. University email check
if (!str_ends_with($email, '.ac.ke') && !str_ends_with($email, '.edu')) {
    sendResponse(false, "Please use your university email address.");
}

// 2. Domain-university match
$domainMap = [
    "KCA University"       => "kcau.ac.ke",
    "JKUAT"                => "jkuat.ac.ke",
    "University of Nairobi"=> "uonbi.ac.ke",
    "Kenyatta University"  => "ku.ac.ke",
    "Strathmore University"=> "strathmore.edu",
];
$expectedDomain = $domainMap[$university] ?? '';
if ($expectedDomain && !str_ends_with($email, $expectedDomain)) {
    sendResponse(false, "Please use your university email address. Expected: @$expectedDomain");
}

// 3. Password length
if (strlen($password) < 8) {
    sendResponse(false, "Password must be at least 8 characters.");
}

// 4. Duplicate email
if (dbQuery($conn, "SELECT user_id FROM users WHERE email = ?", [$email])->fetch()) {
    sendResponse(false, "Email already registered.");
}

// 5. Hash + OTP
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);
$otp       = mt_rand(100000, 999999);
$expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

$sql    = "INSERT INTO users (full_name, email, password_hash, university, verification_code, code_expires_at, is_verified) VALUES (?, ?, ?, ?, ?, ?, 0)";
$params = [$fullName, $email, $hashedPassword, $university, $otp, $expiresAt];

if (dbQuery($conn, $sql, $params)) {
    if (Mailer::sendOTP($email, $fullName, $otp)) {
        echo json_encode([
            "success"  => true,
            "message"  => "Account created! Check your student email for your 6-digit verification code.",
            "redirect" => "verify.html",
            "email"    => $email,
        ]);
    } else {
        dbQuery($conn, "DELETE FROM users WHERE email = ?", [$email]);
        sendResponse(false, "Failed to send verification email. Please try again.");
    }
}
