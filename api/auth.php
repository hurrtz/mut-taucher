<?php

require_once __DIR__ . '/jwt.php';

/**
 * Validate JWT from Authorization header.
 * Sends 401 and exits if invalid.
 */
function requireAuth(): array {
    $config = require __DIR__ . '/config.php';

    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
        // Fallback: accept token as query parameter (for iframe/img src)
        $queryToken = $_GET['token'] ?? '';
        if ($queryToken) {
            $matches = [null, $queryToken];
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Token fehlt']);
            exit;
        }
    }

    $payload = jwtDecode($matches[1], $config['jwt_secret']);
    if ($payload === null) {
        http_response_code(401);
        echo json_encode(['error' => 'Token ungültig oder abgelaufen']);
        exit;
    }

    return $payload;
}
