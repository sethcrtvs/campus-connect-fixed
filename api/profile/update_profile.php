<?php
if (session_status() === PHP_SESSION_NONE) session_start();
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../../includes/functions.php';

if (!isset($_SESSION['user_id'])) sendResponse(false, "Unauthorized.");

$data    = json_decode(file_get_contents("php://input"), true);
$userId  = $_SESSION['user_id'];

$bio       = $data['bio']        ?? '';
$links     = $data['links']      ?? [];   // array of URL strings
$programme = $data['programme']  ?? '';

// Store links as JSON string
$linksJson = json_encode(array_filter(array_map('trim', $links)));

$sql = "UPDATE users SET bio = ?, portfolio_url = ?, github_url = ? WHERE user_id = ?";
if (dbQuery($conn, $sql, [$bio, $linksJson, $programme, $userId])) {
    sendResponse(true, "Profile updated!");
} else {
    sendResponse(false, "Update failed.");
}
