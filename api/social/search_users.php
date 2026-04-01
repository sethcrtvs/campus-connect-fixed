<?php
// api/social/search_users.php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$query = $_GET['query'] ?? '';
$currentUserId = $_SESSION['user_id'];

// Don't search if the name is too short
if (strlen($query) < 2) {
    sendResponse(true, "Query too short", []);
}

try {
    // We use LIKE with % to find names that contain the search string
    // We also exclude the current user so you don't find yourself
    $searchTerm = "%$query%";
    $sql = "SELECT user_id, full_name, university 
            FROM users 
            WHERE (full_name LIKE ? OR email LIKE ?) 
            AND user_id != ? 
            LIMIT 10";
            
    $result = dbQuery($conn, $sql, [$searchTerm, $searchTerm, $currentUserId]);
    $users = $result->fetchAll(PDO::FETCH_ASSOC);
    
    sendResponse(true, "Users found", $users);
} catch (Exception $e) {
    sendResponse(false, "Search failed: " . $e->getMessage());
}