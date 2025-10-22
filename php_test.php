<?php
// Simple PHP compatibility test
echo "<h1>PHP Compatibility Test</h1>";
echo "<p>PHP Version: " . phpversion() . "</p>";

// Test the syntax that was causing issues
$test = isset($_GET['test']) ? $_GET['test'] : 'default';
echo "<p>Null coalescing test: " . $test . "</p>";

// Test JSON functions
$testData = ['test' => 'value'];
$json = json_encode($testData);
echo "<p>JSON encode test: " . $json . "</p>";

$decoded = json_decode($json, true);
echo "<p>JSON decode test: " . print_r($decoded, true) . "</p>";

// Test file operations
$testFile = 'test.txt';
file_put_contents($testFile, 'test content');
if (file_exists($testFile)) {
    echo "<p>File operations: Working</p>";
    unlink($testFile);
} else {
    echo "<p>File operations: Failed</p>";
}

echo "<p>All tests completed successfully!</p>";
?>
