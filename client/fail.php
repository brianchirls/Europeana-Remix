<!doctype html>
<!--[if lt IE 7 ]> <html class="no-js ie6"> <![endif]-->
<!--[if IE 7 ]>    <html class="no-js ie7"> <![endif]-->
<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
	
	<title id="title">A First World War friendship – an interactive HTML5 video by Europeana</title>
	
	<meta name="description" content="An interactive experience around the story of an unlikely friendship during the First World War.">

	<meta name="author" content="Europeana">
	
	<link rel="shortcut icon" href="/favicon.ico">
	<link rel="image_src" type="image/png" href="image/logo.png" />
<?php
	if (!function_exists('cacheBust')) {
		function cacheBust($path) {
			$time = filemtime($path);
			$path = explode('.', $path);
			array_splice($path, -1, 0, $time);
			return implode('.', $path);
		}
	}
	
	//it's actually not worth doing this for the moment
	$style_path = 'css/style.css';
	$style_path = cacheBust($style_path);

	echo '<link rel="stylesheet" href="' . $style_path . "\" id=\"main-style\">\n";
?>
<style type="text/css">
	#intro {
		display:block;
		
	}
	#intro-text {
		display:block;
		opacity: 1;
	}
	
	body > #bg {
		width: 100%;
		position: absolute;
		top: 0;
		left: 0;
		z-index: -10;
	}
	
	#intro #intro-title {
		font-size: 5em;
	}
	
	#intro p {
		font-size: 2.5em;
		color: black;
		margin: 1em 0 0.5em 0;
		font-family: 'Chevin-Light', sans-serif;
	}
	
	#intro table {
		margin: 0 auto 2em;
	}
	
	img#eu-logo {
		opacity: 1;
	}
</style>
</head>
<body>
	<img src="image/background.jpg" id="bg"/>
	<img id="eu-logo" src="image/logo.png" class="fade"/>
	<div id="intro" class="page intro">
		<div id="intro-text" class="intro-text" style="display:block">
			<h2 id="intro-title">Europeana Remix</h2>
			<p>Please be aware that for optimal performance, these browsers are recommended:<br/>
			Bitte beachten Sie, dass für eine optimale Leistung die folgenden Browser empfohlen sind:</p>
			<table>
				<tr>
					<th><a href="http://www.getfirefox.com">Firefox</a></th>
					<th><a href="http://www.google.com/chrome">Chrome</a></th>
					<th><a href="http://www.apple.com/safari/">Safari</a></th>
					<th><a href="http://ie.microsoft.com/">IE</a></th>
					<th><a href="http://www.opera.com/download/">Opera</a></th>
				</tr>
				<tr>
					<td>4.0+</td>
					<td>4.0+</td>
					<td>4.0+</td>
					<td>9+</td>
					<td>10.5+</td>
				</tr>
			</table>
			<p>Click <a href="http://www.youtube.com/watch?v=8uLOWsWod7c">here</a> for the video without the interactive components.<br/>
			Klicken Sie <a href="http://www.youtube.com/watch?v=8uLOWsWod7c">hier</a> für das Video ohne die interaktiven Komponenten.</p>
		</div>
	</div>
	<footer>
		<!-- &copy; 2011 Powered by <a href="http://www.europeana.eu">Europeana</a> -->
		<a href="http://www.europeana.eu" target="_new"><img src="image/poweredby.png"/></a>
	</footer>
</body>
<script type="text/javascript">

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-25573689-1']);
_gaq.push(['_trackPageview']);

(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

</script>
</html>