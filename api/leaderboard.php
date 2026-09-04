<?php

header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/db.php';

try {
    $pdo = get_db();
    echo json_encode(['ok' => true, 'leaderboard' => top_scores($pdo)]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'server_error']);
}
