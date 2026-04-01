<?php
// api/resources/delete_resource.php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$userId = $_SESSION['user_id'];
$userRole = $_SESSION['role'] ?? 'student';
$resourceId = $_POST['resource_id'] ?? null;

if (!$resourceId) {
    sendResponse(false, "Invalid resource ID.");
}

try {
    // 1. Check ownership or admin status
    $checkSql = "SELECT user_id FROM hub_resources WHERE resource_id = ?";
    $resource = dbQuery($conn, $checkSql, [$resourceId])->fetch(PDO::FETCH_ASSOC);

    if (!$resource) {
        sendResponse(false, "Resource not found.");
    }

    if ($resource['user_id'] != $userId && $userRole === 'student') {
        sendResponse(false, "Unauthorized: You can only delete your own resources.");
    }

    // 2. Delete from Database
    $deleteSql = "DELETE FROM hub_resources WHERE resource_id = ?";
    dbQuery($conn, $deleteSql, [$resourceId]);

    sendResponse(true, "Resource deleted successfully.");

} catch (Exception $e) {
    sendResponse(false, "System Error: " . $e->getMessage());
}