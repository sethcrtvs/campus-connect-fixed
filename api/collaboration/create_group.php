<?php
// api/collaboration/create_group.php
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$data = json_decode(file_get_contents("php://input"), true);
$userId = $_SESSION['user_id'];
$university = $_SESSION['university'];

if (empty($data['groupName'])) {
    sendResponse(false, "Group name is required.");
}

try {
    $conn->beginTransaction();

    // 1. GENERATE UNIQUE INVITE CODE
    // Creates a 6-character uppercase string (e.g., A1B2C3)
    $inviteCode = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));

    // 2. Insert into 'groups' table including the invite_code
    $sqlGroup = "INSERT INTO groups (
                    group_name, 
                    description, 
                    subject, 
                    category, 
                    university, 
                    privacy_setting, 
                    invite_code, 
                    creator_id, 
                    member_count
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)";
                
    $paramsGroup = [
        $data['groupName'], 
        $data['description'], 
        $data['subject'],
        $data['category'],
        $university, 
        $data['privacy'], 
        $inviteCode, // New Column
        $userId
    ];
    
    dbQuery($conn, $sqlGroup, $paramsGroup);
    $groupId = $conn->lastInsertId();

    // 3. Insert creator as 'admin' in 'group_members'
    $sqlMember = "INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'admin')";
    dbQuery($conn, $sqlMember, [$groupId, $userId]);

    $conn->commit();
    sendResponse(true, "Group created successfully! Invite Code: " . $inviteCode);

} catch (Exception $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    // Debug tip: If this fails, make sure you ran the ALTER TABLE command in phpMyAdmin
    sendResponse(false, "Error: Could not create group. " . $e->getMessage());
}