<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// --- Database Configuration (Change these with your Hostinger MySQL info) ---
$host = 'localhost';
$db   = 'u123456789_jb_healthcare';
$user = 'u123456789_admin';
$pass = 'your_mysql_password_here';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_GET['path']) ? $_GET['path'] : '';

// --- Simple API Router ---
switch ($path) {
    case 'doctors':
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM doctors");
            echo json_encode($stmt->fetchAll());
        }
        break;
        
    case 'orders':
        if ($method === 'POST') {
            $d = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("INSERT INTO orders (user_id, user_email, item_name, amount, shipping, payment_method, payment_type, sender_name, sender_contact, trx_id, hospital_name, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                isset($d['user_id']) ? $d['user_id'] : 'guest',
                isset($d['user_email']) ? $d['user_email'] : '',
                isset($d['item_name']) ? $d['item_name'] : '',
                isset($d['amount']) ? $d['amount'] : 0,
                isset($d['shipping']) ? $d['shipping'] : 0,
                isset($d['payment_method']) ? $d['payment_method'] : '',
                isset($d['payment_type']) ? $d['payment_type'] : 'online',
                isset($d['sender_name']) ? $d['sender_name'] : '',
                isset($d['sender_contact']) ? $d['sender_contact'] : '',
                isset($d['trx_id']) ? $d['trx_id'] : '',
                isset($d['hospital_name']) ? $d['hospital_name'] : '',
                isset($d['status']) ? $d['status'] : 'pending'
            ]);
            echo json_encode(['status' => 'success']);
        } else if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM orders ORDER BY id DESC");
            echo json_encode($stmt->fetchAll());
        }
        break;

    default:
        echo json_encode(['status' => 'online', 'message' => 'JB Healthcare API is running on Hostinger']);
        break;
}
?>
