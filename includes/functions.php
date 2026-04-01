<?php
/**
 * CAMPUS CONNECT - CORE FUNCTIONS
 * Module: System Integrity & Validation [cite: 79]
 */

// --- 1. YOUR EXISTING VALIDATION LOGIC ---

// TC-AUTH-01: Verification logic [cite: 216]
function isUniEmail($email) {
    return str_ends_with($email, '.ac.ke') || str_ends_with($email, '.edu');
}

// TC-AUTH-02: Password complexity [cite: 312, 557]
function isStrongPassword($password) {
    return strlen($password) >= 8 && preg_match('/[A-Za-z]/', $password) && preg_match('/[0-9]/', $password);
}


// --- 2. FUTURE-PROOFING HELPERS ---

/**
 * Universal JSON Response handler
 * Standardizes API output for the frontend [cite: 305, 576]
 */
function sendResponse($success, $message, $data = null) {
    header("Content-Type: application/json");
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);
    exit;
}

/**
 * Global Session Guard
 * Fulfills Access Control requirements [cite: 80, 535]
 */
function securePage() {
    if (session_status() === PHP_SESSION_NONE) session_start();
    if (!isset($_SESSION['user_id'])) {
        sendResponse(false, "Unauthorized access. Please login.");
    }
}

/**
 * Safe Database Query Executor
 * Prevents SQL Injection using Prepared Statements 
 */
function dbQuery($conn, $sql, $params = []) {
    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    } catch (PDOException $e) {
        // Non-functional requirement: Hide confidential error data [cite: 313]
        sendResponse(false, "A system error occurred. Please try again later.");
        
    }
}
?>