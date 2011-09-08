<?php

define('VIDEO_DURATION',282);

require_once('../db.php');

header('Content-type: text/plain');


/*
	some basic spambot-fighting measures
	see: http://codex.wordpress.org/Combating_Comment_Spam/Denying_Access

	Some of these might be better implemented in .htaccess. Faster, anyway. If server load gets heavy, definitely move these checks out of PHP.
*/

//require cookie to make sure index.php has loaded
//make sure they're using a web browser or at least faked it
//

if (!isset($_COOKIE['euid']) ||
	!isset($_SERVER['HTTP_USER_AGENT'])
	) {
	header("HTTP/1.0 404 Not Found");
    exit();
}

//IP Address blacklist
$ip_block = array();
if (in_array ($_SERVER['REMOTE_ADDR'], $ip_block)) {
    header("Location: http://google.com/");
    exit();
}

$language = trim($_POST['language']);
if ($language != 'en' && $language != 'de') {
	echo '{"success":false,"message":"Unsupported language","field":"language"}';
	exit;
}

//validate contents of comment
$comment = stripcslashes(trim($_POST['comment']));
if (!$comment) {
	echo '{"success":false,"message":"Missing comment text","field":"comment"}';
	exit;
}

if (strlen($comment) > 200) {
	echo '{"success":false,"message":"Comment is too long","field":"comment"}';
	exit;
}

$name = stripcslashes(trim($_POST['name']));
if (!$name) {
	echo '{"success":false,"message":"Missing name","field":"name"}';
	exit;
}

$time = stripcslashes(trim($_POST['time']));
if (!$time) {
	echo '{"success":false,"message":"Missing video time","field":"time"}';
	exit;
}
if (!is_numeric($time)) {
	echo '{"success":false,"message":"Malformed time","field":"time"}';
	exit;
}
$time = floatval($time);
if ($time < 0 || $time > VIDEO_DURATION) {
	echo '{"success":false,"message":"Malformed time","field":"time"}';
	exit;
}

//http://www.regular-expressions.info/email.html
$email_regex = '/^[a-z0-9!#$%&\'*+\/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&\'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+(?:[A-Z]{2}|aero|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|xxx)$/i';

$email = stripcslashes(trim($_POST['email']));
if ($email && !preg_match($email_regex, $email, $matches)) {
	echo '{"success":false,"message":"Malformed email address","field":"email"}';
	exit;
}

//todo: parse URLs. check referrer

function clean_db($string, $force_string = false) {
	$string = trim($string);
	if ($string == '' || $string == null) {
		$string = 'null';
	} else if (!is_numeric($string) || $force_string) {
		$string = "'" . mysql_real_escape_string($string) . "'";
	}
	return $string;
}

$cookie_id = $_COOKIE['euid'];

$cookie_id_clean = clean_db($cookie_id);
$email_clean = clean_db($email);
$comment_clean = clean_db($comment);
$name_clean = clean_db($name);
$time_clean = clean_db($time);
$language_clean = clean_db($language);

/*
	check against existing data
	- must already have a cookie
	- must have loaded the page at least 10 seconds ago, since it should
	  take at least that long to compose a comment
	- must be at least 10 seconds since posting last comment
*/

$sql = "SELECT cookies.cookie_id, NOW() - MAX(timestamp) as latest_comment
	FROM cookies
	LEFT JOIN comments on cookies.cookie_id = comments.cookie_id
	WHERE cookies.cookie_id = $cookie_id_clean
		AND NOW() - create_time > 10
		AND NOW() - load_time > 10
	GROUP BY cookie_id";
//echo "$sql\n";
$result = mysql_query($sql);
if (!$result || (!$row = mysql_fetch_object($result))) {
	echo '{"success":false,"message":"Denied"}';
	exit;
}

if ($row->latest_comment) {
	if ($row->latest_comment < 10) {
		echo '{"success":false,"message":"Please Wait"}';
		exit;
	}
	
	/*
	a couple more checks
	- make sure user hasn't been admin-flagged more than once
	- no duplicates
	- no more than 2 comments from the same person in a 5-second spot in the film
	*/	
	$sql = "SELECT SQL_CALC_FOUND_ROWS comments.comment_id,
		SUM(IF(comments.admin_flag < 0, 1, 0)) AS admin_flags,
		SUM(IF(ABS(video_time - $time_clean) < 5, 1, 0)) as time_diff
	FROM comments
	LEFT JOIN flag ON flag.comment_id
	WHERE (cookie_id = $cookie_id_clean";
	
	if ($email) {
		$sql .= " OR email = $email_clean AND $email_clean IS NOT NULL";
	}
	$sql .= ")
	GROUP BY comments.comment_id
	HAVING COUNT(flag.cookie_id) >= 3
		OR admin_flags > 1
		OR time_diff > 2";
//echo "$sql\n";
	$result = mysql_query($sql);
	if ($result && mysql_num_rows($result) > 1) {
		echo '{"success":false,"message":"Denied"}';
		exit;
	}

	//todo: posted the same link too many times

	$sql = "SELECT SQL_CALC_FOUND_ROWS comment_id
	FROM comments
	LEFT JOIN flag ON flag.comment_id
	WHERE (cookie_id = $cookie_id_clean OR email = $email_clean AND $email_clean IS NOT NULL)
		AND comment LIKE $comment_clean";
//echo "$sql\n";
	$result = mysql_query($sql);
	if ($result && mysql_num_rows($result)) {
		echo '{"success":false,"message":"Duplicate messages","field":"comment"}';
		exit;
	}
}

//everything checks out, so let's save it
$sql = "INSERT INTO comments
	(cookie_id, timestamp, video_time, language, email, name, comment)
	VALUES
	($cookie_id_clean, NOW(), $time_clean, $language_clean, $email_clean, $name_clean, $comment_clean)";
//echo "$sql\n";
mysql_query($sql);
$comment_id = mysql_insert_id();

$output = new stdClass;
$output->success = true;
$output->data = array(
	$comment_id,
	time(),
	$time,
	$language,
	$name,
	$comment
);

echo json_encode($output);