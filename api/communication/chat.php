<?php
// api/communication/chat.php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$myId = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $groupId = $_GET['groupId'] ?? null;
    $friendId = $_GET['friendId'] ?? null;

    if ($groupId) {
        $sql = "SELECT m.message_id, m.sender_id, m.message_text, m.created_at, m.is_system, u.full_name 
                FROM messages m 
                JOIN users u ON m.sender_id = u.user_id 
                WHERE m.group_id = ? AND m.receiver_id IS NULL 
                ORDER BY m.created_at ASC";
        $stmt = dbQuery($conn, $sql, [$groupId]);
    } elseif ($friendId) {
        $sql = "SELECT m.message_id, m.sender_id, m.message_text, m.created_at, m.is_system, u.full_name 
                FROM messages m 
                JOIN users u ON m.sender_id = u.user_id 
                WHERE m.group_id IS NULL AND (
                    (m.sender_id = ? AND m.receiver_id = ?) OR 
                    (m.sender_id = ? AND m.receiver_id = ?)
                ) ORDER BY m.created_at ASC";
        $stmt = dbQuery($conn, $sql, [$myId, $friendId, $friendId, $myId]);
    }

    $msgs = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
    sendResponse(true, "Messages loaded", $msgs);
}

else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $groupId = $data['groupId'] ?? null;
    $receiverId = $data['receiverId'] ?? null;
    $text = trim($data['messageText']);
    $attachment = $data['attachment'] ?? null;

    if (empty($text) && !$attachment) {
        sendResponse(false, "Cannot send empty message.");
    }

    // Default is_system to 0 for user-sent messages
    $sql = "INSERT INTO messages (sender_id, group_id, receiver_id, message_text, attachment_path, is_system) VALUES (?, ?, ?, ?, ?, 0)";
    dbQuery($conn, $sql, [$myId, $groupId, $receiverId, $text, $attachment]);

    sendResponse(true, "Sent!");
}