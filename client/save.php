<?php

require_once('../db.php');

//Look for cookies for language settings and comments
if (isset($_COOKIE['euid'])) {
	$cookie_id = $_COOKIE['euid'];

	if ($_REQUEST['language'] == 'en' || $_REQUEST['language'] == 'de') {
		$sql = "UPDATE cookies SET language = '" . mysql_escape_string($_REQUEST['language']) . "'
			WHERE cookie_id = '" . mysql_escape_string($cookie_id) . "'";
		mysql_query($sql);
		echo "ok, saved language: {$_REQUEST['language']}\n";
	}
}