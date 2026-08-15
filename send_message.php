<?php
declare(strict_types=1);

/**
 * Script de teste para envio de mensagem via Z-API usando variaveis de apps/api/.env
 *
 * Uso (CLI):
 *   php send_message.php --phone=5511999999999 --message="Teste de envio"
 *
 * Uso (HTTP):
 *   /send_message.php?phone=5511999999999&message=Teste%20de%20envio
 */

function loadEnvFile(string $filePath): array
{
    $env = [];

    if (!is_file($filePath)) {
        return $env;
    }

    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return $env;
    }

    foreach ($lines as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || str_starts_with($trimmed, '#')) {
            continue;
        }

        $separatorPos = strpos($trimmed, '=');
        if ($separatorPos === false) {
            continue;
        }

        $key = trim(substr($trimmed, 0, $separatorPos));
        $value = trim(substr($trimmed, $separatorPos + 1));

        if ($key === '') {
            continue;
        }

        if (
            strlen($value) >= 2
            && (
                ($value[0] === '"' && $value[strlen($value) - 1] === '"')
                || ($value[0] === "'" && $value[strlen($value) - 1] === "'")
            )
        ) {
            $value = substr($value, 1, -1);
        }

        $env[$key] = $value;
    }

    return $env;
}

function envValue(array $env, string $key, string $default = ''): string
{
    return isset($env[$key]) ? (string) $env[$key] : $default;
}

function sanitizePhone(string $phone): string
{
    return preg_replace('/\D+/', '', $phone) ?? '';
}

function resolveSendTextUrl(array $env): string
{
    $explicitUrl = trim(envValue($env, 'ZAPI_SEND_TEXT_URL'));
    if ($explicitUrl !== '') {
        $normalized = rtrim($explicitUrl, '/');
        if (!preg_match('/\/send-text$/i', $normalized)) {
            $normalized .= '/send-text';
        }
        return $normalized;
    }

    $instanceId = trim(envValue($env, 'ZAPI_INSTANCE_ID'));
    $instanceToken = trim(envValue($env, 'ZAPI_INSTANCE_TOKEN'));
    $baseUrl = rtrim(trim(envValue($env, 'ZAPI_BASE_URL', 'https://api.z-api.io')), '/');

    if (preg_match('/\/instances\/[^\/]+\/token\/[^\/]+/i', $baseUrl)) {
        if (!preg_match('/\/send-text$/i', $baseUrl)) {
            $baseUrl .= '/send-text';
        }
        return $baseUrl;
    }

    if ($instanceId === '' || $instanceToken === '') {
        return '';
    }

    return $baseUrl . '/instances/' . $instanceId . '/token/' . $instanceToken . '/send-text';
}

function readInput(array $env): array
{
    if (PHP_SAPI === 'cli') {
        $options = getopt('', ['phone::', 'message::']);
        $phone = isset($options['phone']) ? (string) $options['phone'] : '';
        $message = isset($options['message']) ? (string) $options['message'] : '';
    } else {
        $phone = isset($_GET['phone']) ? (string) $_GET['phone'] : '';
        $message = isset($_GET['message']) ? (string) $_GET['message'] : '';
    }

    if ($phone === '') {
        $phone = envValue($env, 'ZAPI_DEFAULT_TARGET_PHONE');
    }
    if ($message === '') {
        $message = 'Teste de envio do sistema JLR AI Studio';
    }

    return [
        'phone' => sanitizePhone($phone),
        'message' => $message,
    ];
}

function outputJson(int $statusCode, array $payload): void
{
    if (PHP_SAPI !== 'cli') {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
}

$envPath = __DIR__ . DIRECTORY_SEPARATOR . 'apps' . DIRECTORY_SEPARATOR . 'api' . DIRECTORY_SEPARATOR . '.env';
$env = loadEnvFile($envPath);

$url = resolveSendTextUrl($env);
if ($url === '') {
    outputJson(500, [
        'success' => false,
        'message' => 'Configuracao Z-API ausente. Defina ZAPI_SEND_TEXT_URL ou ZAPI_INSTANCE_ID + ZAPI_INSTANCE_TOKEN.',
    ]);
    exit(1);
}

$input = readInput($env);
if ($input['phone'] === '') {
    outputJson(400, [
        'success' => false,
        'message' => 'Telefone de destino ausente. Informe --phone ou ZAPI_DEFAULT_TARGET_PHONE.',
    ]);
    exit(1);
}

$payload = [
    'phone' => $input['phone'],
    'message' => $input['message'],
];

$headers = ['Content-Type: application/json'];
$clientToken = trim(envValue($env, 'ZAPI_CLIENT_TOKEN'));
if ($clientToken !== '') {
    $headers[] = 'Client-Token: ' . $clientToken;
}

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_UNICODE));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt($ch, CURLOPT_PROXY, '');
curl_setopt($ch, CURLOPT_NOPROXY, '*');

$response = curl_exec($ch);
$httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) {
    outputJson(500, [
        'success' => false,
        'message' => 'Falha na requisicao cURL.',
        'detail' => $curlError,
    ]);
    exit(1);
}

$decoded = json_decode($response, true);
$responseBody = is_array($decoded) ? $decoded : ['raw' => $response];
$hasApiError = is_array($decoded)
    && (
        (isset($decoded['error']) && (string) $decoded['error'] !== '')
        || (array_key_exists('success', $decoded) && $decoded['success'] === false)
    );
$success = $httpCode >= 200 && $httpCode < 300 && !$hasApiError;

outputJson($success ? 200 : 502, [
    'success' => $success,
    'status' => $httpCode,
    'request' => [
        'phone' => $payload['phone'],
        'message' => $payload['message'],
    ],
    'response' => $responseBody,
]);

exit($success ? 0 : 1);
