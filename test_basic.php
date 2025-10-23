<?php
/**
 * Basic API Test Script
 * 
 * This script tests if the basic API endpoints work without authentication
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Basic API Test</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 5px; margin: 10px 0; }
        code { background: #f8f9fa; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🧪 Basic API Test</h1>
    
    <?php
    echo "<h2>📋 Testing Public Endpoints</h2>";
    
    // Test 1: Debug endpoint
    echo "<h3>Test 1: Debug Endpoint</h3>";
    try {
        $response = file_get_contents('api.php?action=debug');
        if ($response) {
            $data = json_decode($response, true);
            if ($data && isset($data['status'])) {
                echo "<div class='success'>✅ Debug endpoint working</div>";
                echo "<div class='info'>";
                echo "<strong>Status:</strong> " . htmlspecialchars($data['status']) . "<br>";
                echo "<strong>Data file exists:</strong> " . ($data['data_file_exists'] ? 'Yes' : 'No') . "<br>";
                echo "<strong>Photos directory exists:</strong> " . ($data['photos_dir_exists'] ? 'Yes' : 'No') . "<br>";
                echo "</div>";
            } else {
                echo "<div class='error'>❌ Debug endpoint returned invalid data</div>";
                echo "<pre>" . htmlspecialchars($response) . "</pre>";
            }
        } else {
            echo "<div class='error'>❌ Debug endpoint not responding</div>";
        }
    } catch (Exception $e) {
        echo "<div class='error'>❌ Debug endpoint error: " . htmlspecialchars($e->getMessage()) . "</div>";
    }
    
    // Test 2: Games endpoint
    echo "<h3>Test 2: Games Endpoint</h3>";
    try {
        $response = file_get_contents('api.php?action=games');
        if ($response) {
            $data = json_decode($response, true);
            if ($data && isset($data['games'])) {
                echo "<div class='success'>✅ Games endpoint working</div>";
                echo "<div class='info'>";
                echo "<strong>Games count:</strong> " . count($data['games']) . "<br>";
                echo "<strong>Version:</strong> " . (isset($data['version']) ? $data['version'] : 'Unknown') . "<br>";
                echo "</div>";
            } else {
                echo "<div class='error'>❌ Games endpoint returned invalid data</div>";
                echo "<pre>" . htmlspecialchars($response) . "</pre>";
            }
        } else {
            echo "<div class='error'>❌ Games endpoint not responding</div>";
        }
    } catch (Exception $e) {
        echo "<div class='error'>❌ Games endpoint error: " . htmlspecialchars($e->getMessage()) . "</div>";
    }
    
    // Test 3: Auth status endpoint
    echo "<h3>Test 3: Auth Status Endpoint</h3>";
    try {
        $response = file_get_contents('api.php?action=auth-status');
        if ($response) {
            $data = json_decode($response, true);
            if ($data && isset($data['authenticated'])) {
                echo "<div class='success'>✅ Auth status endpoint working</div>";
                echo "<div class='info'>";
                echo "<strong>Authenticated:</strong> " . ($data['authenticated'] ? 'Yes' : 'No') . "<br>";
                echo "</div>";
            } else {
                echo "<div class='error'>❌ Auth status endpoint returned invalid data</div>";
                echo "<pre>" . htmlspecialchars($response) . "</pre>";
            }
        } else {
            echo "<div class='error'>❌ Auth status endpoint not responding</div>";
        }
    } catch (Exception $e) {
        echo "<div class='error'>❌ Auth status endpoint error: " . htmlspecialchars($e->getMessage()) . "</div>";
    }
    
    // Test 4: CSRF token endpoint
    echo "<h3>Test 4: CSRF Token Endpoint</h3>";
    try {
        $response = file_get_contents('api.php?action=csrf-token');
        if ($response) {
            $data = json_decode($response, true);
            if ($data && isset($data['csrf_token'])) {
                echo "<div class='success'>✅ CSRF token endpoint working</div>";
                echo "<div class='info'>";
                echo "<strong>Token length:</strong> " . strlen($data['csrf_token']) . " characters<br>";
                echo "<strong>Token preview:</strong> " . htmlspecialchars(substr($data['csrf_token'], 0, 10)) . "...<br>";
                echo "</div>";
            } else {
                echo "<div class='error'>❌ CSRF token endpoint returned invalid data</div>";
                echo "<pre>" . htmlspecialchars($response) . "</pre>";
            }
        } else {
            echo "<div class='error'>❌ CSRF token endpoint not responding</div>";
        }
    } catch (Exception $e) {
        echo "<div class='error'>❌ CSRF token endpoint error: " . htmlspecialchars($e->getMessage()) . "</div>";
    }
    
    echo "<h2>📁 File Structure Check</h2>";
    
    $requiredFiles = [
        'api.php' => 'API endpoint',
        'index.php' => 'Main application',
        'script.js' => 'Frontend JavaScript',
        'styles.css' => 'CSS styles',
        'assets/data/games.json' => 'Game data storage'
    ];
    
    foreach ($requiredFiles as $file => $description) {
        if (file_exists($file)) {
            echo "<div class='success'>✅ $file - $description</div>";
        } else {
            echo "<div class='error'>❌ $file - $description (MISSING)</div>";
        }
    }
    
    echo "<h2>🔧 Next Steps</h2>";
    
    echo "<div class='info'>";
    echo "<h3>If all tests pass:</h3>";
    echo "<p>Your basic API is working! The public parts of the site should be functional.</p>";
    echo "<p><a href='index.php'>Go to Tarneeb Tracker</a></p>";
    echo "</div>";
    
    echo "<div class='info'>";
    echo "<h3>If tests fail:</h3>";
    echo "<p>Check the error messages above and fix any issues.</p>";
    echo "<p>Common issues:</p>";
    echo "<ul>";
    echo "<li>Missing files</li>";
    echo "<li>Permission problems</li>";
    echo "<li>PHP errors</li>";
    echo "<li>Server configuration issues</li>";
    echo "</ul>";
    echo "</div>";
    ?>
    
    <p><a href="debug.php">← Back to Debug Script</a> | <a href="index.php">Go to Tarneeb Tracker</a></p>
</body>
</html>
