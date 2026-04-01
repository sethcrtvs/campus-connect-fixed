<?php
// api/collaboration/tasks.php
header('Content-Type: application/json');
require_once '../../includes/functions.php';
require_once '../config/database.php';
securePage();

$myId = $_SESSION['user_id'];
$myName = $_SESSION['full_name'];
$method = $_SERVER['REQUEST_METHOD'];

function isGroupAdmin($conn, $groupId, $userId) {
    $sql = "SELECT role FROM group_members WHERE group_id = ? AND user_id = ?";
    $stmt = dbQuery($conn, $sql, [$groupId, $userId]);
    $res = $stmt->fetch();
    return ($res && ($res['role'] === 'admin' || $res['role'] === 'owner'));
}

try {
    if ($method === 'GET') {
        $groupId = $_GET['groupId'] ?? null;
        $sql = "SELECT t.*, u.full_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.user_id WHERE t.group_id = ? ORDER BY t.created_at DESC";
        $tasks = dbQuery($conn, $sql, [$groupId])->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["success" => true, "data" => $tasks]);
    } 
    else if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $action = $data['action'] ?? '';
        $groupId = $data['groupId'];

        if ($action === 'create') {
            if (!isGroupAdmin($conn, $groupId, $myId)) throw new Exception("Unauthorized");
            $sql = "INSERT INTO tasks (group_id, task_name, assigned_to) VALUES (?, ?, ?)";
            dbQuery($conn, $sql, [$groupId, $data['taskName'], $data['assignedTo']]);
            
            // System Notification
            $notif = "New Task Created: " . $data['taskName'];
            dbQuery($conn, "INSERT INTO messages (sender_id, group_id, message_text, is_system) VALUES (?, ?, ?, 1)", [$myId, $groupId, $notif]);
            echo json_encode(["success" => true]);
        } 
        else if ($action === 'toggle') {
            if (!isGroupAdmin($conn, $groupId, $myId)) throw new Exception("Only admins can approve tasks.");
            $taskId = $data['taskId'];
            $task = dbQuery($conn, "SELECT task_name, status FROM tasks WHERE task_id = ?", [$taskId])->fetch();
            $newStatus = ($task['status'] === 'pending') ? 'completed' : 'pending';
            dbQuery($conn, "UPDATE tasks SET status = ? WHERE task_id = ?", [$newStatus, $taskId]);

            if ($newStatus === 'completed') {
                $notif = "Task Approved: " . $task['task_name'];
                dbQuery($conn, "INSERT INTO messages (sender_id, group_id, message_text, is_system) VALUES (?, ?, ?, 1)", [$myId, $groupId, $notif]);
            }
            echo json_encode(["success" => true]);
        }
        else if ($action === 'upload_proof') {
            $taskId = $data['taskId'];
            $task = dbQuery($conn, "SELECT task_name FROM tasks WHERE task_id = ?", [$taskId])->fetch();
            dbQuery($conn, "UPDATE tasks SET task_attachment = ? WHERE task_id = ?", [$data['fileUrl'], $taskId]);

            // System Notification
            $notif = $myName . " uploaded proof for '" . $task['task_name'] . "'";
            dbQuery($conn, "INSERT INTO messages (sender_id, group_id, message_text, is_system) VALUES (?, ?, ?, 1)", [$myId, $groupId, $notif]);
            echo json_encode(["success" => true]);
        }
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}