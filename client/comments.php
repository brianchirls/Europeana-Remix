<?php

require_once('../db.php');

function updateHide() {
	$sql = "UPDATE comments
		INNER JOIN (
			SELECT comments.comment_id, comments.admin_flag, count(flag.cookie_id) as numflags 
			FROM comments
				LEFT JOIN flag ON comments.comment_id = flag.comment_id
			GROUP BY comments.comment_id
		) as c ON c.comment_id = comments.comment_id
	SET hide = c.admin_flag < 0 OR (c.admin_flag = 0 AND c.numflags >= 3)";
	mysql_query($sql);
}

if (isset($_COOKIE['euid'])) {
	$cookie_id = $_COOKIE['euid'];
	
	if (isset($_GET['flag']) && $_GET['flag']) {
		if (is_numeric($_GET['flag'])) {
			$sql = "REPLACE INTO flag (comment_id, cookie_id, timestamp)
				VALUES (" . mysql_escape_string($_GET['flag']) . ", '" . 
				mysql_escape_string($cookie_id) . "', NOW() )";
			echo "$sql\n";
			mysql_query($sql);
			echo "[null]";
			updateHide();
			exit;
		}
	} else if (isset($_GET['unflag']) && $_GET['unflag']) {
		if (is_numeric($_GET['unflag'])) {
			$sql = "DELETE FROM flag WHERE
				comment_id = " . mysql_escape_string($_GET['unflag']) . 
				" AND cookie_id = '" . mysql_escape_string($cookie_id) . "'";
			mysql_query($sql);
			echo "$sql\n";
			echo "[null]";
			updateHide();
			exit;
		}
	}
}

$sql = "SELECT DISTINCT comments.comment_id, UNIX_TIMESTAMP(comments.timestamp) as timestamp, comments.video_time, comments.language, comments.name, comments.comment, comments.admin_flag #, COUNT(flag.timestamp)\n";

/*
if (isset($cookie_id)) {
	$sql .= ", (SELECT COUNT(*) FROM flag as f
	 	WHERE f.comment_id = comments.comment_id
	 		AND f.cookie_id = '" . mysql_escape_string($cookie_id) . "'
		) AS flaggedByMe\n";
}
*/

$sql .="FROM comments
	#LEFT JOIN flag ON comments.comment_id = flag.comment_id
	#LEFT JOIN cookies ON flag.cookie_id = cookies.cookie_id
	WHERE comments.admin_flag >= 0 AND comments.hide = 0\n";

if (isset($_REQUEST['language']) && $_REQUEST['language']) {
	$sql .= " AND comments.language = '" . mysql_escape_string($_REQUEST['language']) . "'\n";
}

if (isset($_REQUEST['since']) && is_numeric($_REQUEST['since'])) {
	$since = intval($_REQUEST['since']);
	$sql .= " AND comments.timestamp >= FROM_UNIXTIME($since)\n";
}

if (isset($_REQUEST['vtime']) && is_numeric($_REQUEST['vtime'])) {
	$sql .= " AND comments.video_time >= '" . mysql_escape_string($_REQUEST['vtime']) . "'\n";
}

if (isset($cookie_id)) {
	$sql .= "AND NOT EXISTS (SELECT timestamp FROM flag
	 	WHERE flag.comment_id = comments.comment_id
	 		AND flag.cookie_id = '" . mysql_escape_string($cookie_id) . "'
		)\n";
}

/*
$sql .= "GROUP BY comments.comment_id, comments.timestamp, comments.video_time, comments.language, comments.name, comments.comment
	HAVING (COUNT(flag.timestamp) < 3 OR admin_flag <= 0)\n";

if (isset($cookie_id)) {
	$sql .= " AND flaggedByMe < 1\n";
}
*/
$sql .= "ORDER BY comments.comment_id DESC
	LIMIT 0, 200";

//echo "$sql\n";
echo "[";

$result = mysql_query($sql);
if ($result) while ($row = mysql_fetch_assoc($result)) {
	$out = array();
	unset($row['admin_flag']);
	foreach ($row as $key => $val) {
		if (is_numeric($val)) {
			array_push($out, $val + 0);
		} else {
			array_push($out, $val);
		}
	}
	echo json_encode($out) . ",";
	flush();
}
echo "null]";
