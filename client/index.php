<?php

define("DEBUG",false);

require_once('../db.php');

//Look for cookies for language settings and comments
if (isset($_COOKIE['euid'])) {
	$cookie_id = $_COOKIE['euid'];
	$sql = "SELECT * FROM cookies WHERE cookie_id = '" . mysql_escape_string($cookie_id) . "'";
	$result = mysql_query($sql);
	if ($row = mysql_fetch_object($result)) {
		$language = $row->language;
	} else {
		$cookie_id = false;
	}
}

if (!$cookie_id) {
	$cookie_id = sha1(COOKIE_SALT . $_SERVER['REMOTE_ADDR'] . time() . rand());
}

if ($language != 'en' && $language != 'de') {
	/* detect browser language. defaults to English */
	
	$en_score = 0;
	$de_score = 0;
	
	if (preg_match_all('/(\w{2})((-|_)\w+)?(;q=(\d+(\.\d+)?))?/',$_SERVER['HTTP_ACCEPT_LANGUAGE'],$matches,PREG_SET_ORDER)) {
		$best_score = 0;
		foreach ($matches as $match) {
			$lang = strtolower($match[1]);
			$score = $match[5] ? (float)($match[5]) : 1.0;
			if ($score > $best_score) {
				$language = $lang;
				$best_score = $score;
			}
			if ($lang == 'de') {
				$de_score = $score;
			} else if ($lang == 'en') {
				$en_score = $score;
			}
		}
	}
	
	if ($de_score > $en_score) {
		$language = 'de';
	} else {
		$language = 'en';
	}
	
}

$sql = "INSERT INTO cookies (cookie_id, language, create_time, load_time) VALUES ('" . mysql_escape_string($cookie_id) . "', '" . mysql_escape_string($language) . "', NOW(), NOW())
	ON DUPLICATE KEY UPDATE language = '" . mysql_escape_string($language) . "', load_time = NOW()";
mysql_query($sql);

//todo: specify cookie domain
//seconds * minutes * hours * days + current time, 180 days
$cookies = $_COOKIE;

setcookie('euid', $cookie_id, time() + 60 * 60 * 24 * 180);

?><!doctype html>
<!--[if lt IE 7 ]> <html lang="<?php echo $language ?>" class="no-js ie6"> <![endif]-->
<!--[if IE 7 ]>    <html lang="<?php echo $language ?>" class="no-js ie7"> <![endif]-->
<!--[if IE 8 ]>    <html lang="<?php echo $language ?>" class="no-js ie8"> <![endif]-->
<!--[if IE 9 ]>    <html lang="<?php echo $language ?>" class="no-js ie9"> <![endif]-->
<!--[if (gt IE 9)|!(IE)]><!--> <html lang="<?php echo $language ?>" class="no-js"> <!--<![endif]-->
<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
	
	<title id="title">A First World War friendship – an interactive HTML5 video by Europeana</title>
	
	<?php if ($language == 'de'): ?>
		<meta name="description" content="Ein interaktives Erlebnis rund um die Geschichte einer ungewöhnlichen Freundschaft während des Ersten Weltkriegs.">
		<meta name="language" content="de"/>
	<?php else: ?>
		<meta name="description" content="An interactive experience around the story of an unlikely friendship during the First World War.">
		<meta name="language" content="en"/>
	<?php endif; ?>

	<meta name="author" content="Europeana">
	
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	
	<link rel="shortcut icon" href="/favicon.ico">
	<link rel="apple-touch-icon-precomposed" href="/apple-touch-icon.png">
	<link rel="image_src" type="image/png" href="image/logo.png" />
<?php
	//it's actually not worth doing this for the moment
	if (true || DEBUG) {
		$style_path = 'css/style.css';
	} else {
		$style_path = 'css/style.min.css';
	}
	$time = filemtime($style_path);

	echo '<link rel="stylesheet" href="' . $style_path . '"?' . $time . ">\n";
