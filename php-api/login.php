<?php
header('Content-Type: application/json');
require_once 'db.php';


// Recebe dados do POST (JSON ou formulário)
if ($_SERVER['CONTENT_TYPE'] === 'application/json' || strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
} else {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
}

if (!$username || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Usuário e senha são obrigatórios']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT id, username, password, role FROM users WHERE username = ? LIMIT 1');
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    if ($user && $user['password'] === $password) { // Troque por password_verify se usar hash
        echo json_encode([
            'token' => 'valid-token-123', // Implemente JWT se quiser mais segurança
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'role' => $user['role']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Credenciais inválidas']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>