<?php
// api/social/send_request.php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$data = json_decode(file_get_contents("php://input"), true);
$senderId = $_SESSION['user_id'];
$receiverId = $data['receiverId'] ?? null;

if (!$receiverId || $senderId == $receiverId) {
    sendResponse(false, "Invalid user selection.");
}

try {
    // Logic: Ensure user_id_1 is always the smaller ID to keep the unique key consistent
    $id1 = min($senderId, $receiverId);
    $id2 = max($senderId, $receiverId);

    // Check if they are already friends or if a request is pending
    $checkSql = "SELECT status FROM friendships WHERE user_id_1 = ? AND user_id_2 = ?";
    $existing = dbQuery($conn, $checkSql, [$id1, $id2])->fetch();

    if ($existing) {
        $msg = ($existing['status'] == 'pending') ? "Request already pending." : "You are already friends!";
        sendResponse(false, $msg);
        exit;
    }

    // Insert the new request
    $sql = "INSERT INTO friendships (user_id_1, user_id_2, status) VALUES (?, ?, 'pending')";
    dbQuery($conn, $sql, [$id1, $id2]);

    sendResponse(true, "Friend request sent!");

} catch (Exception $e) {
    sendResponse(false, "System error: " . $e->getMessage());
}