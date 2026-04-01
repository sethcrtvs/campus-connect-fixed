<?php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$data = json_decode(file_get_contents("php://input"), true);
$groupId = $data['groupId'] ?? null;
$userId = $_SESSION['user_id'];

if (!$groupId) sendResponse(false, "Missing group.");

try {
    // Check if owner — owners cannot leave, they must delete the group
    $check = dbQuery($conn, "SELECT role FROM group_members WHERE group_id = ? AND user_id = ?", [$groupId, $userId])->fetch();
    if (!$check) sendResponse(false, "You are not a member of this group.");
    if ($check['role'] === 'owner') sendResponse(false, "You are the owner. Transfer ownership before leaving.");

    dbQuery($conn, "DELETE FROM group_members WHERE group_id = ? AND user_id = ?", [$groupId, $userId]);
    sendResponse(true, "You have left the group.");
} catch (Exception $e) {
    sendResponse(false, "Error: " . $e->getMessage());
}
