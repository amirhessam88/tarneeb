<?php
/**
 * Simple Login Test
 * 
 * This script tests the login functionality directly
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Start session
session_start();

echo "Testing login functionality...\n\n";

// Test 1: Check environment variables
echo "1. Environment Variables:\n";
$username = getenv('TARNEEB_ADMIN_USERNAME');
$passwordHash = getenv('TARNEEB_ADMIN_PASSWORD_HASH');

if ($username && $passwordHash) {
    echo "✅ Username: " . $username . "\n";
    echo "✅ Password Hash: " . substr($passwordHash, 0, 20) . "...\n";
} else {
    echo "❌ Environment variables not set!\n";
    echo "Username: " . ($username ? $username : 'NOT SET') . "\n";
    echo "Password Hash: " . ($passwordHash ? substr($passwordHash, 0, 20) . '...' : 'NOT SET') . "\n";
    exit;
}

// Test 2: Test password verification
echo "\n2. Password Verification Test:\n";
$testPassword = 'rhc'; // Your password
if (password_verify($testPassword, $passwordHash)) {
    echo "✅ Password verification successful!\n";
} else {
    echo "❌ Password verification failed!\n";
    echo "Make sure your password is correct.\n";
}

// Test 3: Test configuration loading
echo "\n3. Configuration Loading Test:\n";
try {
    require_once 'config/secure_config.php';
    $secureConfig = SecureConfig::getInstance();
    $admin = $secureConfig->getAdminCredentials();
    
    echo "✅ Configuration loaded successfully!\n";
    echo "Admin username: " . $admin['username'] . "\n";
    echo "Admin password hash length: " . strlen($admin['password_hash']) . "\n";
} catch (Exception $e) {
    echo "❌ Configuration error: " . $e->getMessage() . "\n";
}

// Test 4: Test API login endpoint
echo "\n4. API Login Test:\n";
try {
    // Simulate login request
    $postData = json_encode([
        'username' => 'rhc',
        'password' => 'rhc',
        'csrf_token' => 'test'
    ]);
    
    // Set up context for POST request
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => $postData
        ]
    ]);
    
    $response = file_get_contents('api.php?action=login', false, $context);
    echo "API Response: " . $response . "\n";
    
} catch (Exception $e) {
    echo "❌ API test error: " . $e->getMessage() . "\n";
}

echo "\n5. Rate Limiting Check:\n";
$rateLimitFile = 'assets/rate_limit.json';
if (file_exists($rateLimitFile)) {
    $rateLimitData = json_decode(file_get_contents($rateLimitFile), true);
    if ($rateLimitData) {
        echo "Rate limiting data found:\n";
        print_r($rateLimitData);
    } else {
        echo "Rate limiting file exists but is empty.\n";
    }
} else {
    echo "No rate limiting file found.\n";
}
?>
