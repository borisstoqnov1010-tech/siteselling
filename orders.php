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

if ($_SERVER['REQUEST_METHOD'] === 'PATCH' || $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $payload = json_decode(file_get_contents('php://input'), true);

    if (!is_array($payload) || ($payload['password'] ?? '') !== $adminPassword) {
        http_response_code(403);
        echo json_encode(['error' => 'Wrong password']);
        exit;
    }

    $id = trim((string)($payload['id'] ?? ''));
    $orders = json_decode((string)file_get_contents($ordersFile), true);
    $orders = is_array($orders) ? $orders : [];

    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $orders = array_values(array_filter($orders, static function ($order) use ($id) {
            return (string)($order['id'] ?? '') !== $id;
        }));

        file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $status = trim((string)($payload['status'] ?? ''));
    $allowedStatuses = ['new', 'done', 'cancelled'];

    if (!in_array($status, $allowedStatuses, true)) {
        http_response_code(422);
        echo json_encode(['error' => 'Invalid status']);
        exit;
    }

    foreach ($orders as &$order) {
        if ((string)($order['id'] ?? '') === $id) {
            $order['status'] = $status;
            $order['updatedAt'] = gmdate('c');
            break;
        }
    }
    unset($order);

    file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
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
    'source' => trim((string)($payload['source'] ?? 'Форма')),
    'paymentMethod' => trim((string)($payload['paymentMethod'] ?? '')),
    'status' => trim((string)($payload['status'] ?? 'new')),
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
