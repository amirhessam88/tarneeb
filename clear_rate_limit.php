<?php
/**
 * Clear Rate Limiting Script
 * 
 * This script clears the rate limiting data to allow login attempts
 */

// Clear rate limiting file
$rateLimitFile = 'assets/rate_limit.json';
if (file_exists($rateLimitFile)) {
    unlink($rateLimitFile);
    echo "✅ Rate limiting cleared successfully!\n";
} else {
    echo "ℹ️ No rate limiting file found.\n";
}

// Also clear any session data
session_start();
session_destroy();

echo "✅ Session cleared!\n";
echo "You can now try logging in again.\n";
?>
