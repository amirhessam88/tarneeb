<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check PHP version
if (version_compare(PHP_VERSION, '5.6.0', '<')) {
    die(json_encode(['error' => 'PHP 5.6 or higher required. Current version: ' . PHP_VERSION]));
}

// Start session for authentication
session_start();

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

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

// Load secure configuration
require_once 'config/secure_config.php';

// Log errors to a file for debugging
$logFile = 'assets/debug.log';

// Rate limiting for login attempts
$rateLimitFile = 'assets/rate_limit.json';
$maxAttempts = 5;
$lockoutTime = 300; // 5 minutes
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
            if (json_last_error() == 0) {
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

// Authentication functions
function loadConfig() {
    global $logFile;
    try {
        $secureConfig = SecureConfig::getInstance();
        return $secureConfig;
    } catch (Exception $e) {
        logError("Error loading secure config: " . $e->getMessage());
        return null;
    }
}

function checkRateLimit($ip) {
    global $rateLimitFile, $maxAttempts, $lockoutTime, $logFile;
    
    if (!file_exists($rateLimitFile)) {
        return true;
    }
    
    $rateLimitData = json_decode(file_get_contents($rateLimitFile), true);
    if (!$rateLimitData) {
        return true;
    }
    
    $currentTime = time();
    
    // Clean old entries
    foreach ($rateLimitData as $key => $entry) {
        if ($currentTime - $entry['lastAttempt'] > $lockoutTime) {
            unset($rateLimitData[$key]);
        }
    }
    
    // Check if IP is locked out
    if (isset($rateLimitData[$ip])) {
        $entry = $rateLimitData[$ip];
        if ($entry['attempts'] >= $maxAttempts && ($currentTime - $entry['lastAttempt']) < $lockoutTime) {
            logError("Rate limit exceeded for IP: $ip");
            return false;
        }
    }
    
    return true;
}

function recordLoginAttempt($ip, $success) {
    global $rateLimitFile, $maxAttempts, $logFile;
    
    $rateLimitData = [];
    if (file_exists($rateLimitFile)) {
        $rateLimitData = json_decode(file_get_contents($rateLimitFile), true) ?: [];
    }
    
    $currentTime = time();
    
    if (!isset($rateLimitData[$ip])) {
        $rateLimitData[$ip] = ['attempts' => 0, 'lastAttempt' => $currentTime];
    }
    
    if ($success) {
        // Reset on successful login
        unset($rateLimitData[$ip]);
    } else {
        // Increment failed attempts
        $rateLimitData[$ip]['attempts']++;
        $rateLimitData[$ip]['lastAttempt'] = $currentTime;
    }
    
    file_put_contents($rateLimitFile, json_encode($rateLimitData));
}

function authenticateUser($username, $password) {
    global $logFile;
    
    $secureConfig = loadConfig();
    if (!$secureConfig) {
        logError("Secure config not found");
        return false;
    }
    
    $admin = $secureConfig->getAdminCredentials();
    if (!$admin['username'] || !$admin['password_hash']) {
        logError("Admin credentials not found in secure config");
        return false;
    }
    
    // Check username
    if ($username !== $admin['username']) {
        logError("Authentication failed for user: $username");
        return false;
    }
    
    // Verify password hash
    if (!password_verify($password, $admin['password_hash'])) {
        logError("Authentication failed for user: $username");
        return false;
    }
    
    logError("Authentication successful for user: $username");
    return true;
}

function isAuthenticated() {
    return isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true;
}

function requireAuth() {
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }
}

function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function validateCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($method) {
    case 'GET':
        if ($action === 'games') {
            echo json_encode(loadGames());
        } elseif ($action === 'auth-status') {
            echo json_encode(['authenticated' => isAuthenticated()]);
        } elseif ($action === 'csrf-token') {
            echo json_encode(['csrf_token' => generateCSRFToken()]);
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
        if ($action === 'login') {
            try {
                $input = json_decode(file_get_contents('php://input'), true);
                if (json_last_error() != 0) {
                    logError("Invalid JSON input: " . json_last_error_msg());
                    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
                    break;
                }
                
                $username = $input['username'] ?? '';
                $password = $input['password'] ?? '';
                $csrfToken = $input['csrf_token'] ?? '';
                
                // Validate CSRF token
                if (!validateCSRFToken($csrfToken)) {
                    logError("Invalid CSRF token");
                    echo json_encode(['success' => false, 'message' => 'Invalid request']);
                    break;
                }
                
                // Check rate limiting
                $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
                if (!checkRateLimit($ip)) {
                    echo json_encode(['success' => false, 'message' => 'Too many login attempts. Please try again later.']);
                    break;
                }
                
                // Authenticate user
                if (authenticateUser($username, $password)) {
                    $_SESSION['authenticated'] = true;
                    $_SESSION['username'] = $username;
                    $_SESSION['login_time'] = time();
                    recordLoginAttempt($ip, true);
                    echo json_encode(['success' => true, 'message' => 'Login successful']);
                } else {
                    recordLoginAttempt($ip, false);
                    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
                }
            } catch (Exception $e) {
                logError("Error in login action: " . $e->getMessage());
                echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
            }
        } elseif ($action === 'logout') {
            session_destroy();
            echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
        } elseif ($action === 'save') {
            requireAuth();
            try {
                $input = json_decode(file_get_contents('php://input'), true);
                if (json_last_error() != 0) {
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
            requireAuth();
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
