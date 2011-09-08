
		<?php if(!isUserLoggedIn()) { ?>
            <ul>
            <!-- <li><a href="index.php">Home</a></li> -->
                <li><a href="login.php">Login</a></li>
                <li><a href="forgot-password.php">Forgot Password</a></li>
                <li><a href="resend-activation.php">Resend Activation Email</a></li>
            </ul>
       <?php } else { ?>
       		<ul>
            	<li><a href="account.php">Home</a></li>
            	<li><a href="logout.php">Logout</a></li>
       			<li><a href="change-password.php">Change password</a></li>
                <li><a href="update-email-address.php">Update email address</a></li>
       		</ul>
       <?php } ?>
            
            <div id="build">
                <a href="http://usercake.com"><span>UserCake</span></a>
            </div>
            
