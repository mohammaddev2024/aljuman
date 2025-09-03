<?php
// api/create_admin.php
require 'config.php';

// Default credentials for local development
$username = 'admin';
$password = 'admin123';

try {
    // Check if user exists
    $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $existing = $stmt->fetch();

    if ($existing) {
        echo json_encode(['ok' => true, 'message' => 'admin_exists', 'user' => $username]);
        exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
    $stmt->execute([$username, $hash]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['ok' => true, 'message' => 'created', 'user' => $username]);
    } else {
        echo json_encode(['ok' => false, 'message' => 'insert_failed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'exception', 'error' => $e->getMessage()]);
}
?>
