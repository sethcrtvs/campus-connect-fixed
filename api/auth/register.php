<?php
// api/auth/register.php
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../../includes/functions.php';
require_once '../utils/mailer.php'; // Include our new Mailer utility

$data = json_decode(file_get_contents("php://input"), true);
$fullName = $data['fullName'] ?? '';
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';
$university = $data['university'] ?? '';

// 1. Validation Logic
if (!str_ends_with(strtolower($email), '.ac.ke') && !str_ends_with(strtolower($email), '.edu')) {
    sendResponse(false, "Only university emails are allowed.");
}

// 2. Domain Mapping Check
$domainMap = [
    "KCA University" => "kcau.ac.ke",
    "JKUAT" => "jkuat.ac.ke",
    "University of Nairobi" => "uonbi.ac.ke",
    "Kenyatta University" => "ku.ac.ke",
    "Strathmore University" => "strathmore.edu"
];

$expectedDomain = $domainMap[$university] ?? '';
if (!str_ends_with(strtolower($email), $expectedDomain)) {
    sendResponse(false, "Email domain does not match the selected university ($expectedDomain).");
}

// 3. Check for Duplicate Email
$checkEmail = dbQuery($conn, "SELECT user_id FROM users WHERE email = ?", [$email]);
if ($checkEmail->fetch()) {
    sendResponse(false, "This email is already registered.");
}

// 4. Secure Hashing & OTP Generation
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);
$otp = mt_rand(100000, 999999); // Generate 6-digit code
$expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes')); // Set 15 min expiry

// 5. Database Insertion (is_verified defaults to 0)
$sql = "INSERT INTO users (full_name, email, password_hash, university, verification_code, code_expires_at, is_verified) VALUES (?, ?, ?, ?, ?, ?, 0)";
$params = [$fullName, $email, $hashedPassword, $university, $otp, $expiresAt];

if (dbQuery($conn, $sql, $params)) {
    // 6. Attempt to send the OTP email
    if (Mailer::sendOTP($email, $fullName, $otp)) {
        echo json_encode([
            "success" => true,
            "message" => "Registration successful! Check your student email for the 6-digit verification code.",
            "redirect" => "verify.html",
            "email" => $email
        ]);
    } else {
        // If mailer fails, we delete the user entry so they can try again immediately
        dbQuery($conn, "DELETE FROM users WHERE email = ?", [$email]);
        sendResponse(false, "Failed to send verification email. Please check your internet or try again.");
    }
}
?>