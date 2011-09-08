<?php
	require_once("../../models/config.php");
	
	//Prevent the user visiting the logged in page if he/she is not logged in
	if(!isUserLoggedIn()) {
		echo '{}';
		exit;
	}

	$group = $loggedInUser->groupID();
	if ($group['Group_Name'] != 'Admin') {
		echo '{}';
		exit;
	}
	
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
	
	if ($_GET['ids']) {
		$ids = explode(',', $_GET['ids']);
		$ids = array_filter($ids, 'is_numeric');
	}
	
	if ($ids && count($ids)) {
		if ($_GET['action'] == 'delete') {
			$sql = "DELETE FROM comments WHERE comment_id IN (" .
				mysql_escape_string(implode(',', $ids)) . ')';
			$db->sql_query($sql);
		} else if ($_GET['action'] == 'flag') {
			$sql = "UPDATE comments
				SET admin_flag = -1
				WHERE comment_id IN (" .
					mysql_escape_string(implode(',', $ids)) . ')';
			$db->sql_query($sql);
			updateHide();
		} else if ($_GET['action'] == 'approve') {
			$sql = "UPDATE comments
				SET admin_flag = 1
				WHERE comment_id IN (" .
					mysql_escape_string(implode(',', $ids)) . ')';
			$db->sql_query($sql);
			updateHide();
		}
	}

	$sql = "SELECT comments.comment_id, UNIX_TIMESTAMP(comments.timestamp) as timestamp, video_time, language, email, name, comment, admin_flag, COUNT(flag.timestamp) as user_flag
		FROM comments
		LEFT JOIN flag ON comments.comment_id = flag.comment_id
		GROUP BY comments.comment_id, comments.timestamp, video_time, language, email, name, comment, admin_flag
		ORDER BY timestamp DESC";
	 
	$result = $db->sql_query($sql);
	
	$comments = array();
	
	while($row = $db->sql_fetchrow($result)) {
		foreach ($row as $key => $value) {
			if (is_numeric($value)) {
				$row[$key] = floatval($value);
			}
		}
		array_push($comments, $row);
	}
	
	echo json_encode($comments);
?>