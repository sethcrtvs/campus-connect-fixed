<?php
// api/collaboration/get_my_groups.php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$userId = $_SESSION['user_id'];

try {
    // JOIN is crucial here to only see groups you have joined
    $sql = "SELECT g.* FROM groups g 
            JOIN group_members gm ON g.group_id = gm.group_id 
            WHERE gm.user_id = ? 
            ORDER BY g.created_at DESC";
            
    $result = dbQuery($conn, $sql, [$userId]);
    $myGroups = $result->fetchAll(PDO::FETCH_ASSOC);
    
    sendResponse(true, "My groups retrieved", $myGroups);
} catch (Exception $e) {
    sendResponse(false, "Could not load groups.");
}
?>