<?php
	/*
		UserCake Version: 1.4
		http://usercake.com
		
		Developed by: Adam Davis
	*/
	require_once("../../models/config.php");
	
	//Prevent the user visiting the logged in page if he/she is not logged in
	if(!isUserLoggedIn()) { header("Location: login.php"); die(); }
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>Europeana Comments Admin <?php echo $loggedInUser->display_username; ?></title>
<link href="cakestyle.css" rel="stylesheet" type="text/css" />
<style type="text/css">

#form {
	display: none;
}

table {
	border-collapse: collapse;
	empty-cells: show;
	border-spacing: 0;
}

.comment,
.lang,
.email,
.status {
	text-align: left;
}

.date,
.video-time {
	text-align: right;
}

td.comment {
	min-width: 300px;
}

td.date, td.action {
	white-space: nowrap;
}

td {
	vertical-align: top;
	padding: 4px;
	border: 1px solid #eee; 
}

th {
	vertical-align: bottom;
	padding: 4px;
}

thead > tr > th{
	border-bottom: black solid 1px;
}
</style>
</head>
<body>
<div id="wrapper">

	<div id="content">
    
        <div id="left-nav">
        <?php include("layout_inc/left-nav.php"); ?>
            <div class="clear"></div>
        </div>
        
        
        <div id="main">
        	<h1>Europeana Remix: Comments</h1>

        	<p>Welcome to your account page <strong><?php echo $loggedInUser->display_username; ?></strong></p>
        	<div id="form">
        		<div>
					<label for="sort-by">Sort by</label>
					<select id="sort-by">
						<option value="date">Date/Time Posted</option>
						<option value="video">Time in Video</option>
					</select>
	
					<label for="language">Filter by Language</label>
					<select id="language">
						<option value="">Any</option>
						<option value="en">English</option>
						<option value="de">German</option>
					</select>

					<label for="filter-status">Filter by Status</label>
					<select id="filter-status">
						<option value="">Any</option>
						<option value="rejected">Rejected</option>
						<option value="user-flagged">User Flagged</option>
						<option value="approved">Approved</option>
					</select>
				</div>

        		<div><br/>
        			<label for="action">Action</label>
					<select id="action">
						<option value="flag">Reject</option>
						<option value="approve">Approve</option>
						<option value="delete">Delete</option>
					</select>
					<button id="go-action">Go</button>
				</div>
				<table id="comments-table">
					<thead>
						<tr>
							<th></th>
							<th class="comment">Comment</th>
							<th class="date">Date/Time</th>
							<th class="video-time">Video Time</th>
							<th class="lang">Lang.</th>
							<th class="email">Email</th>
							<th class="status">Status</th>
							<th class="action">Actions</th>
						</tr>
					</thead>
					<tbody id="comments-table-body"></tbody>
				</table>
			</div>

            <p>I am a <strong><?php  $group = $loggedInUser->groupID(); echo $group['Group_Name']; ?></strong></p>
          
            
            <p>You joined on <?php echo date("l \\t\h\e jS Y",$loggedInUser->signupTimeStamp()); ?> </p>
  		</div>
  
	</div>
