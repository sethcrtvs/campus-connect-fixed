<?php
$host = "localhost";
$db_name = "campus_connect_fixed";
$username = "root";
$password = "";

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
} catch(PDOException $e) {
    // TC-DB-02: Recovery testing point
    die(json_encode(["error" => "Connection failed: " . $e->getMessage()]));
}
?>