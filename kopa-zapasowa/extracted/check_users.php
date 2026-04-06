<?php
$db = new PDO('sqlite:data/database.sqlite');
$stmt = $db->query('SELECT id, email, is_admin FROM users');
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($users, JSON_PRETTY_PRINT);
