<?php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$data    = json_decode(file_get_contents("php://input"), true);
$eventId = $data['event_id'] ?? null;
$userId  = $_SESSION['user_id'];

if (!$eventId) sendResponse(false, "Missing event ID.");

try {
    $existing = dbQuery($conn,
        "SELECT interest_id FROM event_interests WHERE event_id = ? AND user_id = ?",
        [$eventId, $userId]
    )->fetch();

    if ($existing) {
        dbQuery($conn, "DELETE FROM event_interests WHERE event_id = ? AND user_id = ?", [$eventId, $userId]);
        $interested = false;
    } else {
        dbQuery($conn, "INSERT INTO event_interests (event_id, user_id) VALUES (?, ?)", [$eventId, $userId]);
        $interested = true;
    }

    $count = dbQuery($conn,
        "SELECT COUNT(*) as total FROM event_interests WHERE event_id = ?",
        [$eventId]
    )->fetch(PDO::FETCH_ASSOC)['total'];

    sendResponse(true, "OK", ["interested" => $interested, "count" => (int)$count]);
} catch (Exception $e) {
    sendResponse(false, $e->getMessage());
}
