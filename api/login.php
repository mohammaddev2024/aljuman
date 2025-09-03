<?php
// api/login.php
require 'config.php';

$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['username']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'invalid_input']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT id, password_hash FROM users WHERE username = ?');
    $stmt->execute([$input['username']]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'message' => 'user_not_found']);
        exit;
    }

    if (password_verify($input['password'], $user['password_hash'])) {
        // regenerate session id for security
        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $input['username'];
        echo json_encode(['ok' => true, 'message' => 'authenticated']);
        exit;
    } else {
        http_response_code(403);
        echo json_encode(['ok' => false, 'message' => 'bad_credentials']);
        exit;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'exception', 'error' => $e->getMessage()]);
    exit;
}
?>
