<?php
// api/check_session.php
require 'config.php';

// config.php starts session; still check for session variable
$authenticated = isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);

if (!$authenticated) {
    http_response_code(401);
}

echo json_encode(['authenticated' => $authenticated]);
?>
