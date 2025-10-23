<?php
// Simple test to see what's happening with the API

echo "Testing API endpoints...\n\n";

// Test 1: Basic API call
echo "1. Testing games endpoint:\n";
$url = 'api.php?action=games';
$response = file_get_contents($url);
echo "Response: " . $response . "\n\n";

// Test 2: Debug endpoint
echo "2. Testing debug endpoint:\n";
$url = 'api.php?action=debug';
$response = file_get_contents($url);
echo "Response: " . $response . "\n\n";

// Test 3: Check if files exist
echo "3. File existence check:\n";
echo "api.php exists: " . (file_exists('api.php') ? 'Yes' : 'No') . "\n";
echo "games.json exists: " . (file_exists('assets/data/games.json') ? 'Yes' : 'No') . "\n";
echo "secure_config.php exists: " . (file_exists('config/secure_config.php') ? 'Yes' : 'No') . "\n\n";

// Test 4: Check PHP errors
echo "4. PHP error check:\n";
$error_reporting = error_reporting();
echo "Error reporting level: " . $error_reporting . "\n";
echo "Display errors: " . ini_get('display_errors') . "\n\n";

// Test 5: Try to load games directly
echo "5. Direct games.json load:\n";
if (file_exists('assets/data/games.json')) {
    $content = file_get_contents('assets/data/games.json');
    $data = json_decode($content, true);
    if ($data) {
        echo "Games count: " . count($data['games']) . "\n";
    } else {
        echo "JSON decode error: " . json_last_error_msg() . "\n";
    }
} else {
    echo "games.json not found\n";
}
?>
