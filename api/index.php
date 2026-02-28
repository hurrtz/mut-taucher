<?php

/**
 * Front controller — routes all API requests.
 */

header('Content-Type: application/json; charset=utf-8');

// CORS for development
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 86400');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/routes/public.php';
require_once __DIR__ . '/routes/admin.php';

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Strip /api prefix if present (for dev server: php -S localhost:8000 -t api/)
$uri = preg_replace('#^/api#', '', $uri);
// Ensure leading slash
if ($uri === '' || $uri === false) $uri = '/';

// ─── Route matching ──────────────────────────────────────────────

// Public routes
if ($method === 'GET' && $uri === '/slots') {
    handleGetSlots();
    exit;
}

if ($method === 'POST' && $uri === '/bookings') {
    handleCreateBooking();
    exit;
}

// Auth
if ($method === 'POST' && $uri === '/login') {
    handleLogin();
    exit;
}

// Admin: rules
if ($method === 'GET' && $uri === '/admin/rules') {
    handleGetRules();
    exit;
}

if ($method === 'POST' && $uri === '/admin/rules') {
    handleCreateRule();
    exit;
}

if ($method === 'PUT' && preg_match('#^/admin/rules/(\d+)$#', $uri, $m)) {
    handleUpdateRule((int)$m[1]);
    exit;
}

if ($method === 'DELETE' && preg_match('#^/admin/rules/(\d+)$#', $uri, $m)) {
    handleDeleteRule((int)$m[1]);
    exit;
}

if ($method === 'POST' && preg_match('#^/admin/rules/(\d+)/exceptions$#', $uri, $m)) {
    handleToggleException((int)$m[1]);
    exit;
}

// Admin: events
if ($method === 'GET' && $uri === '/admin/events') {
    handleGetEvents();
    exit;
}

if ($method === 'POST' && $uri === '/admin/events') {
    handleCreateEvent();
    exit;
}

if ($method === 'DELETE' && preg_match('#^/admin/events/(\d+)$#', $uri, $m)) {
    handleDeleteEvent((int)$m[1]);
    exit;
}

// Admin: bookings
if ($method === 'GET' && $uri === '/admin/bookings') {
    handleGetBookings();
    exit;
}

if ($method === 'PATCH' && preg_match('#^/admin/bookings/(\d+)$#', $uri, $m)) {
    handleUpdateBooking((int)$m[1]);
    exit;
}

if ($method === 'POST' && preg_match('#^/admin/bookings/(\d+)/email$#', $uri, $m)) {
    handleSendEmail((int)$m[1]);
    exit;
}

// 404
http_response_code(404);
echo json_encode(['error' => 'Route nicht gefunden']);
