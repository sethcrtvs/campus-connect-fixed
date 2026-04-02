<?php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$userId     = $_SESSION['user_id'];
$university = $_SESSION['university'] ?? 'KCA University';
$userRole   = $_SESSION['role'] ?? 'student';
$groupId    = $_POST['groupId'] ?? null;
$isDM       = isset($_POST['isDM']) && $_POST['isDM'] === 'true';

// Hub Metadata
$shareToHub   = isset($_POST['shareToHub']) && $_POST['shareToHub'] === 'true';
$faculty      = $_POST['faculty']      ?? 'General';
$resourceType = $_POST['resourceType'] ?? 'Past Paper';
$visibility   = $_POST['visibility']   ?? 'university';
$title        = $_POST['title']        ?? null;

$cloudName    = "detnaasrq";
$uploadPreset = "campus_connect_preset";

function clean($s) {
    $s = str_replace([' ','&'], ['_','and'], $s);
    return preg_replace('/[^A-Za-z0-9_\-]/', '', $s);
}

// --- Validation ---
if (!isset($_FILES['resourceFile']) || $_FILES['resourceFile']['error'] === UPLOAD_ERR_NO_FILE) {
    sendResponse(false, "Please select a file.");
}

$file        = $_FILES['resourceFile'];
$filePath    = $file['tmp_name'];
$originalName = basename($file['name']);
$fileExt     = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

// File size: 10 MB max
if ($file['size'] > 10 * 1024 * 1024) {
    sendResponse(false, "File size must be less than 10MB.");
}

// Allowed types
$allowed = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif'];
if (!in_array($fileExt, $allowed)) {
    sendResponse(false, "Invalid file type. Only PDF, DOCX, images and Office files are allowed.");
}

if (!$title) {
    $title = pathinfo($originalName, PATHINFO_FILENAME);
}

try {
    $cUni    = clean($university);
    $cFac    = clean($faculty);
    $cType   = clean($resourceType);
    $cTitle  = clean($title);
    $suffix  = substr(md5(uniqid()), 0, 6);

    if ($shareToHub) {
        $publicId = "CampusConnect/$cUni/$cFac/$cType/{$cTitle}_$suffix";
    } elseif ($isDM) {
        $publicId = "CampusConnect/DM/{$cTitle}_$suffix";
    } else {
        $publicId = "CampusConnect/Group_" . ($groupId ?? 'General') . "/{$cTitle}_$suffix";
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://api.cloudinary.com/v1_1/$cloudName/auto/upload");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, [
        'file'          => new CURLFile($filePath),
        'upload_preset' => $uploadPreset,
        'public_id'     => $publicId,
    ]);
    $response = curl_exec($ch);
    $result   = json_decode($response, true);
    curl_close($ch);

    if (!isset($result['secure_url'])) {
        sendResponse(false, "Upload failed: " . ($result['error']['message'] ?? 'Cloudinary error'));
    }

    $cloudUrl = $result['secure_url'];

    // A. Group chat file — store URL in resources table + post plain message with URL
    if ($groupId && $groupId !== 'HUB' && !$isDM) {
        dbQuery($conn,
            "INSERT INTO resources (group_id, user_id, file_name, file_path, file_type) VALUES (?, ?, ?, ?, ?)",
            [$groupId, $userId, $title, $cloudUrl, $fileExt]
        );
        // Store as plain text: "FILE:url:filename" so JS can detect and render as clickable
        $msgText = "FILE:{$cloudUrl}:{$title}";
        dbQuery($conn,
            "INSERT INTO messages (sender_id, group_id, message_text) VALUES (?, ?, ?)",
            [$userId, $groupId, $msgText]
        );
    }

    // B. Hub resource
    if ($shareToHub) {
        // Admins auto-verified, students pending
        $isVerified = ($userRole !== 'student') ? 1 : 0;
        dbQuery($conn,
            "INSERT INTO hub_resources (user_id, title, faculty, resource_type, visibility, university_origin, file_path, file_extension, is_verified)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [$userId, $title, $faculty, $resourceType, $visibility, $university, $cloudUrl, $fileExt, $isVerified]
        );
    }

    sendResponse(true, "Uploaded successfully!", ["url" => $cloudUrl, "name" => $title, "ext" => $fileExt]);

} catch (Exception $e) {
    sendResponse(false, "System error: " . $e->getMessage());
}
