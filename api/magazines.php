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

// Handle PUT (update existing magazine)
if ($method === 'PUT') {
    try {
        if (!is_array($input) || empty($input['id'])) {
            http_response_code(400);
            echo json_encode(['ok'=>false, 'error'=>'missing id']);
            exit;
        }

        $id = $input['id'];
        $fields = [];
        $params = [];

        if (array_key_exists('title', $input)) { $fields[] = 'title = ?'; $params[] = $input['title']; }
        if (array_key_exists('month', $input)) { $fields[] = 'month = ?'; $params[] = $input['month']; }
        if (array_key_exists('year', $input)) { $fields[] = 'year = ?'; $params[] = $input['year']; }
        if (array_key_exists('description', $input)) { $fields[] = 'description = ?'; $params[] = $input['description']; }
        if (array_key_exists('coverImage', $input)) { $fields[] = 'cover_image = ?'; $params[] = $input['coverImage']; }
        if (array_key_exists('pdfUrl', $input)) { $fields[] = 'pdf_url = ?'; $params[] = $input['pdfUrl']; }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['ok'=>false, 'error'=>'no fields to update']);
            exit;
        }

        $params[] = $id;
        $sql = 'UPDATE magazines SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        echo json_encode(['ok'=>true, 'id'=>$id]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['ok'=>false, 'error' => 'update failed', 'details' => $e->getMessage()]);
        exit;
    }
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