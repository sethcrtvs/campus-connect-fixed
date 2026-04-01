<?php
// api/collaboration/get_group_details.php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$groupId = $_GET['groupId'] ?? null;

if (!$groupId) {
    sendResponse(false, "Group ID is missing.");
}

try {
    // 1. Fetch Basic Group Details
    $groupSql = "SELECT * FROM groups WHERE group_id = ?";
    $groupRes = dbQuery($conn, $groupSql, [$groupId]);
    $group = $groupRes->fetch(PDO::FETCH_ASSOC);

    if (!$group) {
        sendResponse(false, "Group not found.");
        exit;
    }

    // 2. Fetch Members (Variable name must be consistent!)
    $membersSql = "SELECT u.user_id, u.full_name, u.email, gm.role, gm.joined_at 
                   FROM group_members gm 
                   JOIN users u ON gm.user_id = u.user_id 
                   WHERE gm.group_id = ? 
                   ORDER BY gm.role ASC, u.full_name ASC";
    
    // We use $membersSql here - matching the variable above
    $membersRes = dbQuery($conn, $membersSql, [$groupId]);
    $members = $membersRes->fetchAll(PDO::FETCH_ASSOC);

    // 3. Return combined data
    sendResponse(true, "Group details retrieved", [
        "group" => $group,
        "members" => $members
    ]);

} catch (Exception $e) {
    sendResponse(false, "Database error: " . $e->getMessage());
}