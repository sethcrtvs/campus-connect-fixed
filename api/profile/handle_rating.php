<?php
// api/profile/handle_rating.php
if (session_status() === PHP_SESSION_NONE) session_start();
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../../includes/functions.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

$user_id = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $group_id = $data['group_id'] ?? null;
    $target_id = $data['target_id'] ?? null;
    $val = $data['rating_value'] ?? null;

    if (!$group_id || !$target_id || !$val) {
        echo json_encode(["success" => false, "message" => "Missing parameters"]);
        exit;
    }

    if ($user_id == $target_id) {
        echo json_encode(["success" => false, "message" => "You cannot rate yourself."]);
        exit;
    }

    try {
        // ON DUPLICATE KEY UPDATE ensures a user can change their mind/update a rating
        $sql = "INSERT INTO profile_ratings (group_id, rater_id, target_id, rating_value) 
                VALUES (?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE rating_value = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$group_id, $user_id, $target_id, $val, $val]);
        echo json_encode(["success" => true, "message" => "Collaborative score updated!"]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Database error"]);
    }
} else {
    // GET AVERAGE FOR A SPECIFIC GROUP CONTEXT
    $target_id = $_GET['target_id'] ?? null;
    $group_id = $_GET['group_id'] ?? null;

    if (!$target_id || !$group_id) {
        echo json_encode(["success" => false, "message" => "Missing target or group context"]);
        exit;
    }

    $sql = "SELECT AVG(rating_value) as avg_rating, COUNT(*) as total_votes 
            FROM profile_ratings WHERE target_id = ? AND group_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$target_id, $group_id]);
    $res = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "data" => [
            "average" => round($res['avg_rating'] ?? 0, 1),
            "total" => (int)($res['total_votes'] ?? 0)
        ]
    ]);
}