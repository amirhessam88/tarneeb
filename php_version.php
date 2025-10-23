<?php
echo "PHP Version: " . PHP_VERSION . "\n";
echo "PHP Major Version: " . PHP_MAJOR_VERSION . "\n";
echo "PHP Minor Version: " . PHP_MINOR_VERSION . "\n";

if (version_compare(PHP_VERSION, '7.0.0', '>=')) {
    echo "✅ Null coalescing operator (??) is supported\n";
} else {
    echo "❌ Null coalescing operator (??) is NOT supported - need PHP 7.0+\n";
}

if (version_compare(PHP_VERSION, '5.6.0', '>=')) {
    echo "✅ password_hash() function is supported\n";
} else {
    echo "❌ password_hash() function is NOT supported - need PHP 5.6+\n";
}

echo "\nServer Information:\n";
echo "Server Software: " . (isset($_SERVER['SERVER_SOFTWARE']) ? $_SERVER['SERVER_SOFTWARE'] : 'Unknown') . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Current Directory: " . getcwd() . "\n";
?>
