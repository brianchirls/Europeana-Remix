<?php

//from http://jquery-howto.blogspot.com/2009/04/cross-domain-ajax-querying-with-jquery.html

include_once('../settings.php');

if ($_GET['id'] && preg_match('/[0-9A-Za-z]+\/[0-9A-Za-z]+/', $_GET['id'])) {
	// Website url to open
	$daurl = 'http://www.europeana.eu/portal/record/' . $_GET['id'] .  '.srw?wskey=' . EUROPEANA_API_KEY;	
} else {
	die;
}

$file_cache_name = 'data/' . str_replace('/', '-', $_GET['id']) . '.xml';

//europeana queries should last 30 days
$expires = 60*60*24*30;

if (file_exists($file_cache_name) &&
	filemtime($file_cache_name) > time() - $expires) {
	
	//read file from cache
	@$handle = fopen($file_cache_name, "r");
	
	// If there is something, read and return
	if ($handle) {
		// Set your return content type
		header('Content-type: text/xml');
		header('Expires: ' . gmdate('D, d M Y H:i:s', time()+$expires) . ' GMT');
		
		while (!feof($handle)) {
			$buffer = fgets($handle, 4096);
			echo $buffer;
		}
		fclose($handle);
	} else {
		header("HTTP/1.0 404 Not Found");
	}
} else {
	// Get that website's content
	@$handle = fopen($daurl, "r");
	
	// If there is something, read and return
	if ($handle && !feof($handle)) {
		@$cache_handle = fopen($file_cache_name, "w");

		// Set your return content type
		header('Content-type: text/xml');
		header('Expires: ' . gmdate('D, d M Y H:i:s', time()+$expires) . ' GMT');
		
		while (!feof($handle)) {
			$buffer = fgets($handle, 4096);
			fputs($cache_handle, $buffer);
			echo $buffer;
		}
		fclose($handle);
		fclose($cache_handle);
	} else {
		header("HTTP/1.0 404 Not Found");
	}
}
?>