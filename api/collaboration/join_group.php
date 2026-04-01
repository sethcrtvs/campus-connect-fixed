<?php
// api/collaboration/join_group.php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$data = json_decode(file_get_contents("php://input"), true);
$userId = $_SESSION['user_id'];
$groupId = $data['groupId'];

if (!$groupId) {
    sendResponse(false, "Invalid Group ID.");
}

try {
    $conn->beginTransaction();

    // 1. Check if the user is already a member (Safety Check)
    $checkSql = "SELECT * FROM group_members WHERE group_id = ? AND user_id = ?";
    $check = dbQuery($conn, $checkSql, [$groupId, $userId]);
    
    if ($check->rowCount() > 0) {
        sendResponse(false, "You are already a member of this group.");
        exit;
    }

    // 2. Add user to 'group_members'
    $sqlMember = "INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'member')";
    dbQuery($conn, $sqlMember, [$groupId, $userId]);

    // 3. Increment 'member_count' in 'groups' table
    $sqlCount = "UPDATE groups SET member_count = member_count + 1 WHERE group_id = ?";
    dbQuery($conn, $sqlCount, [$groupId]);

    $conn->commit();
    sendResponse(true, "Successfully joined the group!");

} catch (Exception $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    sendResponse(false, "A system error occurred. Please try again.");
}