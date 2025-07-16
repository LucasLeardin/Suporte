<?php
header('Content-Type: application/json');
require_once 'db.php';

try {
    $stmt = $pdo->query('SELECT NOW() as now');
    $row = $stmt->fetch();
    echo json_encode(['success' => true, 'now' => $row['now']]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
