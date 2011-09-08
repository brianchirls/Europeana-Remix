<?php
	/*
		UserCake Version: 1.4
		http://usercake.com
		
		Developed by: Adam Davis
	*/

	//General Settings
	//--------------------------------------------------------------------------

	require_once(dirname(__FILE__) . '/../settings.php');
	
	//Database Information
	$dbtype = "mysql"; 
	$db_host = DB_HOST;
	$db_user = DB_USER;
	$db_pass = DB_PASSWORD;
	$db_name = DB_NAME;
	$db_port = DB_PORT;
	$db_table_prefix = "userCake_";

	$langauge = "en";
	
	//Generic website variables
	$websiteName = "Europeana Remix";
	$websiteUrl = SITE_ROOT . '/'; //including trailing slash

	//Do you wish UserCake to send out emails for confirmation of registration?
	//We recommend this be set to true to prevent spam bots.
	//False = instant activation
	//If this variable is falses the resend-activation file not work.
	$emailActivation = true;

	//In hours, how long before UserCake will allow a user to request another account activation email
	//Set to 0 to remove threshold
	$resend_activation_threshold = 0.05;
	
	//Tagged onto our outgoing emails
	$emailAddress = EMAIL_ADDRESS;
	
	//Date format used on email's
	$emailDate = date("l \\t\h\e jS");
	
	//Directory where txt files are stored for the email templates.
	$mail_templates_dir = dirname(__FILE__) . "/mail-templates/";
	
	$default_hooks = array("#WEBSITENAME#","#WEBSITEURL#","#DATE#");
	$default_replace = array($websiteName,$websiteUrl,$emailDate);
	
	//Display explicit error messages?
	$debug_mode = false;
	
	//---------------------------------------------------------------------------
?>