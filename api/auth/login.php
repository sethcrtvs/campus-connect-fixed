<?php
// api/auth/login.php
if (session_status() === PHP_SESSION_NONE) session_start();
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../../includes/functions.php';

$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

$sql = "SELECT user_id, full_name, university, role, password_hash, is_verified FROM users WHERE email = ?";
$result = dbQuery($conn, $sql, [$email]);
$user = $result->fetch(PDO::FETCH_ASSOC);

if ($user && password_verify($password, $user['password_hash'])) {
    
    // GUARD: Check if the account is verified
    if (!$user['is_verified']) {
        echo json_encode([
            "success" => false,
            "needs_verification" => true,
            "message" => "Account not verified. Please enter the code sent to your student email.",
            "email" => $email
        ]);
        exit;
    }

    // Success: Set session variables
    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['full_name'] = $user['full_name'];
    $_SESSION['university'] = $user['university'];
    $_SESSION['role'] = $user['role'];
    
    sendResponse(true, "Login successful!");
} else {
    sendResponse(false, "Invalid email or password.");
}
?>