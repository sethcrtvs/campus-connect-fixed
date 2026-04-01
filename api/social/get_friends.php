<?php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$currentUserId = $_SESSION['user_id'];

try {
    // Returns friends WITH friendship_id so frontend can offer unfriend
    $sql = "SELECT
                f.friendship_id,
                CASE WHEN f.user_id_1 = ? THEN f.user_id_2 ELSE f.user_id_1 END AS friend_id,
                u.full_name,
                u.university,
                u.bio,
                u.portfolio_url,
                u.github_url,
                u.profile_pic,
                f.status
            FROM friendships f
            JOIN users u ON u.user_id = (
                CASE WHEN f.user_id_1 = ? THEN f.user_id_2 ELSE f.user_id_1 END
            )
            WHERE (f.user_id_1 = ? OR f.user_id_2 = ?)
            AND f.status = 'accepted'";

    $result = dbQuery($conn, $sql, [$currentUserId, $currentUserId, $currentUserId, $currentUserId]);
    $friends = $result->fetchAll(PDO::FETCH_ASSOC);
    sendResponse(true, "Friends retrieved", $friends);
} catch (Exception $e) {
    sendResponse(false, "Database error: " . $e->getMessage());
}
