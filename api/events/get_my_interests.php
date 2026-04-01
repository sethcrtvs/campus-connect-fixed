<?php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$userId = $_SESSION['user_id'];

try {
    $sql = "SELECT ce.*, 
                   1 as is_interested,
                   (SELECT COUNT(*) FROM event_interests WHERE event_id = ce.event_id) as interest_count
            FROM campus_events ce
            JOIN event_interests ei ON ce.event_id = ei.event_id
            WHERE ei.user_id = ? AND ce.event_date > NOW()
            ORDER BY ce.event_date ASC";
    $events = dbQuery($conn, $sql, [$userId])->fetchAll(PDO::FETCH_ASSOC);
    sendResponse(true, "OK", $events);
} catch (Exception $e) {
    sendResponse(false, $e->getMessage());
}
