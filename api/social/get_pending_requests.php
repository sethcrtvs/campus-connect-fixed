<?php
// api/social/get_pending_requests.php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$currentUserId = $_SESSION['user_id'];

try {
    // Logic: Find pending requests where I am the receiver.
    // Since we store IDs as min/max, we check both columns but ensure 
    // we return the details of the OTHER person (the sender).
    $sql = "SELECT f.friendship_id, u.full_name, u.user_id, u.university
            FROM friendships f
            JOIN users u ON (u.user_id = f.user_id_1 OR u.user_id = f.user_id_2)
            WHERE (f.user_id_1 = ? OR f.user_id_2 = ?) 
            AND f.status = 'pending'
            AND u.user_id != ?";

    $result = dbQuery($conn, $sql, [$currentUserId, $currentUserId, $currentUserId]);
    $requests = $result->fetchAll(PDO::FETCH_ASSOC);

    sendResponse(true, "Pending requests found", $requests);
} catch (Exception $e) {
    sendResponse(false, "Error fetching requests: " . $e->getMessage());
}