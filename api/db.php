<?php

function get_db(): PDO {
    $dir = __DIR__ . '/data';
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $pdo = new PDO('sqlite:' . $dir . '/scores.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('CREATE TABLE IF NOT EXISTS scores (
        name TEXT PRIMARY KEY COLLATE NOCASE,
        score INTEGER NOT NULL,
        updated_at TEXT NOT NULL
    )');

    return $pdo;
}

function top_scores(PDO $pdo, int $limit = 5): array {
    $stmt = $pdo->prepare('SELECT name, score FROM scores ORDER BY score DESC, updated_at ASC LIMIT :limit');
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