</div>
<script type="text/javascript">
window.addEventListener('DOMContentLoaded', function() {

	var form = document.getElementById('form'),
		table = document.getElementById('comments-table'),
		tbody = document.getElementById('comments-table-body');
	var commentsData,
		filterLang = '',
		filterStatus,
		filterVideoMin = 0,
		filterVideoMax = Infinity,
		sortMode = 'date',
		sortInvert = false,
		sortFunctions = {
			'date': function(a, b) {
				//default order is descending
				return (b.timestamp - a.timestamp) * (sortInvert ? -1 : 1);
			},
			'video': function(a, b) {
				//default order is ascending
				return (a.video_time - b.video_time) * (sortInvert ? -1 : 1);
			}
		};

	function timeToText(t) {
		//assume t in seconds
		t = Math.floor(t);
		var sec = t % 60;
		var min = (t - sec) / 60;
		if (sec < 10) {
			sec = '0' + sec;
		}
		if (min > 59) {
			var hr = Math.floor(min / 60);
			min = min % 60;
			if (min < 10) {
				min = '0' + min;
			}
			return hr + ':' + min + ':' + sec;
		}
		return min + ':' + sec;
	}

	function makeLinkedTextElement(source, tag) {
		var element = document.createElement(tag || 'p');
		var text = '';
		var urlRegex = /https?:\/\/([a-zA-Z0-9\.]+\.[a-zA-Z]{2,6}[^\s\n\r\t$]*)/gi;
		var parsed, lastIndex = 0;
		while (parsed = urlRegex.exec(source)) {
			element.appendChild(document.createTextNode(source.substr(lastIndex, parsed.index - lastIndex)));
			text = '<a href="' + parsed[0] + '" target="_new">';
			if (parsed[1].length > 20) {
				text += parsed[1].substr(0, 17) + '...';
			} else {
				text += parsed[1];
			}
			text += '</a>';
			element.innerHTML += text;
			lastIndex = parsed.index + parsed[0].length;
		}
		if (lastIndex < source.length) {
			element.appendChild(document.createTextNode(source.substr(lastIndex)));
		}

		return element;
	}
	
	function displayTable() {
		var i, comment, tr, td, e;

		table.style.display = 'none';
		tbody.innerHTML = '';
		
		sortMode = document.getElementById('sort-by').value;
		commentsData.sort(sortFunctions[sortMode]);
		
		for (i = 0; i < commentsData.length; i++) {
			comment = commentsData[i];
			tr = document.createElement('tr');
			comment.row = tr;
			
			//check box
			td = document.createElement('td');
			e = document.createElement('input');
			e.setAttribute('type', 'checkbox');
			e.setAttribute('class', 'check');
			e.id = 'checkbox-' + comment.comment_id;
			td.appendChild(e);
			tr.appendChild(td);

			//comment text
			td = makeLinkedTextElement(comment.comment || '', 'td');
			td.setAttribute('class', 'comment');
			tr.appendChild(td);

			//date/time
			td = document.createElement('td');
			td.setAttribute('class', 'date');
			td.appendChild(document.createTextNode( (new Date(comment.timestamp * 1000)).toLocaleDateString() ));
			tr.appendChild(td);

			//video time
			td = document.createElement('td');
			td.setAttribute('class', 'video-time');
			td.appendChild(document.createTextNode( timeToText(comment.video_time) ));
			tr.appendChild(td);

			//lang
			td = document.createElement('td');
			td.setAttribute('class', 'lang');
			td.appendChild(document.createTextNode( comment.language.toUpperCase() ));
			tr.appendChild(td);

			//email
			td = document.createElement('td');
			td.setAttribute('class', 'email');
			if (comment.email) {
				var e = document.createElement('a');
				e.setAttribute('href', 'mailto:' + comment.email);
				e.appendChild(document.createTextNode( comment.email ));
				td.appendChild(e);
			}
			tr.appendChild(td);

			//status
			td = document.createElement('td');
			td.setAttribute('class', 'status');
			if (comment.admin_flag > 0) {
				td.appendChild(document.createTextNode( 'Approved' ));
				tr.style.color = 'darkblue';
			} else if (comment.admin_flag < 0) {
				td.appendChild(document.createTextNode( 'Rejected' ));
				tr.style.color = 'darkred';
			} else if (comment.user_flag) {
				td.appendChild(document.createTextNode( 'Flagged by ' + comment.user_flag + ' user' + (comment.user_flag > 1 ? 's' : '') ));
				if (comment.user_flag > 3) {
					tr.style.color = 'red';
				}
			}			
			tr.appendChild(td);

			td = document.createElement('td');
			td.setAttribute('class', 'action');
			(function(comment) {
				e = document.createElement('button');
				e.id = 'flag-' + comment.comment_id;
				e.appendChild(document.createTextNode('Reject'));
				e.addEventListener('click', function() {
					editComments(comment.comment_id, 'flag');
				}, false);
				td.appendChild(e);

				e = document.createElement('button');
				e.id = 'approve-' + comment.comment_id;
				e.appendChild(document.createTextNode('Approve'));
				e.addEventListener('click', function() {
					editComments(comment.comment_id, 'approve');
				}, false);
				td.appendChild(e);

				e = document.createElement('button');
				e.id = 'delete-' + comment.comment_id;
				e.appendChild(document.createTextNode('Delete'));
				e.addEventListener('click', function() {
					editComments(comment.comment_id, 'delete');
				}, false);
				td.appendChild(e);
			}(comment));
			tr.appendChild(td);

			tbody.appendChild(tr);
		}
		
		table.style.display = 'table';
		form.style.display = 'block';
	}
	
	function sortComments() {
		var i, comment;
		
		table.style.display = 'table';

		sortMode = document.getElementById('sort-by').value;
		commentsData.sort(sortFunctions[sortMode]);
		
		for (i = commentsData.length - 1; i >= 0; i--) {
			comment = commentsData[i];
			tbody.insertBefore(comment.row, tbody.firstChild);
		}		
	}
	
	function filterComments() {
		var i, comment, show;
		
		filterLang = document.getElementById('language').value;
		filterStatus = document.getElementById('filter-status').value;
		
		for (i = 0; i < commentsData.length; i++) {
			show = true;
			comment = commentsData[i];
			
			if (comment.video_time < filterVideoMin || comment.video_time > filterVideoMax) {
				show = false;
			} else if (filterLang && filterLang !== comment.language) {
				show = false;
			} else if (filterStatus === 'rejected' && comment.admin_flag >= 0) {
				show = false;
			} else if (filterStatus === 'user-flagged' && !comment.user_flag) {
				show = false;
			} else if (filterStatus === 'approved' && comment.admin_flag <= 0) {
				show = false;
			}
			if (show) {
				comment.row.style.display = '';
			} else {
				comment.row.style.display = 'none';
				document.getElementById('checkbox-' + comment.comment_id).checked = false;
			}
		}
	}
	
	function editComments(id, action) {
		if (id === undefined) {
			return;
		}
		
		if (id.length === undefined) {
			id = [id];
		}
		
		if (!id.length) {
			return;
		}
		
		if (action === 'delete' && !window.confirm("Are you sure you want to delete these comments?\nThis action cannot be undone.")) {
			return;
		}
		
		//don't edit anything that's filtered
		var i, comment, j;
		for (i = 0; i < commentsData.length && id.length; i++) {
			comment = commentsData[i];
			
			j = id.indexOf(comment.comment_id);

			if (j >= 0) {
				if (comment.video_time < filterVideoMin || comment.video_time > filterVideoMax) {
					id.splice(j, 1);
				} else if (filterLang && filterLang !== comment.language) {
					id.splice(j, 1);
				}
			}
		}
		
		if (!id.length) {
			return;
		}

		var req = new XMLHttpRequest();
		req.open('GET', 'comments.php?action=' + action + '&ids=' + id.join(','), true);
		req.onreadystatechange = function (event) {
			if (req.readyState == 4) {
				if(req.status == 200) {
					commentsData = JSON.parse(req.responseText);
					
					//populate data
					displayTable();
					
					filterComments();
				} else {
					console.log('Error', req.statusText);
				}
			}
		};
		req.send(null);
	}
	
	var req = new XMLHttpRequest();
	req.open('GET', 'comments.php', true);
	req.onreadystatechange = function (event) {
		if (req.readyState == 4) {
			if(req.status == 200) {
				commentsData = JSON.parse(req.responseText);
				
				//populate data
				displayTable();
				
				filterComments();
			} else {
				console.log('Error', req.statusText);
			}
		}
	};
	req.send(null);
	
	document.getElementById('sort-by').addEventListener('change', sortComments, false);
	document.getElementById('language').addEventListener('change', filterComments, false);
	document.getElementById('filter-status').addEventListener('change', filterComments, false);
	document.getElementById('go-action').addEventListener('click', function() {
		var action = document.getElementById('action').value;
		
		var comment, i, ids = [];
		for (i = 0; i < commentsData.length; i++) {
			comment = commentsData[i];
			if (document.getElementById('checkbox-' + comment.comment_id).checked) {
				ids.push(comment.comment_id);
			}
		}
		
		editComments(ids, action);
	}, false);

}, false);


</script>
</body>
</html>

