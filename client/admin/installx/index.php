<html>
<head>
<title>UserCake - Database Setup</title>
<style type="text/css">
<!--
html, body {
	margin-top:15px;
	background: #fff;
	font-family: Verdana, Arial, Helvetica, sans-serif;
	font-size:0.85em;
	color:#4d4948;
	text-align:center;
}

a {
 color:#4d4948;
}
-->
</style>
</head>
<body>
<p><img src="usercake-badge.jpg"></p>
<?php
	/*
		UserCake Version: 1.4
		http://usercake.com
		
		Developed by: Adam Davis
	*/

	//  Primitive installer
	
	
	require_once("../../../models/settings.php");
	
	//Dbal Support - Thanks phpBB ; )
	require_once("../../../models/db/".$dbtype.".php");
	require_once("../../../models/funcs.user.php");
	
	//Construct a db instance
	$db = new $sql_db();
	if(is_array($db->sql_connect(
							$db_host, 
							$db_user,
							$db_pass,
							$db_name, 
							$db_port,
							false, 
							false
	))) {
		echo "<strong>Unable to connect to the database, check your settings.</strong>";	
		
		echo "<p><a href=\"?install=true\">Try again</a></p>";
	}
	else
	{
	
	if(returns_result("SELECT * FROM ".$db_table_prefix."Groups LIMIT 1") > 0)
	{
		echo "<strong>UserCake has already been installed.<br /> Please remove / rename the install directory.</strong>";	
	}
	else
	{
		if(isset($_GET["install"]))
		{
	
				$db_issue = false;
			
				$groups_sql = "
					CREATE TABLE IF NOT EXISTS `".$db_table_prefix."Groups` (
					`Group_ID` int(11) NOT NULL auto_increment,
					`Group_Name` varchar(225) NOT NULL,
					 PRIMARY KEY  (`Group_ID`)
					) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;
				";
				
				$group_entry = "
					INSERT INTO `".$db_table_prefix."Groups` (`Group_ID`, `Group_Name`) VALUES
					(1, 'Standard User');
				";
				
				$users_sql = "
					 CREATE TABLE IF NOT EXISTS `".$db_table_prefix."Users` (
					`User_ID` int(11) NOT NULL auto_increment,
					`Username` varchar(150) NOT NULL,
					`Username_Clean` varchar(150) NOT NULL,
					`Password` varchar(225) NOT NULL,
					`Email` varchar(150) NOT NULL,
					`ActivationToken` varchar(225) NOT NULL,
					`LastActivationRequest` int(11) NOT NULL,
					`LostPasswordRequest` int(1) NOT NULL default '0',
					`Active` int(1) NOT NULL,
					`Group_ID` int(11) NOT NULL,
					`SignUpDate` int(11) NOT NULL,
					 `LastSignIn` int(11) NOT NULL,
					 PRIMARY KEY  (`User_ID`)
					) ENGINE=MyISAM DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
				";
				
				
				if($db->sql_query($groups_sql))
				{
					echo "<p>".$db_table_prefix."Groups table created.....</p>";
				}
				else
				{
					echo "<p>Error constructing ".$db_table_prefix."Groups table.</p><br /><br /> DBMS said: ";
					
					echo print_r($db->_sql_error());
					$db_issue = true;
				}
				
				if($db->sql_query($group_entry))
				{
					echo "<p>Inserted Standard User group into ".$db_table_prefix."Groups table.....</p>";
				}
				else
				{
					echo "<p>Error constructing Groups table.</p><br /><br /> DBMS said: ";
					
					echo print_r($db->_sql_error());
					$db_issue = true;
				}
				
				if($db->sql_query($users_sql))
				{
					echo "<p>".$db_table_prefix."Users table created.....</p>";
				}
				else
				{
					echo "<p>Error constructing user table.</p><br /><br /> DBMS said: ";
					
					echo print_r($db->_sql_error());
					$db_issue = true;
				}
				
				
				if(!$db_issue)
				echo "<p><strong>Database setup complete, please delete the install folder.</strong></p>";
				else
				echo "<p><a href=\"?install=true\">Try again</a></p>";
				
			
				
		}
		else
		{
	?>
			<a href="?install=true">Install UserCake</a>
	
	
	<?php } } }
	?>
</body>
</html>