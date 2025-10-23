<?php
// Quick test to see what's happening

echo "Testing API endpoints...\n\n";

// Test 1: Games endpoint
echo "1. Testing games endpoint:\n";
$response = file_get_contents('api.php?action=games');
echo "Response: " . $response . "\n\n";

// Test 2: Debug endpoint  
echo "2. Testing debug endpoint:\n";
$response = file_get_contents('api.php?action=debug');
echo "Response: " . $response . "\n\n";

// Test 3: Check if we can load games.json directly
echo "3. Testing games.json direct load:\n";
if (file_exists('assets/data/games.json')) {
    $content = file_get_contents('assets/data/games.json');
    $data = json_decode($content, true);
    if ($data) {
        echo "Games count: " . count($data['games']) . "\n";
        echo "First game ID: " . $data['games'][0]['id'] . "\n";
    } else {
        echo "JSON decode error: " . json_last_error_msg() . "\n";
    }
} else {
    echo "games.json not found\n";
}

// Test 4: Check PHP errors
echo "\n4. PHP error check:\n";
$error_log = ini_get('error_log');
echo "Error log: " . $error_log . "\n";

if (file_exists('assets/debug.log')) {
    echo "Debug log content:\n";
    echo file_get_contents('assets/debug.log');
} else {
    echo "No debug log found\n";
}
?>
