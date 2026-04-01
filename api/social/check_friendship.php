<?php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$targetId = $_GET['target_id'] ?? null;
$userId   = $_SESSION['user_id'];

if (!$targetId) sendResponse(false, "Missing target.");

try {
    $id1 = min($userId, $targetId);
    $id2 = max($userId, $targetId);
    $row = dbQuery($conn,
        "SELECT friendship_id, status FROM friendships WHERE user_id_1 = ? AND user_id_2 = ?",
        [$id1, $id2]
    )->fetch(PDO::FETCH_ASSOC);

    sendResponse(true, "OK", [
        "status"        => $row ? $row['status'] : "none",
        "friendship_id" => $row ? $row['friendship_id'] : null
    ]);
} catch (Exception $e) {
    sendResponse(false, $e->getMessage());
}
