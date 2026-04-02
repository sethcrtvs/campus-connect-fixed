<?php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$data   = json_decode(file_get_contents("php://input"), true);
$code   = strtoupper(trim($data['code'] ?? ''));
$userId = $_SESSION['user_id'];

if (!$code) sendResponse(false, "Please enter an invite code.");

try {
    $group = dbQuery($conn, "SELECT group_id, group_name FROM groups WHERE invite_code = ?", [$code])->fetch(PDO::FETCH_ASSOC);

    if (!$group) {
        sendResponse(false, "Group does not exist. Check your code and try again.");
    }

    $groupId = $group['group_id'];

    // Already a member?
    $existing = dbQuery($conn,
        "SELECT member_id FROM group_members WHERE group_id = ? AND user_id = ?",
        [$groupId, $userId]
    )->fetch();

    if ($existing) sendResponse(false, "You are already a member of this group.");

    dbQuery($conn, "INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'member')", [$groupId, $userId]);
    sendResponse(true, "Successfully joined " . $group['group_name'] . "!");
} catch (Exception $e) {
    sendResponse(false, "System error: " . $e->getMessage());
}
