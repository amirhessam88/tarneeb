<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$dataFile = 'assets/data/games.json';
$photosDir = 'assets/photos/';

// Ensure photos directory exists
if (!is_dir($photosDir)) {
    mkdir($photosDir, 0755, true);
}

function loadGames() {
    global $dataFile;
    if (file_exists($dataFile)) {
        $content = file_get_contents($dataFile);
        return json_decode($content, true);
    }
    return ['games' => [], 'lastUpdated' => null, 'version' => '1.0'];
}

function saveGames($data) {
    global $dataFile;
    $data['lastUpdated'] = date('c');
    return file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT));
}

function savePhoto($file, $filename) {
    global $photosDir;
    $targetPath = $photosDir . $filename;
    return move_uploaded_file($file['tmp_name'], $targetPath);
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'games') {
            echo json_encode(loadGames());
        } else {
            echo json_encode(['error' => 'Invalid action']);
        }
        break;
        
    case 'POST':
        if ($action === 'save') {
            $input = json_decode(file_get_contents('php://input'), true);
            $data = loadGames();
            $data['games'] = $input['games'];
            if (saveGames($data)) {
                echo json_encode(['success' => true, 'message' => 'Games saved successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to save games']);
            }
        } elseif ($action === 'upload') {
            if (isset($_FILES['photo'])) {
                $filename = uniqid() . '_' . time() . '.jpg';
                if (savePhoto($_FILES['photo'], $filename)) {
                    echo json_encode(['success' => true, 'filename' => $filename, 'url' => 'photos/' . $filename]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to upload photo']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'No photo uploaded']);
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
