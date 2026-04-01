<?php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$role  = $_SESSION['role'] ?? 'student';
$myUni = $_SESSION['university'];

$allowed = ['uni_admin', 'super_admin'];
if (!in_array($role, $allowed)) sendResponse(false, "Unauthorized.");

$resourceId = $_POST['resource_id'] ?? null;
if (!$resourceId) sendResponse(false, "Missing resource ID.");

try {
    // uni_admin can only verify resources from their own university
    if ($role === 'uni_admin') {
        $check = dbQuery($conn,
            "SELECT resource_id FROM hub_resources WHERE resource_id = ? AND university_origin = ?",
            [$resourceId, $myUni]
        )->fetch();
        if (!$check) sendResponse(false, "You can only verify resources from your university.");
    }

    dbQuery($conn, "UPDATE hub_resources SET is_verified = 1 WHERE resource_id = ?", [$resourceId]);
    sendResponse(true, "Resource verified!");
} catch (Exception $e) {
    sendResponse(false, $e->getMessage());
}
