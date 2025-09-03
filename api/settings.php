<?php
// api/settings.php
require 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query('SELECT * FROM settings WHERE id = 1');
    $s = $stmt->fetch();
    if (!$s) {
        echo json_encode([]);
    } else {
        $s['social'] = json_decode($s['social_json'] ?? '{}', true);
        unset($s['social_json']);
        echo json_encode($s);
    }
    exit;
}

// POST - requires auth
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['ok' => false]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$social_json = json_encode($input['social'] ?? []);

$stmt = $pdo->prepare('INSERT INTO settings (id, site_name, tagline, logo_url, phone, email, social_json, footer_text) VALUES (1,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE site_name=VALUES(site_name), tagline=VALUES(tagline), logo_url=VALUES(logo_url), phone=VALUES(phone), email=VALUES(email), social_json=VALUES(social_json), footer_text=VALUES(footer_text)');
$stmt->execute([$input['siteName'] ?? null, $input['tagline'] ?? null, $input['logoUrl'] ?? null, $input['phone'] ?? null, $input['email'] ?? null, $social_json, $input['footerText'] ?? null]);

echo json_encode(['ok' => true]);
?>
