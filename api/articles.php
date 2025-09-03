<?php
// api/articles.php
require 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query('SELECT * FROM articles ORDER BY created_at DESC');
    $rows = $stmt->fetchAll();
    // decode tags
    $rows = array_map(function($r){ $r['tags'] = json_decode($r['tags_json'] ?? '[]', true); unset($r['tags_json']); return $r; }, $rows);
    echo json_encode($rows);
    exit;
}

// Protected routes
if (!isset($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['ok'=>false]); exit; }

$input = json_decode(file_get_contents('php://input'), true);
if ($method === 'POST') {
    $tags_json = json_encode($input['tags'] ?? []);
    $excerpt = mb_substr(strip_tags($input['content'] ?? ''), 0, 200);
    $stmt = $pdo->prepare('INSERT INTO articles (title, author, author_photo, category, tags_json, content, excerpt) VALUES (?,?,?,?,?,?,?)');
    $stmt->execute([$input['title'],$input['author'],$input['authorPhoto'],$input['category'],$tags_json,$input['content'],$excerpt]);
    echo json_encode(['ok'=>true, 'id'=>$pdo->lastInsertId()]);
    exit;
}

if ($method === 'PUT') {
    parse_str(file_get_contents('php://input'), $put);
    $id = $put['id'] ?? null;
    if (!$id) { http_response_code(400); echo json_encode(['ok'=>false]); exit; }
    $tags_json = json_encode($put['tags'] ?? []);
    $excerpt = mb_substr(strip_tags($put['content'] ?? ''), 0, 200);
    $stmt = $pdo->prepare('UPDATE articles SET title=?, author=?, author_photo=?, category=?, tags_json=?, content=?, excerpt=?, updated_at=NOW() WHERE id=?');
    $stmt->execute([$put['title'],$put['author'],$put['authorPhoto'],$put['category'],$tags_json,$put['content'],$excerpt,$id]);
    echo json_encode(['ok'=>true]);
    exit;
}

if ($method === 'DELETE') {
    parse_str(file_get_contents('php://input'), $del);
    $id = $del['id'] ?? null;
    if (!$id) { http_response_code(400); echo json_encode(['ok'=>false]); exit; }
    $stmt = $pdo->prepare('DELETE FROM articles WHERE id = ?');
    $stmt->execute([$id]);
    echo json_encode(['ok'=>true]);
    exit;
}
?>
