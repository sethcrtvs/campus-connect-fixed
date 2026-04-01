<?php
if (session_status() === PHP_SESSION_NONE) session_start();
require_once '../../includes/functions.php';
require_once '../config/database.php';
header('Content-Type: application/json');

if (isset($_SESSION['user_id'])) {
    $user_id = $_SESSION['user_id'];
    $sql = "SELECT user_id, full_name, university, role, is_verified, email, profile_pic FROM users WHERE user_id = ?";
    $result = dbQuery($conn, $sql, [$user_id]);
    $user = $result->fetch(PDO::FETCH_ASSOC);

    if (!$user || $user['is_verified'] == 0) {
        session_destroy();
        echo json_encode([
            "success" => false,
            "message" => "Account unverified.",
            "needs_reverification" => true,
            "email" => $user ? $user['email'] : null
        ]);
        exit;
    }

    sendResponse(true, "Session active", [
        "user_id"     => (int)$user['user_id'],
        "full_name"   => $user['full_name'],
        "university"  => $user['university'],
        "role"        => $user['role'],
        "is_verified" => (int)$user['is_verified'],
        "profile_pic" => $user['profile_pic'] ?? null
    ]);
} else {
    sendResponse(false, "No active session");
}
