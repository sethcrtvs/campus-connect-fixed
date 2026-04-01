<?php
// api/collaboration/get_resources.php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$groupId = $_GET['groupId'] ?? null;

if (!$groupId) {
    sendResponse(false, "Group ID is required.");
}

try {
    // Select resource details and the name of the person who uploaded it
    $sql = "SELECT r.*, u.full_name 
            FROM resources r 
            JOIN users u ON r.user_id = u.user_id 
            WHERE r.group_id = ? 
            ORDER BY r.uploaded_at DESC";
            
    $result = dbQuery($conn, $sql, [$groupId]);
    $resources = $result->fetchAll(PDO::FETCH_ASSOC);
    
    sendResponse(true, "Resources retrieved successfully", $resources);
} catch (Exception $e) {
    sendResponse(false, "Could not fetch resources: " . $e->getMessage());
}