?>
	<script src="js/libs/modernizr-1.7.min.js"></script>
	<script type="text/javascript">
	(typeof document !== "undefined" && !("classList" in document.createElement("a"))) && document.write(unescape('%3Cscript src="js/libs/classList.min.js"%3E%3C/script%3E'));
	</script>
	<script type="text/javascript">
	(window.JSON && window.JSON.parse) || document.write(unescape('%3Cscript src="js/libs/json2.min.js"%3E%3C/script%3E'));
	</script>
	<script type="text/javascript">
	
    if (!Array.prototype.indexOf) {  
        Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {  
            "use strict";  
            if (this === void 0 || this === null) {  
                throw new TypeError();  
            }  
            var t = Object(this);  
            var len = t.length >>> 0;  
            if (len === 0) {  
                return -1;  
            }  
            var n = 0;  
            if (arguments.length > 0) {  
                n = Number(arguments[1]);  
                if (n !== n) { // shortcut for verifying if it's NaN  
                    n = 0;  
                } else if (n !== 0 && n !== window.Infinity && n !== -window.Infinity) {  
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));  
                }  
            }  
            if (n >= len) {  
                return -1;  
            }  
            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);  
            for (; k < len; k++) {  
                if (k in t && t[k] === searchElement) {  
                    return k;  
                }  
            }  
            return -1;  
        }  
    }

	//override and fail gracefully if addEventListener is not supported (IE < 9)
	if (!window.addEventListener ||
		!Element.prototype.addEventListener) {
		window.addEventListener =  function(event, callback, blah) {
			this.attachEvent('on' + event, callback);
		};
		document.addEventListener = window.addEventListener;
		
		if (window.Element) {
			Element.prototype.addEventListener = window.addEventListener;
		} else {
			//classList.js fails here, so let's just fill in what we need
			function makeClassList(element) {
				if (element.classList) {
					return;
				}

				element.classList = {
					add: function(c) {
						var i, s = element.getAttribute('class') || '';
						s = s.split(' ');
						i = s.indexOf(c);
						if (i < 0) {
							s.push(c)
							element.setAttribute('class', s.join(' '));
						}
					},
					remove: function(c) {
						var i, s = element.getAttribute('class') || '';
						s = s.split(' ');
						i = s.indexOf(c);
						if (i >= 0) {
							s.splice(i, 1);
							element.setAttribute('class', s.join(' '));
						}
					}
				}
			};
		
			var __createElement = document.createElement;
			document.createElement = function(tagName) {
				var element = __createElement.call(document, tagName);
				if (element) {
					element.addEventListener = window.addEventListener;
					makeClassList(element);
				}
				return element;
			}
		
			var __getElementById = document.getElementById
			document.getElementById = function(id) {
				var element = __getElementById.call(document, id);
				if (element) {
					element.addEventListener = window.addEventListener;
					makeClassList(element);
				}
				return element;
			}
			
		}
	}
	
	if (!Date.now) {
		Date.now = function () {
			return +(new Date());
		};
	}

	</script>
	<style type="text/css">
	
	html section[lang],
	html div[lang] {
		display: none;
	}
	
	html[lang=en] section[lang=en],
	html[lang=en] div[lang=en] {
		display: block;
	}
	
	html[lang=de] section[lang=de],
	html[lang=de] div[lang=de] {
		display: block;
	}
	
	</style>
	<script type="text/javascript">
	
	window.flickrApiKey = '<?php echo FLICKR_API_KEY ?>';
	
	</script>
