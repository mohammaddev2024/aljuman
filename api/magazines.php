<?php
// api/magazines.php
require 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query('SELECT * FROM magazines ORDER BY year DESC, month DESC');
    $rows = $stmt->fetchAll();
    echo json_encode($rows);
    exit;
}

if (!isset($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['ok'=>false]); exit; }

$input = json_decode(file_get_contents('php://input'), true);
if ($method === 'POST') {
    $stmt = $pdo->prepare('INSERT INTO magazines (title, month, year, description, cover_image, pdf_url) VALUES (?,?,?,?,?,?)');
    $stmt->execute([$input['title'],$input['month'],$input['year'],$input['description'],$input['coverImage'],$input['pdfUrl']]);
    echo json_encode(['ok'=>true, 'id'=>$pdo->lastInsertId()]);
    exit;
}

if ($method === 'DELETE') {
    parse_str(file_get_contents('php://input'), $del);
    $id = $del['id'] ?? null;
    if (!$id) { http_response_code(400); echo json_encode(['ok'=>false]); exit; }
    $stmt = $pdo->prepare('DELETE FROM magazines WHERE id = ?');
    $stmt->execute([$id]);
    echo json_encode(['ok'=>true]);
    exit;
}
?>
