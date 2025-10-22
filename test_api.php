<?php
// Simple test script to debug API issues
echo "<h1>Tarneeb API Test</h1>";

// Test 1: Check if directories exist and are writable
echo "<h2>Directory Tests</h2>";

$dataDir = 'assets/data/';
$photosDir = 'assets/photos/';

echo "<p>Data directory: " . $dataDir;
if (is_dir($dataDir)) {
    echo " ✓ EXISTS";
    if (is_writable($dataDir)) {
        echo " ✓ WRITABLE";
    } else {
        echo " ✗ NOT WRITABLE";
    }
} else {
    echo " ✗ DOES NOT EXIST";
    if (mkdir($dataDir, 0755, true)) {
        echo " ✓ CREATED";
    } else {
        echo " ✗ FAILED TO CREATE";
    }
}
echo "</p>";

echo "<p>Photos directory: " . $photosDir;
if (is_dir($photosDir)) {
    echo " ✓ EXISTS";
    if (is_writable($photosDir)) {
        echo " ✓ WRITABLE";
    } else {
        echo " ✗ NOT WRITABLE";
    }
} else {
    echo " ✗ DOES NOT EXIST";
    if (mkdir($photosDir, 0755, true)) {
        echo " ✓ CREATED";
    } else {
        echo " ✗ FAILED TO CREATE";
    }
}
echo "</p>";

// Test 2: Check if we can write to the data file
echo "<h2>File Write Test</h2>";
$dataFile = $dataDir . 'games.json';
$testData = ['games' => [], 'lastUpdated' => date('c'), 'version' => '1.0'];

if (file_put_contents($dataFile, json_encode($testData, JSON_PRETTY_PRINT))) {
    echo "<p>✓ Successfully wrote to data file</p>";
} else {
    echo "<p>✗ Failed to write to data file</p>";
}

// Test 3: Check if we can read the data file
echo "<h2>File Read Test</h2>";
if (file_exists($dataFile)) {
    $content = file_get_contents($dataFile);
    $data = json_decode($content, true);
    if ($data) {
        echo "<p>✓ Successfully read data file</p>";
        echo "<pre>" . json_encode($data, JSON_PRETTY_PRINT) . "</pre>";
    } else {
        echo "<p>✗ Failed to decode JSON from data file</p>";
    }
} else {
    echo "<p>✗ Data file does not exist</p>";
}

// Test 4: Check PHP version and extensions
echo "<h2>PHP Environment</h2>";
echo "<p>PHP Version: " . phpversion() . "</p>";
echo "<p>JSON extension: " . (extension_loaded('json') ? '✓' : '✗') . "</p>";
echo "<p>File uploads enabled: " . (ini_get('file_uploads') ? '✓' : '✗') . "</p>";
echo "<p>Max file size: " . ini_get('upload_max_filesize') . "</p>";
echo "<p>Max post size: " . ini_get('post_max_size') . "</p>";

// Test 5: Check current working directory
echo "<h2>Current Directory</h2>";
echo "<p>Current working directory: " . getcwd() . "</p>";
echo "<p>Script location: " . __FILE__ . "</p>";

// Test 6: List files in assets directory
echo "<h2>Assets Directory Contents</h2>";
if (is_dir('assets')) {
    $files = scandir('assets');
    echo "<ul>";
    foreach ($files as $file) {
        if ($file != '.' && $file != '..') {
            echo "<li>" . $file . "</li>";
        }
    }
    echo "</ul>";
} else {
    echo "<p>Assets directory does not exist</p>";
}
?>
