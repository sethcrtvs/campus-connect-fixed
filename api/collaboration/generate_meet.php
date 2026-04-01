<?php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$data = json_decode(file_get_contents("php://input"), true);
$groupId = $data['groupId'] ?? null;
$userId  = $_SESSION['user_id'];
$userName = $_SESSION['full_name'];

if (!$groupId) sendResponse(false, "Invalid group.");

try {
    $roomSlug = "cc-" . $groupId . "-" . substr(md5(uniqid()), 0, 6);
    $meetUrl  = "https://meet.jit.si/" . $roomSlug;

    dbQuery($conn, "UPDATE groups SET active_meet_link = ? WHERE group_id = ?", [$meetUrl, $groupId]);

    // Post as a REGULAR message from the initiator — not a system message
    // so it renders as a proper chat bubble with a clickable link
    $msgText = "📅 I've started a study session! Join here: $meetUrl";
    dbQuery($conn,
        "INSERT INTO messages (sender_id, group_id, message_text, is_system) VALUES (?, ?, ?, 0)",
        [$userId, $groupId, $msgText]
    );

    sendResponse(true, "Session started!", ["url" => $meetUrl]);
} catch (Exception $e) {
    sendResponse(false, "Failed: " . $e->getMessage());
}
