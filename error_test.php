<?php
// Test what error is happening in the API

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Start session
session_start();

echo "Testing API error...\n\n";

// Test 1: Try to load secure config
echo "1. Testing secure config load:\n";
try {
    require_once 'config/secure_config.php';
    $secureConfig = SecureConfig::getInstance();
    echo "✅ Secure config loaded successfully\n";
} catch (Exception $e) {
    echo "❌ Secure config error: " . $e->getMessage() . "\n";
}

// Test 2: Test environment variables
echo "\n2. Testing environment variables:\n";
$username = getenv('TARNEEB_ADMIN_USERNAME');
$passwordHash = getenv('TARNEEB_ADMIN_PASSWORD_HASH');
echo "Username: " . ($username ? $username : 'NOT SET') . "\n";
echo "Password Hash: " . ($passwordHash ? substr($passwordHash, 0, 20) . '...' : 'NOT SET') . "\n";

// Test 3: Test login simulation
echo "\n3. Testing login simulation:\n";
try {
    // Simulate login request
    $_SERVER['REQUEST_METHOD'] = 'POST';
    $_GET['action'] = 'login';
    
    // Mock input
    $input = [
        'username' => 'rhc',
        'password' => 'test',
        'csrf_token' => 'test'
    ];
    
    // Test CSRF validation
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = 'test';
    }
    
    echo "CSRF token set: " . $_SESSION['csrf_token'] . "\n";
    
    // Test authentication
    if (isset($secureConfig)) {
        $admin = $secureConfig->getAdminCredentials();
        echo "Admin username from config: " . $admin['username'] . "\n";
        echo "Admin password hash length: " . strlen($admin['password_hash']) . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Login simulation error: " . $e->getMessage() . "\n";
}

echo "\n4. PHP Error Log:\n";
if (file_exists('assets/debug.log')) {
    $log = file_get_contents('assets/debug.log');
    echo $log;
} else {
    echo "No debug log found\n";
}
?>
