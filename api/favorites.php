<?php
// api/favorites.php
require 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Return favorites for current session user if logged in
    if (!isset($_SESSION['user_id'])) { echo json_encode([]); exit; }
    $stmt = $pdo->prepare('SELECT article_id FROM favorites WHERE user_id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode($rows);
    exit;
}

if (!isset($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['ok'=>false]); exit; }

$input = json_decode(file_get_contents('php://input'), true);
if ($method === 'POST') {
    $stmt = $pdo->prepare('INSERT INTO favorites (user_id, article_id) VALUES (?, ?)');
    $stmt->execute([$_SESSION['user_id'], $input['articleId']]);
    echo json_encode(['ok'=>true]);
    exit;
}

if ($method === 'DELETE') {
    parse_str(file_get_contents('php://input'), $del);
    $articleId = $del['articleId'] ?? null;
    $stmt = $pdo->prepare('DELETE FROM favorites WHERE user_id = ? AND article_id = ?');
    $stmt->execute([$_SESSION['user_id'], $articleId]);
    echo json_encode(['ok'=>true]);
    exit;
}
?>
