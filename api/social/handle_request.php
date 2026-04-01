<?php
// api/social/handle_request.php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$data = json_decode(file_get_contents("php://input"), true);
$friendshipId = $data['friendshipId'] ?? null;
$status = $data['status'] ?? null; // 'accepted' or 'blocked'
$currentUserId = $_SESSION['user_id'];

if (!$friendshipId || !in_array($status, ['accepted', 'blocked'])) {
    sendResponse(false, "Invalid request parameters.");
}

try {
    // Security check: Ensure the current user is part of this friendship
    // We update the row only if the ID matches the friendship_id
    if ($status === 'accepted') {
        $sql = "UPDATE friendships SET status = 'accepted' WHERE friendship_id = ? AND (user_id_1 = ? OR user_id_2 = ?)";
        dbQuery($conn, $sql, [$friendshipId, $currentUserId, $currentUserId]);
        $message = "You are now friends!";
    } else {
        // If they click 'Ignore', we just delete the request to keep the database clean
        $sql = "DELETE FROM friendships WHERE friendship_id = ? AND (user_id_1 = ? OR user_id_2 = ?)";
        dbQuery($conn, $sql, [$friendshipId, $currentUserId, $currentUserId]);
        $message = "Request declined.";
    }

    sendResponse(true, $message);
} catch (Exception $e) {
    sendResponse(false, "Action failed: " . $e->getMessage());
}