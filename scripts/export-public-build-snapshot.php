<?php

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script must run in CLI mode.\n");
    exit(1);
}

$projectRoot = $argv[1] ?? dirname(__DIR__);
$projectRoot = rtrim((string) $projectRoot, DIRECTORY_SEPARATOR);
$dbPath = $projectRoot . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'database.sqlite';

if (!is_file($dbPath)) {
    fwrite(STDERR, "Missing database file: {$dbPath}\n");
    exit(1);
}

$pdo = new PDO('sqlite:' . $dbPath, null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

function tableExists(PDO $pdo, string $tableName): bool
{
    $stmt = $pdo->prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1");
    $stmt->execute([$tableName]);
    return (bool) $stmt->fetchColumn();
}

function fetchAllRows(PDO $pdo, string $query): array
{
    return $pdo->query($query)->fetchAll() ?: [];
}

function getTableColumns(PDO $pdo, string $tableName): array
{
    if (!tableExists($pdo, $tableName)) {
        return [];
    }

    $rows = fetchAllRows($pdo, sprintf('PRAGMA table_info(%s)', $tableName));
    return array_values(array_filter(array_map(static fn(array $row): string => (string) ($row['name'] ?? ''), $rows)));
}

function buildOrderedSelect(string $tableName, array $columns, array $preferredOrder): string
{
    $orderParts = [];
    foreach ($preferredOrder as $candidate) {
        $columnName = (string) ($candidate['column'] ?? '');
        $expression = (string) ($candidate['expression'] ?? '');

        if ($columnName !== '' && $expression !== '' && in_array($columnName, $columns, true)) {
            $orderParts[] = $expression;
        }
    }

    $orderSql = $orderParts ? ' ORDER BY ' . implode(', ', $orderParts) : '';
    return sprintf('SELECT * FROM %s%s', $tableName, $orderSql);
}

function fetchPublicSettings(PDO $pdo): array
{
    if (!tableExists($pdo, 'settings')) {
        return [];
    }

    $rows = fetchAllRows($pdo, 'SELECT key, value FROM settings');
    $settings = [];
    $blockedKeys = [
        'github_publish_token',
        'stripe_secret',
        'stripe_webhook_secret',
    ];

    foreach ($rows as $row) {
        $key = trim((string) ($row['key'] ?? ''));
        if ($key === '' || str_starts_with($key, 'site_publish_') || in_array($key, $blockedKeys, true) || str_ends_with($key, '_configured')) {
            continue;
        }

        $settings[$key] = (string) ($row['value'] ?? '');
    }

    return $settings;
}

$snapshot = [
    'generated_at' => gmdate('c'),
    'products' => tableExists($pdo, 'products')
        ? fetchAllRows($pdo, buildOrderedSelect('products', getTableColumns($pdo, 'products'), [
            ['column' => 'display_order', 'expression' => 'display_order ASC'],
            ['column' => 'id', 'expression' => 'id DESC'],
        ]))
        : [],
    'page_settings' => tableExists($pdo, 'page_settings')
        ? fetchAllRows($pdo, buildOrderedSelect('page_settings', getTableColumns($pdo, 'page_settings'), [
            ['column' => 'page_name', 'expression' => 'page_name ASC'],
            ['column' => 'page_key', 'expression' => 'page_key ASC'],
        ]))
        : [],
    'settings' => fetchPublicSettings($pdo),
    'reviews' => tableExists($pdo, 'reviews')
        ? fetchAllRows($pdo, 'SELECT * FROM reviews WHERE is_active = 1 ORDER BY order_index ASC, id ASC')
        : [],
    'courses' => tableExists($pdo, 'courses')
        ? fetchAllRows($pdo, buildOrderedSelect('courses', getTableColumns($pdo, 'courses'), [
            ['column' => 'id', 'expression' => 'id ASC'],
        ]))
        : [],
    'modules' => tableExists($pdo, 'modules')
        ? fetchAllRows($pdo, buildOrderedSelect('modules', getTableColumns($pdo, 'modules'), [
            ['column' => 'order_index', 'expression' => 'order_index ASC'],
            ['column' => 'created_at', 'expression' => 'created_at ASC'],
            ['column' => 'id', 'expression' => 'id ASC'],
        ]))
        : [],
    'lessons' => tableExists($pdo, 'lessons')
        ? fetchAllRows($pdo, buildOrderedSelect('lessons', getTableColumns($pdo, 'lessons'), [
            ['column' => 'order_index', 'expression' => 'order_index ASC'],
            ['column' => 'created_at', 'expression' => 'created_at ASC'],
            ['column' => 'id', 'expression' => 'id ASC'],
        ]))
        : [],
    'lesson_attachments' => tableExists($pdo, 'lesson_attachments')
        ? fetchAllRows($pdo, buildOrderedSelect('lesson_attachments', getTableColumns($pdo, 'lesson_attachments'), [
            ['column' => 'created_at', 'expression' => 'created_at ASC'],
            ['column' => 'id', 'expression' => 'id ASC'],
        ]))
        : [],
];

fwrite(STDOUT, json_encode($snapshot, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . PHP_EOL);