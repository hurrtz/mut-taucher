<?php

/**
 * Front controller — routes all API requests.
 */

require_once __DIR__ . '/vendor/autoload.php';

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
require_once __DIR__ . '/routes/clients.php';
require_once __DIR__ . '/routes/therapies.php';
require_once __DIR__ . '/routes/groups.php';

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

if ($method === 'GET' && $uri === '/groups/active') {
    handleGetActiveGroup();
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

if ($method === 'POST' && preg_match('#^/admin/bookings/(\d+)/migrate-to-client$#', $uri, $m)) {
    handleMigrateBookingToClient((int)$m[1]);
    exit;
}

// Admin: groups
if ($method === 'GET' && $uri === '/admin/groups') {
    handleGetGroups();
    exit;
}

if ($method === 'GET' && preg_match('#^/admin/groups/(\d+)$#', $uri, $m)) {
    handleGetGroup((int)$m[1]);
    exit;
}

if ($method === 'POST' && $uri === '/admin/groups') {
    handleCreateGroup();
    exit;
}

if ($method === 'PUT' && preg_match('#^/admin/groups/(\d+)$#', $uri, $m)) {
    handleUpdateGroup((int)$m[1]);
    exit;
}

if ($method === 'DELETE' && preg_match('#^/admin/groups/(\d+)$#', $uri, $m)) {
    handleDeleteGroup((int)$m[1]);
    exit;
}

// Admin: group participants
if ($method === 'POST' && preg_match('#^/admin/groups/(\d+)/participants$#', $uri, $m)) {
    handleAddParticipant((int)$m[1]);
    exit;
}

if ($method === 'DELETE' && preg_match('#^/admin/groups/(\d+)/participants/(\d+)$#', $uri, $m)) {
    handleRemoveParticipant((int)$m[1], (int)$m[2]);
    exit;
}

// Admin: group schedule exceptions
if ($method === 'POST' && preg_match('#^/admin/groups/(\d+)/exceptions$#', $uri, $m)) {
    handleToggleGroupException((int)$m[1]);
    exit;
}

// Admin: group sessions
if ($method === 'GET' && preg_match('#^/admin/groups/(\d+)/sessions$#', $uri, $m)) {
    handleGetGroupSessions((int)$m[1]);
    exit;
}

if ($method === 'POST' && preg_match('#^/admin/groups/(\d+)/sessions$#', $uri, $m)) {
    handleCreateGroupSession((int)$m[1]);
    exit;
}

if ($method === 'POST' && preg_match('#^/admin/groups/(\d+)/sessions/generate$#', $uri, $m)) {
    handleGenerateGroupSessions((int)$m[1]);
    exit;
}

if ($method === 'PATCH' && preg_match('#^/admin/group-sessions/(\d+)$#', $uri, $m)) {
    handleUpdateGroupSession((int)$m[1]);
    exit;
}

if ($method === 'DELETE' && preg_match('#^/admin/group-sessions/(\d+)$#', $uri, $m)) {
    handleDeleteGroupSession((int)$m[1]);
    exit;
}

// Admin: group session payments
if ($method === 'PATCH' && preg_match('#^/admin/group-session-payments/(\d+)$#', $uri, $m)) {
    handleUpdateGroupPayment((int)$m[1]);
    exit;
}

if ($method === 'POST' && preg_match('#^/admin/group-session-payments/(\d+)/invoice$#', $uri, $m)) {
    handleSendGroupInvoice((int)$m[1]);
    exit;
}

if ($method === 'POST' && $uri === '/contact') {
    handleContact();
    exit;
}

// Admin: clients
if ($method === 'GET' && $uri === '/admin/clients') {
    handleGetClients();
    exit;
}

if ($method === 'GET' && preg_match('#^/admin/clients/(\d+)$#', $uri, $m)) {
    handleGetClient((int)$m[1]);
    exit;
}

if ($method === 'POST' && $uri === '/admin/clients') {
    handleCreateClient();
    exit;
}

if ($method === 'PUT' && preg_match('#^/admin/clients/(\d+)$#', $uri, $m)) {
    handleUpdateClient((int)$m[1]);
    exit;
}

if ($method === 'DELETE' && preg_match('#^/admin/clients/(\d+)$#', $uri, $m)) {
    handleDeleteClient((int)$m[1]);
    exit;
}

// Admin: therapies
if ($method === 'GET' && $uri === '/admin/therapies') {
    handleGetTherapies();
    exit;
}

if ($method === 'GET' && preg_match('#^/admin/therapies/(\d+)$#', $uri, $m)) {
    handleGetTherapy((int)$m[1]);
    exit;
}

if ($method === 'POST' && $uri === '/admin/therapies') {
    handleCreateTherapy();
    exit;
}

if ($method === 'PUT' && preg_match('#^/admin/therapies/(\d+)$#', $uri, $m)) {
    handleUpdateTherapy((int)$m[1]);
    exit;
}

if ($method === 'DELETE' && preg_match('#^/admin/therapies/(\d+)$#', $uri, $m)) {
    handleDeleteTherapy((int)$m[1]);
    exit;
}

if ($method === 'POST' && preg_match('#^/admin/therapies/(\d+)/exceptions$#', $uri, $m)) {
    handleToggleTherapyException((int)$m[1]);
    exit;
}

// Admin: therapy sessions
if ($method === 'GET' && preg_match('#^/admin/therapies/(\d+)/sessions$#', $uri, $m)) {
    handleGetTherapySessions((int)$m[1]);
    exit;
}

if ($method === 'POST' && preg_match('#^/admin/therapies/(\d+)/sessions$#', $uri, $m)) {
    handleCreateTherapySession((int)$m[1]);
    exit;
}

if ($method === 'POST' && preg_match('#^/admin/therapies/(\d+)/sessions/generate$#', $uri, $m)) {
    handleGenerateSessions((int)$m[1]);
    exit;
}

if ($method === 'PATCH' && preg_match('#^/admin/sessions/(\d+)$#', $uri, $m)) {
    handleUpdateSession((int)$m[1]);
    exit;
}

if ($method === 'DELETE' && preg_match('#^/admin/sessions/(\d+)$#', $uri, $m)) {
    handleDeleteSession((int)$m[1]);
    exit;
}

if ($method === 'POST' && preg_match('#^/admin/sessions/(\d+)/invoice$#', $uri, $m)) {
    handleSendInvoice((int)$m[1]);
    exit;
}

// Admin: documents
if ($method === 'POST' && $uri === '/admin/documents/send') {
    handleDocumentSend();
    exit;
}

if ($method === 'GET' && $uri === '/admin/documents/status') {
    handleDocumentStatus();
    exit;
}

if ($method === 'GET' && $uri === '/admin/documents/registry') {
    handleDocumentRegistry();
    exit;
}

// 404
http_response_code(404);
echo json_encode(['error' => 'Route nicht gefunden']);
