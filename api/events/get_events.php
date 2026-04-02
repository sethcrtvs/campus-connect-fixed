<?php
if (session_status() === PHP_SESSION_NONE) session_start();
require_once '../config/database.php';
require_once '../../includes/functions.php';
header('Content-Type: application/json');

$scope  = $_GET['scope'] ?? 'current';
$userUni = $_SESSION['university'] ?? '';
$userId  = $_SESSION['user_id'] ?? 0;

try {
    // Always include interest_count (universal) and whether THIS user is interested
    $baseSelect = "SELECT ce.*,
        (SELECT COUNT(*) FROM event_interests WHERE event_id = ce.event_id) AS interest_count,
        (SELECT COUNT(*) FROM event_interests WHERE event_id = ce.event_id AND user_id = ?) AS is_interested";

    if ($scope === 'current' && !empty($userUni)) {
        $sql = "$baseSelect FROM campus_events ce WHERE ce.university = ? AND ce.event_date > NOW() ORDER BY ce.event_date ASC";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$userId, $userUni]);
    } else {
        $sql = "$baseSelect FROM campus_events ce WHERE ce.event_date > NOW() ORDER BY ce.event_date ASC";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$userId]);
    }

    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["success" => true, "data" => $events]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
