<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$adminPassword = 'kuchki55';
$dataDir = __DIR__ . DIRECTORY_SEPARATOR . 'data';
$ordersFile = $dataDir . DIRECTORY_SEPARATOR . 'orders.json';

if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

if (!file_exists($ordersFile)) {
    file_put_contents($ordersFile, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $password = (string)($_GET['password'] ?? '');

    if ($password !== $adminPassword) {
        http_response_code(403);
        echo json_encode(['error' => 'Wrong password']);
        exit;
    }

    $orders = json_decode((string)file_get_contents($ordersFile), true);
    echo json_encode(['orders' => is_array($orders) ? $orders : []], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true);

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid data']);
    exit;
}

$order = [
    'id' => bin2hex(random_bytes(6)),
    'name' => trim((string)($payload['name'] ?? '')),
    'discord' => trim((string)($payload['discord'] ?? '')),
    'service' => trim((string)($payload['service'] ?? '')),
    'budget' => trim((string)($payload['budget'] ?? '')),
    'description' => trim((string)($payload['description'] ?? '')),
    'createdAt' => gmdate('c'),
];

if ($order['name'] === '' || $order['discord'] === '' || $order['service'] === '' || $order['description'] === '') {
    http_response_code(422);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

$orders = json_decode((string)file_get_contents($ordersFile), true);
$orders = is_array($orders) ? $orders : [];
array_unshift($orders, $order);
$orders = array_slice($orders, 0, 100);

file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);

echo json_encode(['ok' => true, 'order' => $order], JSON_UNESCAPED_UNICODE);
