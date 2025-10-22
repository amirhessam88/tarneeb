<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Disable browser caching
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$dataFile = 'assets/data/games.json';
$photosDir = 'assets/photos/';

// Log errors to a file for debugging
$logFile = 'assets/debug.log';
function logError($message) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND);
}

// Ensure photos directory exists
if (!is_dir($photosDir)) {
    mkdir($photosDir, 0755, true);
}

function loadGames() {
    global $dataFile, $logFile;
    try {
        if (file_exists($dataFile)) {
            $content = file_get_contents($dataFile);
            $data = json_decode($content, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $data;
            } else {
                logError("JSON decode error: " . json_last_error_msg());
                return ['games' => [], 'lastUpdated' => null, 'version' => '1.0'];
            }
        } else {
            logError("Data file does not exist: $dataFile");
            return ['games' => [], 'lastUpdated' => null, 'version' => '1.0'];
        }
    } catch (Exception $e) {
        logError("Error loading games: " . $e->getMessage());
        return ['games' => [], 'lastUpdated' => null, 'version' => '1.0'];
    }
}

function saveGames($data) {
    global $dataFile, $logFile;
    try {
        // Ensure directory exists
        $dir = dirname($dataFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        $data['lastUpdated'] = date('c');
        $json = json_encode($data, JSON_PRETTY_PRINT);
        
        if ($json === false) {
            logError("JSON encode error: " . json_last_error_msg());
            return false;
        }
        
        $result = file_put_contents($dataFile, $json);
        if ($result === false) {
            logError("Failed to write to data file: $dataFile");
            return false;
        }
        
        logError("Successfully saved " . count($data['games']) . " games");
        return true;
    } catch (Exception $e) {
        logError("Error saving games: " . $e->getMessage());
        return false;
    }
}

function savePhoto($file, $filename) {
    global $photosDir, $logFile;
    try {
        // Ensure photos directory exists
        if (!is_dir($photosDir)) {
            mkdir($photosDir, 0755, true);
        }
        
        $targetPath = $photosDir . $filename;
        
        // Check if file was uploaded successfully
        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            logError("Invalid file upload: " . print_r($file, true));
            return false;
        }
        
        $result = move_uploaded_file($file['tmp_name'], $targetPath);
        if ($result) {
            logError("Successfully uploaded photo: $filename");
            return true;
        } else {
            logError("Failed to move uploaded file to: $targetPath");
            return false;
        }
    } catch (Exception $e) {
        logError("Error saving photo: " . $e->getMessage());
        return false;
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($method) {
    case 'GET':
        if ($action === 'games') {
            echo json_encode(loadGames());
        } elseif ($action === 'debug') {
            // Debug endpoint
            echo json_encode([
                'status' => 'API is working',
                'timestamp' => date('Y-m-d H:i:s'),
                'data_file_exists' => file_exists($dataFile),
                'data_file_readable' => is_readable($dataFile),
                'photos_dir_exists' => is_dir($photosDir),
                'photos_dir_writable' => is_writable($photosDir),
                'current_dir' => getcwd(),
                'data_file_path' => $dataFile,
                'data_file_size' => file_exists($dataFile) ? filesize($dataFile) : 0
            ]);
        } else {
            echo json_encode(['error' => 'Invalid action']);
        }
        break;
        
    case 'POST':
        if ($action === 'save') {
            try {
                $input = json_decode(file_get_contents('php://input'), true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    logError("Invalid JSON input: " . json_last_error_msg());
                    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
                    break;
                }
                
                $data = loadGames();
                $data['games'] = $input['games'];
                
                if (saveGames($data)) {
                    echo json_encode(['success' => true, 'message' => 'Games saved successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to save games']);
                }
            } catch (Exception $e) {
                logError("Error in save action: " . $e->getMessage());
                echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
            }
        } elseif ($action === 'upload') {
            try {
                if (isset($_FILES['photo'])) {
                    $filename = uniqid() . '_' . time() . '.jpg';
                    if (savePhoto($_FILES['photo'], $filename)) {
                        echo json_encode(['success' => true, 'filename' => $filename, 'url' => 'assets/photos/' . $filename]);
                    } else {
                        echo json_encode(['success' => false, 'message' => 'Failed to upload photo']);
                    }
                } else {
                    logError("No photo file in upload request");
                    echo json_encode(['success' => false, 'message' => 'No photo uploaded']);
                }
            } catch (Exception $e) {
                logError("Error in upload action: " . $e->getMessage());
                echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['error' => 'Invalid action']);
        }
        break;
        
    default:
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>
