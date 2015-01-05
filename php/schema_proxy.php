<?php

define('SCHEMA_URL', 'http://localhost:11006');

$session = curl_init(SCHEMA_URL.'/?'.$_SERVER['QUERY_STRING']);
curl_setopt($session, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($session);
curl_close($session);

header('Cache-Control: no-cache, must-revalidate');
header('Expires: Mon, 26 Jul 2997 05:00:00 GMT');
header('Content-type:application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

echo $response;
exit();
?>
