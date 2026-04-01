<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

$scope = $_GET['scope'] ?? 'current';
$userUni = $_SESSION['university'] ?? '';

try {
    if ($scope === 'current' && !empty($userUni)) {
        $stmt = $conn->prepare("SELECT * FROM campus_events WHERE university = ? AND event_date > NOW() ORDER BY event_date ASC");
        $stmt->execute([$userUni]);
    } else {
        $stmt = $conn->prepare("SELECT * FROM campus_events WHERE event_date > NOW() ORDER BY event_date ASC");
        $stmt->execute();
    }
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["success" => true, "data" => $events]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
