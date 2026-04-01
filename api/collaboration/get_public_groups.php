<?php
// api/collaboration/get_public_groups.php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$userId = $_SESSION['user_id'];
$university = $_SESSION['university'];

try {
    // We select groups from the same uni that the user is NOT a member of
    $sql = "SELECT * FROM groups 
            WHERE university = ? 
            AND privacy_setting = 'public'
            AND group_id NOT IN (
                SELECT group_id FROM group_members WHERE user_id = ?
            )
            ORDER BY created_at DESC";
            
    $result = dbQuery($conn, $sql, [$university, $userId]);
    $groups = $result->fetchAll(PDO::FETCH_ASSOC);
    
    sendResponse(true, "Public groups retrieved", $groups);
} catch (Exception $e) {
    sendResponse(false, "Could not fetch public groups.");
}