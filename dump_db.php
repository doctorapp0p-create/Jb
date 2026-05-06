<?php
$host = 'localhost';
$db   = 'app_db'; // Replaced placeholder with likely DB name from context if available, or just common one
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

// Try to find DB config in api.php
$api_content = file_get_contents('api.php');
if (preg_match('/dbname=([^;]+)/', $api_content, $m)) $db = $m[1];

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
     $stmt = $pdo->query("SELECT * FROM doctors");
     $doctors = $stmt->fetchAll();
     echo json_encode($doctors, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (\PDOException $e) {
     echo "Error: " . $e->getMessage();
}
?>
