<?php
/**
 * Quick Setup Script for Tarneeb Score Tracker
 */

// Security check
$allowedIPs = ['127.0.0.1', '::1'];
if (!in_array($_SERVER['REMOTE_ADDR'], $allowedIPs) && !isset($_GET['force'])) {
    die('Access denied. Add ?force to URL if you need to run this remotely.');
}

if ($_POST) {
    $username = isset($_POST['username']) ? $_POST['username'] : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    echo "<!DOCTYPE html><html><head><title>Setup Complete</title></head><body>";
    echo "<h1>✅ Setup Complete</h1>";
    echo "<h2>Environment Variables to Set:</h2>";
    echo "<h3>For cPanel Environment Variables:</h3>";
    echo "<pre>";
    echo "TARNEEB_ADMIN_USERNAME=" . htmlspecialchars($username) . "\n";
    echo "TARNEEB_ADMIN_PASSWORD_HASH=" . htmlspecialchars($passwordHash);
    echo "</pre>";
    
    echo "<h3>For .bashrc file:</h3>";
    echo "<pre>";
    echo "export TARNEEB_ADMIN_USERNAME=\"" . htmlspecialchars($username) . "\"\n";
    echo "export TARNEEB_ADMIN_PASSWORD_HASH=\"" . htmlspecialchars($passwordHash) . "\"";
    echo "</pre>";
    
    echo "<h3>Next Steps:</h3>";
    echo "<ol>";
    echo "<li>Set the environment variables in your cPanel or .bashrc</li>";
    echo "<li>Test your site: <a href='index.php'>Visit Tarneeb Tracker</a></li>";
    echo "<li>Test login with username: " . htmlspecialchars($username) . " and your password</li>";
    echo "<li>Delete this setup script after testing</li>";
    echo "</ol>";
    
    echo "<p><strong>Note:</strong> The site will NOT work until you set the environment variables properly.</p>";
    echo "<p><a href='debug.php'>Run Debug Script</a> | <a href='index.php'>Go to Site</a></p>";
    echo "</body></html>";
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tarneeb Setup</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .form-group { margin: 15px 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input[type="text"], input[type="password"] { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        .btn:hover { background: #0056b3; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>🔧 Tarneeb Quick Setup</h1>
    
    <div class="info">
        <h3>📋 What This Does</h3>
        <p>This will generate secure credentials and show you how to set up environment variables for your cPanel hosting.</p>
    </div>
    
    <div class="warning">
        <h3>⚠️ Important</h3>
        <p>The site will NOT work until you set up the environment variables properly. No fallback credentials are provided for security.</p>
    </div>
    
    <form method="post">
        <div class="form-group">
            <label for="username">Admin Username:</label>
            <input type="text" id="username" name="username" value="admin" required>
        </div>
        
        <div class="form-group">
            <label for="password">Admin Password:</label>
            <input type="password" id="password" name="password" required>
        </div>
        
        <button type="submit" class="btn">Generate Setup Instructions</button>
    </form>
    
    <div class="info">
        <h3>🔍 Troubleshooting</h3>
        <p>If the site isn't working, run the <a href="debug.php">debug script</a> to see what's wrong.</p>
    </div>
</body>
</html>
