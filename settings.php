<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$adminPassword = 'kuchki55';
$dataDir = __DIR__ . DIRECTORY_SEPARATOR . 'data';
$settingsFile = $dataDir . DIRECTORY_SEPARATOR . 'settings.json';

$defaultSettings = [
    'content' => new stdClass(),
    'discounts' => new stdClass(),
];

if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

if (!file_exists($settingsFile)) {
    file_put_contents(
        $settingsFile,
        json_encode($defaultSettings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
        LOCK_EX
    );
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    readfile($settingsFile);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true);

if (!is_array($payload) || ($payload['password'] ?? '') !== $adminPassword) {
    http_response_code(403);
    echo json_encode(['error' => 'Wrong password']);
    exit;
}

$settings = [
    'content' => is_array($payload['content'] ?? null) ? $payload['content'] : [],
    'discounts' => is_array($payload['discounts'] ?? null) ? $payload['discounts'] : [],
    'updatedAt' => gmdate('c'),
];

file_put_contents(
    $settingsFile,
    json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
    LOCK_EX
);

echo json_encode(['ok' => true, 'settings' => $settings], JSON_UNESCAPED_UNICODE);
