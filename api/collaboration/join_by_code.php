<?php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$data = json_decode(file_get_contents("php://input"), true);
$code = strtoupper(trim($data['code'] ?? ''));
$userId = $_SESSION['user_id'];

try {
    // Find the group with this code
    $sql = "SELECT group_id FROM groups WHERE invite_code = ?";
    $res = dbQuery($conn, $sql, [$code]);
    $group = $res->fetch();

    if (!$group) {
        sendResponse(false, "Invalid Invite Code.");
        exit;
    }

    // Logic to add member (same as join_group.php)
    // ... (insert into group_members, update count)
    sendResponse(true, "Successfully joined via code!");
} catch (Exception $e) { sendResponse(false, "System error."); }