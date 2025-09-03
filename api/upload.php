<?php
// Simple upload endpoint for images/PDFs. Saves files under assets/uploads and returns JSON with file URL.
// Note: This is a minimal implementation. In production, add authentication, file size/type checks, rate limiting.

header('Content-Type: application/json; charset=utf-8');

// Allow only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Ensure upload directory exists
$uploadDir = __DIR__ . '/../assets/uploads/';
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Unable to create upload directory']);
        exit;
    }
}

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Upload error code: ' . $file['error']]);
    exit;
}

// Basic type check
$allowed = [
    'image/jpeg' => '.jpg',
    'image/png' => '.png',
    'image/gif' => '.gif',
    'application/pdf' => '.pdf'
];

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!array_key_exists($mime, $allowed)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type: ' . $mime]);
    exit;
}

$ext = $allowed[$mime];
$basename = bin2hex(random_bytes(8)) . $ext;
$targetPath = $uploadDir . $basename;

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to move uploaded file']);
    exit;
}

// Build URL relative to project root
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$scriptDir = dirname($_SERVER['SCRIPT_NAME']); // e.g. /project/api
$projectRoot = rtrim(dirname($scriptDir), '/\\'); // e.g. /project
$urlPath = $projectRoot . '/assets/uploads/' . $basename;
$url = $protocol . '://' . $host . $urlPath;
// Normalize slashes
$url = str_replace('\\', '/', $url);

echo json_encode(['url' => $url]);
