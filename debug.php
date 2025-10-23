<?php
/**
 * Debug Script for Tarneeb Score Tracker
 * 
 * This script helps diagnose deployment issues
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
    <title>Tarneeb Debug</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 5px; margin: 10px 0; }
        code { background: #f8f9fa; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🔍 Tarneeb Debug Information</h1>
    
    <?php
    echo "<h2>📋 System Information</h2>";
    echo "<div class='info'>";
    echo "<strong>PHP Version:</strong> " . PHP_VERSION . "<br>";
    echo "<strong>Server:</strong> " . $_SERVER['SERVER_SOFTWARE'] . "<br>";
    echo "<strong>Document Root:</strong> " . $_SERVER['DOCUMENT_ROOT'] . "<br>";
    echo "<strong>Current Directory:</strong> " . getcwd() . "<br>";
    echo "</div>";
    
    echo "<h2>🔧 File Structure Check</h2>";
    
    $requiredFiles = [
        'index.php' => 'Main application file',
        'api.php' => 'API endpoint',
        'script.js' => 'Frontend JavaScript',
        'styles.css' => 'CSS styles',
        'config/secure_config.php' => 'Configuration system',
        'assets/data/games.json' => 'Game data storage'
    ];
    
    foreach ($requiredFiles as $file => $description) {
        if (file_exists($file)) {
            echo "<div class='success'>✅ $file - $description</div>";
        } else {
            echo "<div class='error'>❌ $file - $description (MISSING)</div>";
        }
    }
    
    echo "<h2>🔒 Environment Variables Check</h2>";
    
    $username = getenv('TARNEEB_ADMIN_USERNAME');
    $passwordHash = getenv('TARNEEB_ADMIN_PASSWORD_HASH');
    
    if ($username && $passwordHash) {
        echo "<div class='success'>✅ Environment variables are set</div>";
        echo "<div class='info'>";
        echo "<strong>Username:</strong> " . htmlspecialchars($username) . "<br>";
        echo "<strong>Password Hash:</strong> " . htmlspecialchars(substr($passwordHash, 0, 20)) . "...<br>";
        echo "</div>";
    } else {
        echo "<div class='error'>❌ Environment variables not found</div>";
        echo "<div class='warning'>";
        echo "<strong>Missing variables:</strong><br>";
        if (!$username) echo "- TARNEEB_ADMIN_USERNAME<br>";
        if (!$passwordHash) echo "- TARNEEB_ADMIN_PASSWORD_HASH<br>";
        echo "</div>";
    }
    
    echo "<h2>🧪 Configuration Test</h2>";
    
    try {
        require_once 'config/secure_config.php';
        $secureConfig = SecureConfig::getInstance();
        $admin = $secureConfig->getAdminCredentials();
        
        echo "<div class='success'>✅ Configuration loaded successfully</div>";
        echo "<div class='info'>";
        echo "<strong>Source:</strong> " . $secureConfig->getSource() . "<br>";
        echo "<strong>Username:</strong> " . htmlspecialchars($admin['username']) . "<br>";
        echo "<strong>Security:</strong> " . ($secureConfig->isSecure() ? 'Secure' : 'Not Secure') . "<br>";
        echo "</div>";
    } catch (Exception $e) {
        echo "<div class='error'>❌ Configuration failed: " . htmlspecialchars($e->getMessage()) . "</div>";
    }
    
    echo "<h2>🌐 API Test</h2>";
    
    try {
        $response = file_get_contents('api.php?action=debug');
        if ($response) {
            $data = json_decode($response, true);
            if ($data) {
                echo "<div class='success'>✅ API is responding</div>";
                echo "<div class='info'>";
                echo "<strong>Status:</strong> " . htmlspecialchars($data['status']) . "<br>";
                echo "<strong>Data file exists:</strong> " . ($data['data_file_exists'] ? 'Yes' : 'No') . "<br>";
                echo "<strong>Photos directory exists:</strong> " . ($data['photos_dir_exists'] ? 'Yes' : 'No') . "<br>";
                echo "</div>";
            } else {
                echo "<div class='error'>❌ API returned invalid JSON</div>";
            }
        } else {
            echo "<div class='error'>❌ API not responding</div>";
        }
    } catch (Exception $e) {
        echo "<div class='error'>❌ API test failed: " . htmlspecialchars($e->getMessage()) . "</div>";
    }
    
    echo "<h2>📁 Directory Permissions</h2>";
    
    $directories = [
        'assets' => 'Game data and photos',
        'assets/data' => 'Game data storage',
        'assets/photos' => 'Photo uploads',
        'config' => 'Configuration files'
    ];
    
    foreach ($directories as $dir => $description) {
        if (is_dir($dir)) {
            $writable = is_writable($dir);
            $readable = is_readable($dir);
            if ($writable && $readable) {
                echo "<div class='success'>✅ $dir - $description (Readable & Writable)</div>";
            } else {
                echo "<div class='warning'>⚠️ $dir - $description (Readable: " . ($readable ? 'Yes' : 'No') . ", Writable: " . ($writable ? 'Yes' : 'No') . ")</div>";
            }
        } else {
            echo "<div class='error'>❌ $dir - $description (Directory not found)</div>";
        }
    }
    
    echo "<h2>🔧 Quick Fixes</h2>";
    
    if (!$username || !$passwordHash) {
        echo "<div class='error'>";
        echo "<h3>❌ Environment Variables Not Set</h3>";
        echo "<p><strong>CRITICAL:</strong> The site will NOT work without environment variables. No fallback credentials are provided for security.</p>";
        echo "<p>You MUST set up environment variables. Here are your options:</p>";
        echo "<ol>";
        echo "<li><strong>cPanel Environment Variables:</strong> Go to cPanel → Environment Variables and add:<br>";
        echo "<code>TARNEEB_ADMIN_USERNAME=your_username</code><br>";
        echo "<code>TARNEEB_ADMIN_PASSWORD_HASH=your_hashed_password</code></li>";
        echo "<li><strong>.bashrc file:</strong> Add to your ~/.bashrc:<br>";
        echo "<code>export TARNEEB_ADMIN_USERNAME=\"your_username\"</code><br>";
        echo "<code>export TARNEEB_ADMIN_PASSWORD_HASH=\"your_hashed_password\"</code></li>";
        echo "</ol>";
        echo "<p><strong>Generate password hash:</strong></p>";
        echo "<pre>php -r \"echo password_hash('your_password', PASSWORD_DEFAULT);\"</pre>";
        echo "<p><strong>Use the setup script:</strong> <a href='setup.php'>Generate credentials and instructions</a></p>";
        echo "</div>";
    }
    
    echo "<div class='info'>";
    echo "<h3>Next Steps</h3>";
    echo "<ol>";
    echo "<li>Fix any missing files or permissions</li>";
    echo "<li>Set up environment variables</li>";
    echo "<li>Test the main application: <a href='index.php'>Visit Tarneeb Tracker</a></li>";
    echo "<li>Delete this debug script after fixing issues</li>";
    echo "</ol>";
    echo "</div>";
    ?>
    
    <p><a href="index.php">← Back to Tarneeb Tracker</a></p>
</body>
</html>