</head>
<body>
	<div id="background"></div>
	<div id="container">
		<div id="video-frame" role="main">
			<video id="video" width="1024" preload autobuffer
				webkit-playsinline>
				<!-- todo: for android, http://www.broken-links.com/2010/07/08/making-html5-video-work-on-android-phones/ -->
				<source src="video/otto-and-bernard.webm" type='video/webm; codecs="vp8, vorbis"'/>
				<source src="video/otto-and-bernard.mp4" type="video/mp4" />
				<source src="video/otto-and-bernard.ogv" type='video/ogg; codecs="theora, vorbis"' />
			</video>
			
			<a href="http://remix.europeana.eu" id="logo-link"><img id="eu-logo" src="image/logo.png" class="fade"/></a>

			<div id="resources"></div>

			<div id="subtitles"></div>
			
			<div id="comments"></div>

			<div id="intro" class="page intro">
				<div id="intro-text" class="intro-text">
					<h2 id="intro-title">Europeana Remix</h2>
					<h3 id="intro-caption">An interactive experience around the story of an unlikely friendship during the First World War.</h3>
					<div id="no-video">
						<p id="no-video-browsers">Please be aware that for optimal performance, these browsers are recommended:</p>
						<table>
							<tr>
								<th><a href="http://www.getfirefox.com">Firefox</a></th>
								<th><a href="http://www.google.com/chrome">Chrome</a></th>
								<th><a href="http://www.apple.com/safari/">Safari</a></th>
								<th><a href="http://ie.microsoft.com/">IE</a></th>
								<th><a href="http://www.opera.com/download/">Opera</a></th>
								<th><a href="http://www.apple.com/ios/">iPad</a></th>
							</tr>
							<tr>
								<td>3.6+</td>
								<td>4.0+</td>
								<td>4.0+</td>
								<td>9+</td>
								<td>10.5+</td>
								<td>4.0+</td>
							</tr>
						</table>
						<p id="no-video-continue-text">Click 'continue' for the video without the interactive components.</p>
						<div id="no-video-continue">Continue</div>
						<!-- http://www.youtube.com/watch?v=8uLOWsWod7c -->
					</div>
				</div>
				<div id="intro-play"><img src="image/intro-play.png"/></div>
				<div id="intro-en" lang="de">English</div>
				<div id="intro-de" lang="en">Deutsch</div>
			</div>

			<div id="end" class="page intro">
				<div id="end-text" class="intro-text">
					<h2 id="end-title">Like this story?<br/>
						Help us build the next</h2>
					<h3 id="end-caption">Europeana wants to hear your family story about World War 1. Share your photos, letters and other memorabilia.</h3>
					<div class="end-buttons">
						<div id="play-again">Play Again</div>
						<div><a href="http://www.europeana1914-1918.eu/en/contributor" id="add-archive">Add to the Archive</a></div>
						<div><a href="http://www.europeana1914-1918.eu/en/browse" id="explore-archive">Explore the Archive</a></div>
					</div>
					<span id="end-close">Close Window</span>
				</div>
			</div>

			<div id="about" class="page">
				<div class="page-container">
					<section lang="en">
						<h2>About</h2>
						<h3>Background</h3>
						<p>Europeana Remix is an interactive platform based on the film ‘Otto & Bernard’. This short film was produced for the project <a href="http://www.europeana1914-1918.eu">Europeana Erster Weltkrieg</a>, encouraging families to share photos, letters and memorabilia of World War 1. Now the film forms the basis of the Remix initiative, combining leading edge technology (Popcorn.js, the HTML5 video framework) and a variety of resources from Europeana and across the web.</p>
						
						<h3>Share</h3>
						<p>Europeana’s work on the First World War sets out to discover untold stories, to share them across borders, and to invite responses from around Europe as we approach the centenary of the conflict. We encourage people to share ideas, stories, comments and links on this platform.</p>
						
						<h3>Technology</h3>
						<p>With the Popcorn.js and HTML5 video technology on board, Remix is at the vanguard of using audiovisual heritage in engaging people with their history.  Not only does it help to tell a story, but also its interactive features put the user in control of what’s interesting to them, what they want to see and how they want to contribute.</p>
						
						<p>All this high-end technology gives this platform experimental appeal - but also puts some demand on its visitors in terms of browser versions. Be aware that new technology like this needs browsers that can cope. For optimal performance, these browsers are recommended:</p>
						
						<table>
							<tr>
								<th><a href="http://www.getfirefox.com">Firefox</a></th>
								<th><a href="http://www.google.com/chrome">Chrome</a></th>
								<th><a href="http://www.apple.com/safari/">Safari</a></th>
								<th><a href="http://ie.microsoft.com/">IE</a></th>
								<th><a href="http://www.opera.com/download/">Opera</a></th>
								<th><a href="http://www.apple.com/ios/">iPad</a></th>
							</tr>
							<tr>
								<td>3.6+</td>
								<td>4.0+</td>
								<td>4.0+</td>
								<td>9+</td>
								<td>10.5+</td>
								<td>4.0+</td>
							</tr>
						</table>
						
						<p>So that others can make free use of this ground-breaking development as the basis for new applications, the Remix source code has been made available on <a href="https://github.com/brianchirls/Europeana-Remix">GitHub</a>, a collaborative code repository for programmers.</p>
						
						<h3>Project Partners</h3>
						<h4>Europeana Foundation (<a href="http://www.europeana.eu" target="_new">www.europeana.eu</a>)</h4>
						<p>A partnership of European cultural heritage associations that have joined forces to bring together the digitised content of Europe’s galleries, libraries, museums, archives and audiovisual archives. Currently Europeana gives integrated access to 20 million books, films, paintings, museum objects and archival documents from some 1500 content providers. The content is drawn from every European member state and the interface is in 27 European languages. Europeana receives its main funding from the European Commission.</p>
						
						<h4>Knowledgeland Foundation (<a href="http://www.knowledgeland.org" target="_new">www.knowledgeland.org</a>)</h4>
						<p>Knowledgeland is an independent think tank searching for ways to spark the social innovations needed to improve the knowledge society. Active in education, government, cultural heritage, copyright, creative economy and social media, Knowledgeland strives to innovate these fields, often in collaboration with partners and networks.</p>
						
						<h4>Three Eyed Labs / Brian Chirls (<a href="http://www.chirls.com" target="_new">www.chirls.com</a>)</h4>
						<p>Brian Chirls is a media artist, technologist and founder of Three Eyed Labs, a research and development lab based in New York, developing original cross-media content, tools and innovative business models for filmmakers, journalists and musicians.</p>
						
						<h4>BigUp / Harold van Velsen (<a href="http://werk.bigup.nl" target="_new">werk.bigup.nl</a>)</h4>
						<p>Harold van Velsen is an experienced graphic & interaction designer. He built an impressive portfolio with several leading interactive agencies. He founded BigUp in 2010.</p>

						<h3>Licensing</h3>
						<p>The film and all user comments are released under a Creative Commons Attribution-ShareAlike license (<a href="http://creativecommons.org/licenses/by-sa/3.0/us/">'CC BY-SA'</a>)</p>
						<img src="http://mirrors.creativecommons.org/presskit/buttons/88x31/png/by-sa.png">
						
						<h3>Terms of Use</h3>
						<p><a href="#terms-of-use">Read Terms for User Contributions on remix.europeana.eu</a></p>
						
						<h3>Disclaimer</h3>
						<p><a href="#disclaimer">Read Disclaimer</a></p>
						
					</section>
					<section lang="de">
						<h2>Über das Projekt</h2>
						<h3>Hintergrund</h3>
						<p>Europeana Remix ist eine interaktive Plattform basierend auf dem Film ‘Otto & Bernard’. Dieser Kurzfilm wurde für das <a href="http://www.europeana1914-1918.eu">Projekt Europeana Erster Weltkrieg</a> produziert, wodurch Familien ermutigt wurden, Fotos, Briefe und Andenken an den 1. Weltkrieg zu teilen. Jetzt bildet der Film die Basis für die Remix-Initiative, indem Bahn brechende Technologie (Popcorn.js, das HTML5 Video Framework) und eine Vielzahl an Ressourcen von Europeana und aus dem ganzen Web kombiniert werden.</p>
						
						<h3>Gemeinsame Nutzung</h3>
						<p>Bei der Arbeit von Europeana zum ersten Weltkrieg geht es darum, unbekannte Geschichten zu entdecken, sie über Grenzen hinweg bekannt zu machen und zu Rückmeldungen aus ganz Europa aufzufordern, während wir uns dem 100. Jahrestag des Konfliktes nähern. Wir ermutigen Menschen, Ideen, Geschichten, Kommentare und Links auf dieser Plattform zu veröffentlichen.</p>
						
						<h3>Technologie</h3>
						<p>Mit dem Einsatz der Popcorn.js und HTML5 Videotechnologie kann Remix spitzenmäßig audiovisuelles Erbe verwenden, um Menschen dazu zu bringen, sich mit ihrer Geschichte zu befassen. Sie hilft nicht nur dabei, eine Geschichte zu erzählen, sondern ihre interaktiven Merkmale verschaffen den Nutzern auch die Kontrolle darüber, was für sie interessant ist, was sie sehen wollen und wie sie ihren Beitrag leisten wollen.</p>
						
						<p>All diese High-end-Technologie verschafft dieser Plattform einen experimentellen Anreiz – aber sie verlangt ihren Besuchern in Sachen Browserversion schon auch etwas ab. Man muss sich bewusst sein, dass neue Technologien wie diese Browser benötigen, die das verarbeiten können. Für optimale Leistung empfehlen wir diese Browser:</p>
						
						<table>
							<tr>
								<th><a href="http://www.getfirefox.com">Firefox</a></th>
								<th><a href="http://www.google.com/chrome">Chrome</a></th>
								<th><a href="http://www.apple.com/safari/">Safari</a></th>
								<th><a href="http://ie.microsoft.com/">IE</a></th>
								<th><a href="http://www.opera.com/download/">Opera</a></th>
								<th><a href="http://www.apple.com/ios/">iPad</a></th>
							</tr>
							<tr>
								<td>3.6+</td>
								<td>4.0+</td>
								<td>4.0+</td>
								<td>9+</td>
								<td>10.5+</td>
								<td>4.0+</td>
							</tr>
						</table>
						
						<p>Um freie Benutzung dieser bahnbrechenden Entwicklung zu ermöglichen als die Basis für neue Anwendungen, ist die Remix-Quellcode zur Verfügung gestellt auf <a href="https://github.com/brianchirls/Europeana-Remix">GitHub</a>, ein gemeinsames Code-Repository für Programmierer.</p>
						
						<h3>Projektpartner</h3>
						<h4>Europeana Foundation (<a href="http://www.europeana.eu" target="_new">www.europeana.eu</a>)</h4>
						<p>Eine Partnerschaft aus europäischen Kulturerbeorganisationen, die sich zusammen getan haben, um den digitalisierten Inhalt von Europas Galerien, Bibliotheken, Museen, Archiven und audiovisuellen Archiven zu bündeln. Derzeit bietet Europeana integrierten Zugriff auf 20 Millionen Bücher, Filme, Gemälde, Museumsobjekte und Archivdokumente von rund 1500 Content-Providern. Der Inhalt wird aus jedem europäischen Mitgliedsstaat gezogen und die Schnittstelle ist in 27 europäischen Sprachen vorhanden. Europeana erhält ihre Hauptmittel von der Europäischen Kommission.</p>
						
						<h4>Knowledgeland Foundation [Stiftung] (<a href="http://www.knowledgeland.org" target="_new">www.knowledgeland.org</a>)</h4>
						<p>Knowledgeland ist eine unabhängige Denkfabrik, die nach Wegen such, die sozialen Innovationen auszulösen, die nötig sind, um die Wissensgesellschaft zu verbessern. Knowledgeland ist aktiv in Bildung, Regierung, Kulturerbe, Copyright, kreative Wirtschaft und soziale Medien unterwegs und strebt danach, in diesen Bereichen Neuerungen vorzunehmen, oft in Zusammenarbeit mit Partnern und Netzwerken.</p>
						
						<h4>Three Eyed Labs / Brian Chirls (<a href="http://www.chirls.com" target="_new">www.chirls.com</a>)</h4>
						<p>Brian Chirls ist ein Medienkünstler, Technologe und der Begründer von Three Eyed Labs, einem Forschungs- und Entwicklungslabor mit Sitz in New York, in dem originaler Cross-Media-Content, Tools, innovative Geschäftsmodelle für Filmemacher, Journalisten und Musiker entwickelt werden.</p>
						
						<h4>BigUp / Harold van Velsen (<a href="http://werk.bigup.nl" target="_new">werk.bigup.nl</a>)</h4>
						<p>Harold van Velsen ist ein erfahrener Grafik- & Interaktionsdesigner. Er baute ein eindrucksvolles Portfolio mit mehreren führenden interaktiven Agenturen auf. Er gründete BigUp im Jahr 2010.</p>

						<h3>Licensing</h3>
						<p>Der Film und alle Kommentare sind unter einer Creative Commons Attribution-Share Alike-Lizenz veröffentlicht (<a href="http://creativecommons.org/licenses/by-sa/3.0/us/">'CC BY-SA'</a>)</p>
						<img src="http://mirrors.creativecommons.org/presskit/buttons/88x31/png/by-sa.png">

						<h3>Bedingungen</h3>
						<p><a href="#terms-of-use">Lesen Bedingungen für Nutzerbeiträge zu remix.europeana.eu</a></p>
						
						<h3>Haftungsausschluss</h3>
						<p><a href="#disclaimer">Lesen Haftungsausschluss</a></p>
					</section>
				</div>
			</div>

			<div id="contact" class="page">
				<div class="page-container">
					<section lang="en">
						<h2>Contact</h2>
						<h3>With questions and suggestions:</h3>
						<p>Email <a href="mailto:marcomms@europeana.eu">marcomms@europeana.eu</a></p>
						<h3>Stay in touch:</h3>
						<a href="http://twitter.com/#!/europeanaEU" style="margin: 0 1%"><img src="image/twitter-link.png" alt="Europeana on Twitter"/></a>
						<a href="http://www.facebook.com/Europeana" style="margin: 0 1%"><img src="image/facebook-link.png" alt="Europeana on Facebook"/></a>
						<h3>Updates &amp; insights:</h3>
						<p><a href="http://blog.europeana.eu" target="_new">http://blog.europeana.eu</a></p>
					</section>
					<section lang="de">
						<h2>Kontakt</h2>
						<h3>Bei Fragen und Vorschlägen:</h3>
						<p>Email <a href="mailto:marcomms@europeana.eu">marcomms@europeana.eu</a></p>
						<h3>In Kontakt bleiben:</h3>
						<a href="http://twitter.com/#!/europeanaEU" style="margin: 0 1%"><img src="image/twitter-link.png" alt="Europeana on Twitter"/></a>
						<a href="http://www.facebook.com/Europeana" style="margin: 0 1%"><img src="image/facebook-link.png" alt="Europeana on Facebook"/></a>
						<h3>Updates &amp; Einblicke:</h3>
						<p><a href="http://blog.europeana.eu" target="_new">http://blog.europeana.eu</a></p>
					</section>
				</div>
			</div>

			<div id="terms-of-use" class="page">
				<div class="page-container">
					<section lang="en">
						<h2>Terms for User Contributions on remix.europeana.eu</h2>
						<p>This document contains the terms applicable to users who contribute content comments to the remix.europeana.eu website maintained by the Europeana Foundation. Please read these terms before contributing to this website. If you do not agree with the policies described below please do not contribute comments to the remix.europeana.eu website.</p>

						<h3>Submitting Comments</h3>
						<p>By contributing comments to remix.europeana.eu you grant Europeana a free, unencumbered, world-wide, non-exclusive license for use, reproduction, distribution, communication and making available to the public of the Content, to the extent that this is necessary for the operation of the remix.europeana.eu website.</p>
						
						<p>By submitting your comment on remix.europeana.eu you also authorize Europeana to publish it on remix.europeana.eu under the terms under the terms of the Creative Commons Attribution-ShareAlike 3.0 License <a href="http://creativecommons.org/licenses/by-sa/3.0/">http://creativecommons.org/licenses/by-sa/3.0/</a>. This means that, when you post a comment on the remix.europeana.eu website, you irrevocably grant third parties the right to freely use that content, as long as they attribute the work to the author and share alterations of that content under the same conditions. For the full terms of the Creative Commons Attribution-ShareAlike 3.0 License see here. <a href="http://creativecommons.org/licenses/by-sa/3.0/">http://creativecommons.org/licenses/by-sa/3.0/</a></p>

						<p>In addition, all comments submitted by you can be made available on europeana.eu under the terms of the Creative Commons CC0 1.0 Universal Public Domain Dedication <a href="http://creativecommons.org/publicdomain/zero/1.0/">http://creativecommons.org/publicdomain/zero/1.0/</a>. This means that you irrevocably grant third parties the right to freely use those comments without any restrictions. For the full terms of the Creative Commons CC0 1.0 Universal Public Domain Dedication see here <a href="http://creativecommons.org/publicdomain/zero/1.0/">http://creativecommons.org/publicdomain/zero/1.0/</a>.</p>

						<h3>Removal of Comments</h3>
						<p>Without being required to give notice or without being liable for compensation, and without prejudice to Europeana&apos;s right to take further legal action, Europeana reserves the right to remove comments contributed by you if it considers there are grounds for doing so, in particular in, but not limited to, cases in which in Europeana&apos;s opinion these comments breaches the provisions of Article 7 Europeana Terms for User Contributions <a href="http://www.europeana1914-1918.eu/en/about/terms">http://www.europeana1914-1918.eu/en/about/terms</a>.</p>

						<p>If you do not agree with these policies please do not contribute to the remix.europeana.eu website.</p>
					</section>
					<section lang="de">
						<h2>Bedingungen für Nutzerbeiträge zu remix.europeana.eu</h2>
						<p>Dieses Dokument enthält die Bedingungen, die für Nutzer gelten, die Kommentare zu Inhalten auf der remix.europeana.eu Webseite der Europeana Foundation beitragen. Bitte lesen Sie diese Bedingungen, bevor Sie einen Beitrag auf diese Webseite laden. Sollten Sie nicht mit den nachfolgend beschriebenen Richtlinien einverstanden sein, dann laden Sie bitte keine Kommentare auf die remix.euroopeana.eu Webseite hoch.</p>

						<h3>Einstellen von Kommentaren</h3>
						<p>Durch das Hochladen von Kommentaren auf remix.europeana.eu gewähren Sie Europeana eine kostenlose, unbelastete, weltweite, nicht exklusive Lizenz für die Nutzung, Reproduktion, Distribution, Kommunikation und Bereitstellung des Inhalts für die Öffentlichkeit in dem Maß, wie es für den Betrieb der remix.europeana.eu Webseite notwendig ist.</p>

						<p>Durch das Einstellen Ihres Kommentars auf remix.europeana.eu ermächtigen Sie Europeana weiterhin, diesen auf remix.europeana.eu gemäß den Bedingungen der Creative Commons Attribution-ShareAlike 3.0 Lizenz  <a href="http://creativecommons.org/licenses/by-sa/3.0/">http://creativecommons.org/licenses/by-sa/3.0/</a> zu veröffentlichen. Das bedeutet, dass wenn Sie einen Kommentar auf die remix.euroopeana.eu Webseite hochladen, Sie unwiderruflich Drittparteien das Recht gewähren, diesen Inhalt frei zu nutzen, solange sie den Beitrag dem Autor zuschreiben und Änderungen dieses Inhalts unter den gleichen Bedingungen kenntlich machen. Die vollständigen Bedingungen der Creative Commons Attribution-ShareAlike 3.0 Lizenz finden Sie hier: <a href="http://creativecommons.org/licenses/by-sa/3.0/">http://creativecommons.org/licenses/by-sa/3.0/</a></p>

						<p>Zusätzlich können alle von Ihnen eingestellten Kommentare auf europeana.eu unter den Bedingungen der Creative Commons CC0 1.0 Universal Public Domain Dedication <a href="http://creativecommons.org/publicdomain/zero/1.0/">http://creativecommons.org/publicdomain/zero/1.0/</a> verfügbar gemacht werden. Das bedeutet, dass Sie unwiderruflich Drittparteien das Recht zur freien Nutzung dieser Kommentare ohne Einschränkung gewähren. Die vollständigen Bedingungen der Creative Commons CC0 1.0 Universal Public Domain Dedication finden Sie hier: <a href="http://creativecommons.org/publicdomain/zero/1.0/">http://creativecommons.org/publicdomain/zero/1.0/</a>.</p>

						<h3>Entfernung von Kommentaren</h3>
						<p>Ohne zu einer Anzeige verpflichtet und ohne für Schadensersatz haftbar zu sein, und unbeschadet des Rechts von Europeana, weitere rechtliche Schritte zu ergreifen, behält sich Europeana das Recht vor, Kommentare, die von Ihnen hochgeladen wurden, zu entfernen, sollte es dafür Gründe geben; insbesondere gilt dies für, ist aber nicht beschränkt auf Fälle, in denen nach Ansicht von Europeana diese Kommentare die Vorgaben des Artikels 7 Europeana Terms for User Contributions [Bedingungen für Nutzerbeiträge] <a href="http://www.europeana1914-1918.eu/en/about/terms">http://www.europeana1914-1918.eu/en/about/terms</a> verletzen.</p>

						<p>Sollten Sie nicht mit diesen Richtlinien einverstanden sein, dann laden Sie bitte keine Kommentare auf die remix.euroopeana.eu Webseite hoch.</p>
					</section>
				</div>
			</div>

			<div id="disclaimer" class="page">
				<div class="page-container">
					<section lang="en">
						<h2>Disclaimer</h2>
						<p>The comments on this website are contributed by individual users of the website and do not in any way reflect the opinion, point of view or official position of the Europeana Foundation and or it&apos;s staff and partners. Comments are placed automatically and Europeana does not review comments before they are published. If you feel that a comment violates the Europeana Terms for User Contributions <a href="http://www.europeana1914-1918.eu/en/about/terms">http://www.europeana1914-1918.eu/en/about/terms</a> please contact us at <a href="mailto:marcomms@europeana.eu">marcomms@europeana.eu</a> and request us to review the comment or comments in question.</p>
					</section>
					<section lang="de">
						<h2>Haftungsausschluss</h2>
						<p>Die Kommentare auf dieser Webseite stammen von einzelnen Nutzern der Webseite und reflektieren auf keine Weise die Meinung, Ansichten oder offizielle Position der Europeana Foundation oder deren Belegschaft oder Partner. Die Kommentare werden automatisch eingestellt und Europeana überprüft die Kommentare nicht vor deren Veröffentlichung. Sollten Sie das Gefühl haben, dass ein Kommentar gegen die Europeana Terms for User Contributions <a href="http://www.europeana1914-1918.eu/en/about/terms/">http://www.europeana1914-1918.eu/en/about/terms/</a> verstößt, kontaktieren Sie uns bitte unter <a href="marcomms@europeana.eu">marcomms@europeana.eu</a> und bitten Sie uns, den fraglichen Kommentar/die Kommentare zu überprüfen.</p>
					</section>
				</div>
			</div>

			<div id="add-comment-controls">
				<div id="add-comment-dialog" class="control-group">
					<div id="add-comment-title"><span id="write-comment-at">Write a comment at:</span> <time id="add-comment-timer" class="time-text">1:04</time></div>
					<div class="control">
						<label for="comment-text" id="comment-text-label">Comment:</label><textarea id="comment-text" placeholder="Required"></textarea>
						<div id="comment-text-letters"><span id="comment-letter-count">150</span> <span id="comment-characters-left">characters left</span></div>
					</div>
					<div class="control"><label for="comment-name" id="comment-name-label">Name:</label><input id="comment-name" type="text" placeholder="Required"/></div>
					<div class="control"><label for="comment-email" id="comment-email-label">Email Address:</label><input id="comment-email" type="text" placeholder="Optional"/><div class="error" id="comment-email-invalid" style="display: none">not valid</div></div>
					<div>
					<!--
						<div class="control button" id="comment-tos-checkbox" style="background-image: none"></div><label id="comment-tos">I agree to terms of use</label>
					-->
						<input type="checkbox" id="comment-tos-checkbox"/> <label id="comment-tos" for="comment-tos-checkbox">I agree to terms of use</label>

						<button id="comment-cancel" class="control disabled">cancel</button>
						<button id="comment-post" class="control disabled">Post My Comment</button>
					</div>
					<div class="bottom-arrow-thingy"> </div>
				</div>
			</div>
			<div id="back-controls" class="control-group">
				<div id="back-button" class="control button">Back to Film</div>
			</div>
			<div id="top-controls" class="control-group fade" style="opacity: 0">
				<div id="about-button" class="control button" style="float: left;">About</div>
				<div id="contact-button" class="control button" style="float: left;">Contact</div>
				<div id="help-button" class="control button" style="float: left;">Help</div>
				<div id="share-button" class="control button" style="float: left;">Share</div>
			</div>

			<div id="share-controls" class="control-group fade" style="display: none">
				<div id="twitter-button" class="control button flat">Twitter<img src="image/share-twitter.png"/></div>
				<div id="facebook-button" class="control button flat">Facebook<img src="image/share-facebook.png"/></div>
			</div>

			<div id="help-controls" class="control-group fade" style="display: none">
				<div id="help-window" class="control button">
					<div id="help-comment-button">Use this Button:</div>
					<p id="help-comment-p">(or just start typing) to leave a comment</p>

					<div id="help-language-button">Use this Button:</div>
					<p id="help-language-p">to change the language/subtitle settings</p>

					<div id="help-settings-button">Use this Button:</div>
					<p id="help-settings-p">to toggle subtitles, related items and comments on or off</p>
				</div>
			</div>

			<div id="bottom-controls" class="fade" style="opacity: 0">
				<div id="volume-controls" class="control-group" style="float: right; display: none"><canvas id="volume-canvas" class="control" height="112" width="17"></canvas></div>
				<div id="settings-controls" class="control-group" style="float: right; display: none">
					<div id="comments-button" class="control button flat"><span id="comments-button-text">User Comments:</span> <span id="comments-toggle" class="toggle on">On</span></div>
					<div id="resources-button" class="control button flat"><span id="resources-button-text">Related Items:</span> <span id="resources-toggle" class="toggle on">On</span></div>
					<div id="subtitles-button" class="control button flat"><span id="subtitles-button-text">Subtitles:</span> <span id="subtitles-toggle" class="toggle on">On</span></div>
					<div id="language-button" class="control button flat"><span id="language-button-text">Language:</span>
						<span id="language-en" class="radio on">English</span>
						<span id="language-de" class="radio">Deutsch</span>
					</div>
					<div class="bottom-arrow-thingy"> </div>
				</div>
				<hr style="clear: both; visibility: hidden;"/>
				<div id="comment-controls" class="control-group" style="float: left">
					<div id="add-comment-button" class="control button"><img src="image/comments.png" width="18" height="18"/></div>
				</div>
				<div id="main-controls" class="control-group">
					<div id="play-button" class="control button" style="float: left;">&nbsp;</div>
					<div id="settings-button" class="control button" style="float: right;"><img src="image/settings.png" width="18" height="18"/></div>
					<div id="volume-button" class="control button" style="float: right;"><img src="image/volume.png" width="46" height="48"/></div>
					<div id="play-timer" class="control time-text button" style="float: right;">01.04 / 06:30</div>
					<canvas id="progress" class="control" height="17" width="420"></canvas>
				</div>
			</div>
		</div>
	</div>
		<footer>
		<!--
		todo: social media widgets here
		-->
			<!-- &copy; 2011 Powered by <a href="http://www.europeana.eu">Europeana</a> -->
			<a href="http://www.europeana.eu"><img src="image/poweredby.png"/></a>
		</footer>

	<script type="text/javascript">
	
	if (!document.body.classList) {
		makeClassList(document.body);
	}
	
	</script>
