<?php
/**
 * Environment Variables Test Script
 * 
 * This script tests if your environment variables are properly configured
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
    <title>Environment Variables Test</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 5px; margin: 10px 0; }
        code { background: #f8f9fa; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🔒 Environment Variables Test</h1>
    
    <?php
    $username = getenv('TARNEEB_ADMIN_USERNAME');
    $passwordHash = getenv('TARNEEB_ADMIN_PASSWORD_HASH');
    
    if ($username && $passwordHash) {
        echo "<div class='success'>";
        echo "<h2>✅ Environment Variables Found</h2>";
        echo "<p><strong>Username:</strong> " . htmlspecialchars($username) . "</p>";
        echo "<p><strong>Password Hash:</strong> " . htmlspecialchars(substr($passwordHash, 0, 20)) . "...</p>";
        echo "<p><strong>Hash Length:</strong> " . strlen($passwordHash) . " characters</p>";
        echo "</div>";
        
        // Test if the hash is valid
        if (strpos($passwordHash, '$2y$') === 0) {
            echo "<div class='success'>";
            echo "<h3>✅ Password Hash Format Valid</h3>";
            echo "<p>The password hash appears to be in the correct bcrypt format.</p>";
            echo "</div>";
        } else {
            echo "<div class='error'>";
            echo "<h3>❌ Invalid Password Hash Format</h3>";
            echo "<p>The password hash doesn't appear to be in bcrypt format. It should start with '$2y$'.</p>";
            echo "</div>";
        }
        
        // Test configuration loading
        try {
            require_once 'config/secure_config.php';
            $secureConfig = SecureConfig::getInstance();
            $admin = $secureConfig->getAdminCredentials();
            
            echo "<div class='success'>";
            echo "<h3>✅ Configuration Loaded Successfully</h3>";
            echo "<p><strong>Source:</strong> " . $secureConfig->getSource() . "</p>";
            echo "<p><strong>Security Status:</strong> " . ($secureConfig->isSecure() ? 'Secure' : 'Not Secure') . "</p>";
            echo "</div>";
            
            echo "<div class='info'>";
            echo "<h3>🎉 Your Setup is Working!</h3>";
            echo "<p>You can now use your Tarneeb Score Tracker with secure authentication.</p>";
            echo "<p><a href='index.php'>Go to Tarneeb Tracker</a></p>";
            echo "</div>";
            
        } catch (Exception $e) {
            echo "<div class='error'>";
            echo "<h3>❌ Configuration Error</h3>";
            echo "<p>Error: " . htmlspecialchars($e->getMessage()) . "</p>";
            echo "</div>";
        }
        
    } else {
        echo "<div class='error'>";
        echo "<h2>❌ Environment Variables Not Found</h2>";
        echo "<p><strong>Missing variables:</strong></p>";
        echo "<ul>";
        if (!$username) echo "<li>TARNEEB_ADMIN_USERNAME</li>";
        if (!$passwordHash) echo "<li>TARNEEB_ADMIN_PASSWORD_HASH</li>";
        echo "</ul>";
        echo "</div>";
        
        echo "<div class='info'>";
        echo "<h3>🔧 How to Fix This</h3>";
        echo "<p>You need to set up environment variables. Choose one of these methods:</p>";
        
        echo "<h4>Method 1: cPanel Environment Variables</h4>";
        echo "<ol>";
        echo "<li>Go to your cPanel dashboard</li>";
        echo "<li>Find 'Environment Variables' section</li>";
        echo "<li>Add these two variables:</li>";
        echo "</ol>";
        echo "<pre>";
        echo "TARNEEB_ADMIN_USERNAME=your_username\n";
        echo "TARNEEB_ADMIN_PASSWORD_HASH=your_hashed_password";
        echo "</pre>";
        
        echo "<h4>Method 2: .bashrc File</h4>";
        echo "<ol>";
        echo "<li>Edit your ~/.bashrc file</li>";
        echo "<li>Add these lines:</li>";
        echo "</ol>";
        echo "<pre>";
        echo "export TARNEEB_ADMIN_USERNAME=\"your_username\"\n";
        echo "export TARNEEB_ADMIN_PASSWORD_HASH=\"your_hashed_password\"";
        echo "</pre>";
        echo "<p>Then run: <code>source ~/.bashrc</code></p>";
        
        echo "<h4>Generate Password Hash</h4>";
        echo "<p>Use this command to generate a secure password hash:</p>";
        echo "<pre>php -r \"echo password_hash('your_password', PASSWORD_DEFAULT);\"</pre>";
        
        echo "<p><strong>Quick Setup:</strong> <a href='setup.php'>Use the setup script</a></p>";
        echo "</div>";
    }
    ?>
    
    <div class='info'>
        <h3>🔍 Debug Information</h3>
        <p><strong>PHP Version:</strong> <?php echo PHP_VERSION; ?></p>
        <p><strong>Server:</strong> <?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'; ?></p>
        <p><strong>Document Root:</strong> <?php echo $_SERVER['DOCUMENT_ROOT']; ?></p>
        <p><strong>Current Directory:</strong> <?php echo getcwd(); ?></p>
    </div>
    
    <p><a href="debug.php">← Back to Debug Script</a> | <a href="index.php">Go to Tarneeb Tracker</a></p>
</body>
</html>
