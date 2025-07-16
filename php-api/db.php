<?php
// Arquivo de conexão com MySQL
$host = '192.185.211.76';
$user = 'luca5398_mbrhelper';
$pass = 'QG~?0%t}DMqn';
$db   = 'luca5398_mbrhelper';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro na conexão: ' . $e->getMessage()]);
    exit;
}
?>
