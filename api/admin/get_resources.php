<?php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$role   = $_SESSION['role'] ?? 'student';
$myUni  = $_SESSION['university'];
$filter = $_GET['filter'] ?? 'pending';

$allowed = ['uni_admin', 'super_admin'];
if (!in_array($role, $allowed)) sendResponse(false, "Unauthorized.");

try {
    if ($filter === 'pending') {
        $where = "hr.is_verified = 0";
    } else {
        $where = "1=1";
    }

    // Super admin sees all universities, uni_admin only sees their own
    if ($role === 'uni_admin') {
        $where .= " AND hr.university_origin = " . $conn->quote($myUni);
    }

    $sql = "SELECT hr.*, u.full_name as uploader
            FROM hub_resources hr
            JOIN users u ON hr.user_id = u.user_id
            WHERE $where
            ORDER BY hr.created_at DESC";

    $resources = $conn->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    sendResponse(true, "OK", $resources);
} catch (Exception $e) {
    sendResponse(false, $e->getMessage());
}
