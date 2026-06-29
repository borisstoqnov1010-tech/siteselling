<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['reply' => 'Методът не е позволен.']);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true);
$message = trim((string)($payload['message'] ?? ''));

if ($message === '') {
    http_response_code(400);
    echo json_encode(['reply' => 'Напиши въпрос, за да ти помогна.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$settingsFile = __DIR__ . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'settings.json';
$settings = ['content' => [], 'discounts' => []];

if (file_exists($settingsFile)) {
    $decoded = json_decode((string)file_get_contents($settingsFile), true);

    if (is_array($decoded)) {
        $settings = array_merge($settings, $decoded);
    }
}

$content = $settings['content'] ?? [];
$discounts = $settings['discounts'] ?? [];

$serviceSummary = buildServiceSummary($content, $discounts);
$fallbackReply = fallbackReply($message, $serviceSummary);
$apiKey = getenv('OPENAI_API_KEY') ?: readApiKeyFile();

if (!$apiKey) {
    echo json_encode(['reply' => $fallbackReply], JSON_UNESCAPED_UNICODE);
    exit;
}

$reply = askOpenAI($apiKey, $message, $serviceSummary);

echo json_encode(['reply' => $reply ?: $fallbackReply], JSON_UNESCAPED_UNICODE);

function readApiKeyFile(): string
{
    $keyFile = __DIR__ . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'openai_api_key.txt';

    if (!file_exists($keyFile)) {
        return '';
    }

    return trim((string)file_get_contents($keyFile));
}

function buildServiceSummary(array $content, array $discounts): string
{
    $defaults = [
        'cs2' => ['title' => 'CS 2 Server', 'price' => 4],
        'minecraft' => ['title' => 'Minecraft Server', 'price' => 6],
        'custom' => ['title' => 'Сайт по избор', 'price' => 10],
    ];

    $lines = [];

    foreach ($defaults as $key => $service) {
        $title = (string)($content[$key . 'Title'] ?? $service['title']);
        $price = (float)($content[$key . 'Price'] ?? $service['price']);
        $discount = (int)($discounts[$key]['discount'] ?? 0);
        $duration = (string)($discounts[$key]['duration'] ?? '');
        $finalPrice = $price - ($price * $discount / 100);
        $line = sprintf('%s: %.2f EUR', $title, $finalPrice);

        if ($discount > 0) {
            $line .= sprintf(' (%d%% отстъпка от %.2f EUR', $discount, $price);
            $line .= $duration !== '' ? ', срок: ' . $duration . ')' : ')';
        }

        $lines[] = $line;
    }

    return implode("\n", $lines);
}

function fallbackReply(string $message, string $serviceSummary): string
{
    $lower = function_exists('mb_strtolower')
        ? mb_strtolower($message, 'UTF-8')
        : strtolower($message);

    if (str_contains($lower, 'цена') || str_contains($lower, 'колко') || str_contains($lower, 'пакет')) {
        return "Ето текущите пакети:\n" . $serviceSummary . "\n\nЗа поръчка пиши в Discord: https://discord.gg/sSkQC2UmkY";
    }

    if (str_contains($lower, 'поръч') || str_contains($lower, 'discord') || str_contains($lower, 'контакт')) {
        return "Можеш да поръчаш директно в Discord: https://discord.gg/sSkQC2UmkY. Напиши какъв сайт искаш и какви секции да има.";
    }

    return "Мога да помогна с избор на пакет, цена, срок и какво трябва да изпратиш за сайта. Текущи пакети:\n" . $serviceSummary;
}

function askOpenAI(string $apiKey, string $message, string $serviceSummary): string
{
    if (!function_exists('curl_init')) {
        return '';
    }

    $body = [
        'model' => getenv('OPENAI_MODEL') ?: 'gpt-5-mini',
        'input' => [
            [
                'role' => 'system',
                'content' => 'Ти си кратък и полезен AI помощник за сайта Boris Web Studio. Отговаряй на български. Помагай с избор на пакет, цени, срокове и поръчка. Не измисляй услуги извън контекста. Discord линк: https://discord.gg/sSkQC2UmkY. Текущи услуги и цени: ' . $serviceSummary,
            ],
            [
                'role' => 'user',
                'content' => $message,
            ],
        ],
        'max_output_tokens' => 320,
    ];

    $ch = curl_init('https://api.openai.com/v1/responses');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT => 20,
    ]);

    $result = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if (!$result || $status < 200 || $status >= 300) {
        return '';
    }

    $decoded = json_decode((string)$result, true);

    if (!is_array($decoded)) {
        return '';
    }

    if (!empty($decoded['output_text'])) {
        return trim((string)$decoded['output_text']);
    }

    foreach (($decoded['output'] ?? []) as $item) {
        foreach (($item['content'] ?? []) as $content) {
            if (($content['type'] ?? '') === 'output_text' && !empty($content['text'])) {
                return trim((string)$content['text']);
            }
        }
    }

    return '';
}