<?php

if (DEBUG) {
	$scripts = array(
		"js/plugins/popcorn.js",
		"js/plugins/popcorn.html-eu.js",
		"js/plugins/popcorn.subtitle.js",
		"js/plugins/popcorn.europeana.js",
		"js/plugins/popcorn.flickr.js",
		"js/plugins/popcorn.wikipedia.js",
		"js/plugins/popcorn.image.js",
		"js/plugins/popcorn.youtube.js",
		"js/plugins/popcorn.video-comment.js",
		"js/plugins/popcorn.googlemap.js",
		"js/plugins/popcorn.code.js",
		"js/plugins/popcorn.words.js",
		"js/plugins/loaderator.js",
	
		"js/script.js",
	);
} else {
	$scripts = array(
		'js/remix.min.js'
	);
}
foreach ($scripts as $script) {
	$time = filemtime($script);
	//todo: put timestamp before file extension?
	echo "<script src=\"$script?$time\"></script>\n";
}
?>
	<!--[if lt IE 7 ]>
	<script src="js/libs/dd_belatedpng.js"></script>
	<script> DD_belatedPNG.fix('img, .png_bg');</script>
	<![endif]-->
</body>
<script type="text/javascript">

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-25573689-1']);
_gaq.push(['_trackPageview']);
_gaq.push(['_trackSocial', 'facebook', 'send', 'remix.europeana.eu']);
_gaq.push(['_trackSocial', 'twitter', 'tweet', 'remix.europeana.eu']);

(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

</script>
</html>