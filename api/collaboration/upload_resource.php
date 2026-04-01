<?php
// api/collaboration/upload_resource.php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$userId = $_SESSION['user_id'];
$university = $_SESSION['university'] ?? 'KCA University';
$groupId = $_POST['groupId'] ?? null;

// Hub Metadata
$shareToHub = isset($_POST['shareToHub']) && $_POST['shareToHub'] === 'true';
$faculty = $_POST['faculty'] ?? 'General';
$resourceType = $_POST['resourceType'] ?? 'Past Paper'; 
$visibility = $_POST['visibility'] ?? 'university';
$title = $_POST['title'] ?? null; 

// CREDENTIALS
$cloudName = "detnaasrq"; 
$uploadPreset = "campus_connect_preset"; 

// Helper function to sanitize strings for Cloudinary public_id
function clean($string) {
    $string = str_replace([' ', '&'], ['_', 'and'], $string); // Replace spaces with _ and & with 'and'
    return preg_replace('/[^A-Za-z0-9_\-]/', '', $string); // Remove everything else except alphanumeric, _, and -
}

if (!isset($_FILES['resourceFile'])) {
    sendResponse(false, "No file selected.");
}

$file = $_FILES['resourceFile'];
$filePath = $file['tmp_name'];
$originalName = basename($file['name']);
$fileExt = pathinfo($originalName, PATHINFO_EXTENSION);

if (!$title) {
    $title = pathinfo($originalName, PATHINFO_FILENAME);
}

try {
    // Sanitize all parts of the path
    $cUni = clean($university);
    $cFac = clean($faculty);
    $cType = clean($resourceType);
    $cTitle = clean($title);
    $uniqueSuffix = substr(md5(time()), 0, 6);
    
    if ($shareToHub) {
        // Example result: CampusConnect/KCA_University/Computing_and_IT/Past_Paper/My_File_abc123
        $fullPublicId = "CampusConnect/$cUni/$cFac/$cType/{$cTitle}_$uniqueSuffix";
    } else {
        $fullPublicId = "CampusConnect/Group_" . ($groupId ?? 'General') . "/{$cTitle}_$uniqueSuffix";
    }

    // THE CURL REQUEST
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://api.cloudinary.com/v1_1/$cloudName/auto/upload");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, [
        'file'          => new CURLFile($filePath),
        'upload_preset' => $uploadPreset,
        'public_id'     => $fullPublicId 
    ]);

    $response = curl_exec($ch);
    $result = json_decode($response, true);
    curl_close($ch);

    if (isset($result['secure_url'])) {
        $cloudUrl = $result['secure_url'];

        // A. SAVE TO GROUP CHAT
        if ($groupId && $groupId !== 'HUB') {
            $sqlGroup = "INSERT INTO resources (group_id, user_id, file_name, file_path, file_type) VALUES (?, ?, ?, ?, ?)";
            dbQuery($conn, $sqlGroup, [$groupId, $userId, $title, $cloudUrl, $fileExt]);

            $cleanName = htmlspecialchars($title);
            $msgText = "☁️ Shared a file: <a href='$cloudUrl' target='_blank' class='text-blue-400 font-bold underline'>$cleanName</a>";
            $sqlMsg = "INSERT INTO messages (sender_id, group_id, message_text) VALUES (?, ?, ?)";
            dbQuery($conn, $sqlMsg, [$userId, $groupId, $msgText]);
        }

        // B. SAVE TO HUB RESOURCES
        if ($shareToHub) {
            $isVerified = (isset($_SESSION['role']) && $_SESSION['role'] !== 'student') ? 1 : 0;
            
            $sqlHub = "INSERT INTO hub_resources (user_id, title, faculty, resource_type, visibility, university_origin, file_path, file_extension, is_verified) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            dbQuery($conn, $sqlHub, [
                $userId, 
                $title, 
                $faculty, 
                $resourceType, 
                $visibility, 
                $university, 
                $cloudUrl, 
                $fileExt,
                $isVerified
            ]);
        }

        sendResponse(true, "Resource shared successfully!", ["url" => $cloudUrl]);
    } else {
        sendResponse(false, "Cloudinary Error: " . ($result['error']['message'] ?? 'Upload Failed'));
    }

} catch (Exception $e) {
    sendResponse(false, "System Error: " . $e->getMessage());
}