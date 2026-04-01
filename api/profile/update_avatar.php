<?php
// api/profile/update_avatar.php
if (session_status() === PHP_SESSION_NONE) session_start();
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../../includes/functions.php';

$data = json_decode(file_get_contents("php://input"), true);
$url = $data['profile_pic'] ?? '';

if ($url && isset($_SESSION['user_id'])) {
    dbQuery($conn, "UPDATE users SET profile_pic = ? WHERE user_id = ?", [$url, $_SESSION['user_id']]);
    sendResponse(true, "Avatar updated!");
} else {
    sendResponse(false, "Failed to update avatar.");
}