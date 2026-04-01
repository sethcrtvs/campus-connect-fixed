<?php
if (session_status() === PHP_SESSION_NONE) session_start();
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../../includes/functions.php';

if (!isset($_SESSION['user_id'])) sendResponse(false, "Not authorized.");

$userId = $_SESSION['user_id'];
$targetId = $_GET['user_id'] ?? $userId; // allow fetching other users' public profiles

$sql = "SELECT full_name, email, university, bio, github_url, portfolio_url, profile_pic FROM users WHERE user_id = ?";
$profile = dbQuery($conn, $sql, [$targetId])->fetch(PDO::FETCH_ASSOC);

if ($profile) {
    // Decode links JSON if stored that way, else treat as single URL
    $raw = $profile['portfolio_url'] ?? '';
    $decoded = json_decode($raw, true);
    $profile['links']     = is_array($decoded) ? $decoded : ($raw ? [$raw] : []);
    $profile['programme'] = $profile['github_url'] ?? '';
    sendResponse(true, "Profile loaded", $profile);
} else {
    sendResponse(false, "Profile not found.");
}
