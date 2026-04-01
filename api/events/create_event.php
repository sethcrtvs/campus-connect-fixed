<?php
session_start();
require_once '../config/database.php'; 

header('Content-Type: application/json');

$authorized = ['uni_admin', 'super_admin'];
if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role'], $authorized)) {
    echo json_encode(["success" => false, "message" => "Unauthorized access."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

try {
    $stmt = $conn->prepare("INSERT INTO campus_events (title, description, event_date, location, university, category, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
    
    $stmt->execute([
        $data['title'],
        $data['description'],
        $data['event_date'],
        $data['location'],
        $data['university'],
        $data['category'],
        $_SESSION['user_id']
    ]);

    echo json_encode(["success" => true, "message" => "Event published successfully!"]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "SQL Error: " . $e->getMessage()]);
}
?>