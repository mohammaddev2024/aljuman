<?php
// api/config.php
// DEVELOPMENT: enable error display to debug HTTP 500 issues
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

// Update these values for your host
$dbHost = 'localhost';
$dbName = 'shahidkh_noormagazine110'; // updated to match the database you created
$dbUser = 'shahidkh_noormagazine110';
$dbPass = 'noormagazine110'; // XAMPP default is empty password for root

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    // Return simple error for debugging; change in production
    echo json_encode(['error' => 'DB connection failed', 'details' => $e->getMessage()]);
    exit;
}

session_start();
?>
