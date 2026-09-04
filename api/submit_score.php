<?php

header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);

$name = isset($body['name']) ? trim((string) $body['name']) : '';
$name = preg_replace('/[^\p{L}\p{N}\s\-_.]/u', '', $name);
$name = trim(mb_substr($name, 0, 10));

$score = $body['score'] ?? null;

if ($name === '' || !is_numeric($score)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_input']);
    exit;
}

$score = (int) $score;
if ($score < 0 || $score > 200000) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_score']);
    exit;
}

try {
    $pdo = get_db();

    $stmt = $pdo->prepare('SELECT score FROM scores WHERE name = :name');
    $stmt->execute([':name' => $name]);
    $existing = $stmt->fetchColumn();

    if ($existing === false) {
        $ins = $pdo->prepare('INSERT INTO scores (name, score, updated_at) VALUES (:name, :score, :updated_at)');
        $ins->execute([':name' => $name, ':score' => $score, ':updated_at' => gmdate('c')]);
    } elseif ($score > (int) $existing) {
        $upd = $pdo->prepare('UPDATE scores SET score = :score, updated_at = :updated_at WHERE name = :name');
        $upd->execute([':score' => $score, ':updated_at' => gmdate('c'), ':name' => $name]);
    }

    echo json_encode(['ok' => true, 'leaderboard' => top_scores($pdo)]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'server_error']);
}
