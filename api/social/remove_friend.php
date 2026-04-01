<?php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$data = json_decode(file_get_contents("php://input"), true);
$friendshipId = $data['friendshipId'] ?? null;
$userId = $_SESSION['user_id'];

if (!$friendshipId) sendResponse(false, "Missing friendship ID.");

try {
    // Make sure the user is actually part of this friendship before deleting
    $check = dbQuery($conn,
        "SELECT friendship_id FROM friendships WHERE friendship_id = ? AND (user_id_1 = ? OR user_id_2 = ?)",
        [$friendshipId, $userId, $userId]
    )->fetch();

    if (!$check) sendResponse(false, "Unauthorized.");

    dbQuery($conn, "DELETE FROM friendships WHERE friendship_id = ?", [$friendshipId]);
    sendResponse(true, "Friend removed.");
} catch (Exception $e) {
    sendResponse(false, "Error: " . $e->getMessage());
}
