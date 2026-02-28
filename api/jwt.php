<?php

/**
 * Minimal JWT implementation using HMAC-SHA256.
 * No external dependencies required.
 */

function base64UrlEncode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwtEncode(array $payload, string $secret): string {
    $header = base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $body   = base64UrlEncode(json_encode($payload));
    $sig    = base64UrlEncode(hash_hmac('sha256', "$header.$body", $secret, true));
    return "$header.$body.$sig";
}

function jwtDecode(string $token, string $secret): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    [$header, $body, $sig] = $parts;

    $expectedSig = base64UrlEncode(hash_hmac('sha256', "$header.$body", $secret, true));
    if (!hash_equals($expectedSig, $sig)) return null;

    $payload = json_decode(base64UrlDecode($body), true);
    if (!is_array($payload)) return null;

    // Check expiry
    if (isset($payload['exp']) && $payload['exp'] < time()) return null;

    return $payload;
}
