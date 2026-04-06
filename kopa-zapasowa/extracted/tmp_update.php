<?php
$db = new PDO('sqlite:php_api/database.sqlite');
$db->exec("UPDATE users SET is_admin = 1 WHERE email IN ('manager@webisko.pl', 'doula.otula.np@gmail.com')");
echo "Local DB updated.";
