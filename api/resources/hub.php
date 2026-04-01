<?php
// api/resources/hub.php
session_start(); // Ensure session is active immediately

require_once '../../includes/functions.php';
require_once '../config/database.php';

// This function from your functions.php will now work because session_start() is active
securePage(); 

$method = $_SERVER['REQUEST_METHOD'];
$myId   = $_SESSION['user_id'];
$myRole = $_SESSION['role'];
$myUni  = $_SESSION['university'];

if ($method === 'GET') {
    // Show GLOBAL files OR UNIVERSITY files that match the user's campus
    // We join 'users' to get the real name of the person who shared it
    $sql = "SELECT hr.*, u.full_name as uploader 
            FROM hub_resources hr 
            JOIN users u ON hr.user_id = u.user_id 
            WHERE hr.visibility = 'global' 
            OR (hr.visibility = 'university' AND hr.university_origin = ?)
            ORDER BY hr.is_verified DESC, hr.created_at DESC";
    
    try {
        $stmt = dbQuery($conn, $sql, [$myUni]);
        $resources = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendResponse(true, "Hub Data Loaded", $resources);
    } catch (Exception $e) {
        sendResponse(false, "Failed to load hub data.");
    }
}

if ($method === 'POST') {
    // Note: If you are using FormData for file uploads, 
    // json_decode(php://input) might be empty. 
    // This logic assumes a JSON-based share request.
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!$data) {
        sendResponse(false, "Invalid data provided.");
    }

    $sql = "INSERT INTO hub_resources (user_id, title, faculty, resource_type, visibility, university_origin, file_path, file_extension) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    
    dbQuery($conn, $sql, [
        $myId, 
        $data['title'], 
        $data['faculty'], 
        $data['resource_type'], 
        $data['visibility'] ?? 'university', 
        $myUni, 
        $data['file_path'], 
        $data['file_ext']
    ]);
    
    sendResponse(true, "Successfully shared to the Hub!");
}