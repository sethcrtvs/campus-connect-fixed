<?php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$role  = $_SESSION['role'] ?? 'student';
$myUni = $_SESSION['university'];

$allowed = ['uni_admin', 'super_admin'];
if (!in_array($role, $allowed)) sendResponse(false, "Unauthorized.");

try {
    if ($role === 'uni_admin') {
        $students = dbQuery($conn, "SELECT COUNT(*) as c FROM users WHERE university = ? AND role = 'student'", [$myUni])->fetch()['c'];
    } else {
        $students = dbQuery($conn, "SELECT COUNT(*) as c FROM users WHERE role = 'student'", [])->fetch()['c'];
    }
    sendResponse(true, "OK", ["students" => (int)$students]);
} catch (Exception $e) {
    sendResponse(false, $e->getMessage());
}
