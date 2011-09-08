<?php

require_once("settings.php");

$server = DB_HOST . ( DB_PORT ? ':' . DB_PORT : '');
$eu_db = mysql_connect($server, DB_USER, DB_PASSWORD);

if (!$eu_db) {
	die("huge database connection error\n");
}

mysql_select_db(DB_NAME, $eu_db);

?>