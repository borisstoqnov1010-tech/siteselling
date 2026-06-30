<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$adminPassword = 'kuchki55';
$allowedSlots = ['logoImage', 'heroImage', 'galleryOneImage', 'galleryTwoImage', 'galleryThreeImage'];
$allowedMimeTypes = [
    'image/png' => 'png',
    'image/jpeg' => 'jpg',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
];
$maxSize = 5 * 1024 * 1024;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

if (($_POST['password'] ?? '') !== $adminPassword) {
    http_response_code(403);
    echo json_encode(['error' => 'Wrong password']);
    exit;
}

$uploadDir = __DIR__ . DIRECTORY_SEPARATOR . 'uploads';
$dataDir = __DIR__ . DIRECTORY_SEPARATOR . 'data';
$settingsFile = $dataDir . DIRECTORY_SEPARATOR . 'settings.json';

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

if (!file_exists($settingsFile)) {
    file_put_contents($settingsFile, json_encode(['content' => [], 'discounts' => []], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

$settings = json_decode((string)file_get_contents($settingsFile), true);
$settings = is_array($settings) ? $settings : ['content' => [], 'discounts' => []];
$settings['content'] = is_array($settings['content'] ?? null) ? $settings['content'] : [];
$uploaded = [];

foreach ($allowedSlots as $slot) {
    if (empty($_FILES[$slot]) || !is_array($_FILES[$slot])) {
        continue;
    }

    $file = $_FILES[$slot];

    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        continue;
    }

    if (($file['size'] ?? 0) > $maxSize) {
        http_response_code(422);
        echo json_encode(['error' => 'File too large']);
        exit;
    }

    $mimeType = mime_content_type((string)$file['tmp_name']);

    if (!isset($allowedMimeTypes[$mimeType])) {
        http_response_code(422);
        echo json_encode(['error' => 'Invalid image type']);
        exit;
    }

    $extension = $allowedMimeTypes[$mimeType];
    $fileName = $slot . '-' . date('YmdHis') . '-' . bin2hex(random_bytes(4)) . '.' . $extension;
    $targetPath = $uploadDir . DIRECTORY_SEPARATOR . $fileName;

    if (!move_uploaded_file((string)$file['tmp_name'], $targetPath)) {
        http_response_code(500);
        echo json_encode(['error' => 'Upload failed']);
        exit;
    }

    $publicPath = 'uploads/' . $fileName;
    $settings['content'][$slot] = $publicPath;
    $uploaded[$slot] = $publicPath;
}

if (empty($uploaded)) {
    http_response_code(400);
    echo json_encode(['error' => 'No images uploaded']);
    exit;
}

$settings['updatedAt'] = gmdate('c');
file_put_contents($settingsFile, json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);

echo json_encode([
    'ok' => true,
    'uploaded' => $uploaded,
    'content' => $settings['content'],
], JSON_UNESCAPED_UNICODE);
