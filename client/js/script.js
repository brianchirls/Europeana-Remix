(function (window) {

	"use strict";

	var document = window.document,
		Popcorn = window.Popcorn,
		background = document.getElementById('background'),
		footer = document.getElementsByTagName('footer')[0],
		videoFrame = document.getElementById('video-frame'),
		video = document.getElementById('video'),
		timer = document.getElementById('play-timer'),
		commentTimer = document.getElementById('add-comment-timer'),
		progress = document.getElementById('progress'),
		volume = document.getElementById('volume-canvas'),
		volumeCtx, //todo: error check
		progressCtx, //todo: error check
		intro = document.getElementById('intro'),
		logo = document.getElementById('eu-logo'),
		pageBackground,
		twitterWindow,
		facebookWindow,
		popcorn,
		videoStartTime = 0, paused = false, muted = false,

		//email validation from http://www.regular-expressions.info/email.html
		emailRegex = new RegExp("^[a-z0-9!#$%&'*+\\/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+\\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+(?:[A-Z]{2}|aero|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|xxx)$", 'i'),

		/* shim from http://paulirish.com/2011/requestanimationframe-for-smart-animating/ */
		requestAnimFrame = (function () {
			return window.requestAnimationFrame    || 
				window.webkitRequestAnimationFrame || 
				window.mozRequestAnimationFrame    || 
				window.oRequestAnimationFrame      || 
				window.msRequestAnimationFrame     || 
				function (/* function */ callback, /* DOMElement */ element) {
					window.setTimeout(callback, 16);
				};
		}()),
	
		/* refresh state variables */
		lastProgressTime, lastPlayerState, lastInteractionTime = 0, lastCommentUpdate = {},
		winWidth, winHeight, frameWidth, bgOpacity,
		activePage, targetPage,
		popUpsVisible = false,
		lastCommentTime = -10,
		lastMousePosition = {}, mousePosition = {}, resized = true,
		
		/* control state variables */
		videoEnabled = true,
		extrasEnabled = {
			comments: true,
			resources: true,
			subtitles: true
		},
		played = false,
		commentDialogActive = false, commentTermsChecked = false,
		commentData = {}, resourceTypes = [],
		language,
		controlText = {
			'#title': { en: 'A First World War friendship – an interactive HTML5 video by Europeana', de: 'Eine Erste Weltkrieg Freundschaft - ein interaktiver HTML5 Video von Europeana' },
			'#about-button': { en: 'About', de: 'über uns' },
			'#contact-button': { en: 'Contact', de: 'kontakt' },
			'#share-button': { en: 'Share', de: 'teilen' },
			'#comments-button-text': { en: 'User Comments:', de: 'User-Kommentare:' },
			'#resources-button-text': { en: 'Related Items:', de: 'relatierte Artikel:' },
			'#subtitles-button-text': { en: 'Subtitles:', de: 'Untertitel' },
			'#language-button-text': { en: 'Language:', de: 'Sprache:' },
			'#back-button': { en: 'Back to film', de: 'Zurück zum Film' },
			
			'.popcorn-source': { en: 'source', de: 'Quelle' },

			'#write-comment-at': { en: 'Write a comment at:', de: 'Schreib einen Kommentar zu:' },
			'#comment-email-label': { en: 'Email Address:', de: 'E-Mail-Adresse:' },
			'#comment-text-label': { en: 'Comment:', de: 'Kommentar:' },
			'#comment-tos': { en: 'I agree to terms of use', de: 'Ich stimme den Nutzungsbedingungen zu' },
			'#comment-post': { en: 'Post My Comment', de: 'absenden' },
			'#comment-characters-left': { en: 'characters left', de: 'Zeichen übrig' },
			'#comment-email-invalid': { en: 'not valid', de: 'nicht gültig' },
			'#comment-cancel': { en: 'cancel', de: 'Abbrechen' },

			'#help-button': { en: 'Help', de: 'Hilfe' },
			'#help-window > div': { en: 'Use this button:', de: 'Diese taste drücken:' },

			'#help-comment-p': { en: '(or just start typing) to leave a comment', de: 'um einen Kommentar zu schreiben (oder fangen Sie einfach mit schreiben an)' },
			'#help-language-p': { en: 'to change the language/subtitle settings', de: 'Um die Sprache Untertitel-Einstellungen zu ändern' },
			'#help-settings-p': { en: 'to toggle subtitles, related items and comments on or off', de: 'um Untertitel, verwandte Artikel und Kommentare ein-oder auszuschalten' },
			
			'#intro-caption': { en: 'An interactive experience around the story of an unlikely friendship during the First World War.', de: 'Ein interaktives Erlebnis rund um die Geschichte einer ungewöhnlichen Freundschaft während des Ersten Weltkriegs.' },

			'#no-video-browsers': { en: 'Please be aware that for optimal performance, these browsers are recommended:', de: 'Bitte beachten Sie, dass für eine optimale Leistung die folgenden Browser empfohlen sind:' },
			'#no-video-continue-text': { en: "Click 'Continue' for the video without the interactive components.", de: "Klicken Sie auf 'Weiter’ für das Video ohne die interaktiven Komponenten." },
			'#no-video-continue': { en: 'Continue', de: 'Weiter' },
			
			'#end-title': { en: 'Like this story?\nHelp us build the next', de: 'Gefällt Ihnen diese Geschichte?\nHelfen Sie uns beim Aufbau der nächsten!' },
			'#end-caption': { en: 'Europeana wants to hear your family story about World War 1. Share your photos, letters and other memorabilia.', de: 'Europeana will Ihre Familiengeschichte über den 1. Weltkrieg gerne hören. Teilen Sie Ihre Fotos, Briefe und andere Erinnerungsstücke.' },
			'#play-again': { en: 'Play Again', de: 'wiederholen' },
			'#add-archive': { en: 'Add to the Archive', de: 'Mitmachen' },
			'#explore-archive': { en: 'Explore the Archive', de: 'Ansehen' },

			'shareTwitter': { en: 'Europeana Remix: an interactive video about an unlikely friendship in WW1 http://remix.europeana.eu #europeana', de: 'Europeana Remix: ein interaktives Video über eine ungewöhnliche Freundschaft in den 1. WK http://remix.europeana.eu #europeana' },
			'shareFacebook': { en: 'Europeana Remix: an interactive video about an unlikely friendship in WW1', de: 'Europeana Remix: ein interaktives Video über eine ungewöhnliche Freundschaft in den 1. WK' }
			
		},
	
		/* layout data structures */
		controlWidths = {},
		fadeElements = [],
		loadingPatternFrames,
		
		/* constants */
		INTRO_FADE_TIME = 1.5,
		VIDEO_WIDTH = 1024,
		VIDEO_HEIGHT = 576;

	/* utility function(s) */

	// http://blog.stevenlevithan.com/archives/faster-trim-javascript#comment-28776
	function trim(str) {
		var i, j, whitespace = " \n\r\t\f";
		for (i = 0; i < str.length; i++) {
			if (whitespace.indexOf(str.charAt(i)) < 0) {
				break;
			}
		}
	
		for (j = str.length - 1; j >= i; j-- ) {
			if (whitespace.indexOf(str.charAt(j)) < 0) {
				break;
			}
		}
	
		return str.substring(i, j+1);
	}

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
	
	function animateCss(element, steps, duration, callback) {
		var i, max, step,
		tProps = [], tVals = [], properties,
		tUnits = [], val, re,
		start = Date.now(),
		endFunction,
		animLoop;

		if (typeof element === 'string') {
			element = document.getElementById(element);
		}
		if (!element) { return; }

		if (Modernizr.cssanimations) {
			element.style.MozTransitionProperty = '';
			element.style.webkitTransitionProperty = '';
			element.style.oTransitionProperty = '';
			element.style.transitionProperty = '';
			for (i in steps) {
				step = steps[i];
				tProps.push(i);
				if (step.from !== undefined) {
					element.style[i] = step.from;
				}
				tVals.push(step.to);
			}
			properties = tProps.join(',');
			setTimeout(function() {
				element.style.MozTransitionProperty = properties;
				element.style.webkitTransitionProperty = properties;
				element.style.oTransitionProperty = properties;
				element.style.transitionProperty = properties;
	
				element.style.MozTransitionDuration = duration + 's';
				element.style.webkitTransitionDuration = duration + 's';
				element.style.oTransitionDuration = duration + 's';
				element.style.transitionDuration = duration + 's';
	
				if (callback) {
					endFunction = function() {
						callback();
						element.removeEventListener('transitionend', endFunction, true);
						element.removeEventListener('webkitTransitionEnd', endFunction, true);
						element.removeEventListener('oTransitionEnd', endFunction, true);
					};
					element.addEventListener('transitionend', endFunction, true);
					element.addEventListener('webkitTransitionEnd', endFunction, true);
					element.addEventListener('oTransitionEnd', endFunction, true);
				}
	
				for (i = 0; i < tProps.length; i++) {
					element.style[tProps[i]] = tVals[i];
				}
			}, 0);			
		} else {
			re = /(\d*(\.\d*)?)\s*(px|em|\%|em|rem)?/;
			for (i in steps) {
				step = steps[i];
				properties = re.exec(step.from);
				if (properties && properties.length > 1 && properties[1]) {
					tProps.push({
						prop: i,
						from: parseFloat(properties[1]),
						to: parseFloat(step.to),
						unit: properties[3]
					});
					element.style[i] = step.from;
				}
			}
			animLoop = function () {
				var diff = (Date.now() - start) / 1000;
				var fraction = Math.min(diff / duration, 1);
				var i, max, step;
				for (i = 0, max = tProps.length; i < max; i++) {
					step = tProps[i];
					element.style[step.prop] = step.from + fraction * (step.to - step.from) + (step.unit || '');
				}

				if (diff < duration) {
					requestAnimFrame(animLoop, element);
				} else if (callback) {
					callback();
				}
			};
			animLoop();
		}
	}

	function applyMouseTouchHandlers(element, down, move, up) {
		element.onmousedown = function(e) {
			if (down) {
				if (down(e || window.event) && e.preventDefault) {
					e.preventDefault();
				} else {
					return;
				}
			}
			if (move) {
				document.onmousemove = function(e) {
					move(e || window.event);
				};
			}
			document.onmouseup = function(e) {
				if (up) {
					up(e || window.event);
				}
				document.onmousemove = null;
				document.onmouseup = null;
			};
		};
		
		element.ontouchstart = function(e) {
			if (e.preventDefault) { e.preventDefault(); }
			element.onmousedown = null;
		
			if (down) {
				down(e.touches[0] || window.event);
			}
		
			if (move) {
				document.ontouchmove = function(e) {
					move(e.touches[0] || window.event);
					return false;
				};
			}
			document.ontouchend = function(e) {
				//up(e.touches[0]);
				if (up) {
					up();
				}
				document.ontouchmove = null;
				document.ontouchend = null;
			};
		
		};
	}
	
	function getMousePosition(event) {
		var posx; // = 0;
		var posy; // = 0;
		//if (!e) var e = window.event;
		if (event) {
			if (event.pageX !== undefined || event.pageY !== undefined) {
				posx = event.pageX;
				posy = event.pageY;
			} else if (event.clientX !== undefined || event.clientY !== undefined) {
				posx = event.clientX + document.body.scrollLeft
					+ document.documentElement.scrollLeft;
				posy = event.clientY + document.body.scrollTop
					+ document.documentElement.scrollTop;
			}
			// posx and posy contain the mouse position relative to the document
		}
		
		return {
			x: posx,
			y: posy
		};
	}
	
	function offsetMousePosition(pos, element) {
		var parent = element;
		pos.x -= element.clientLeft + element.offsetLeft;
		pos.y -= element.clientTop + element.offsetTop;
		while ((parent = parent.offsetParent) && parent.nodeName !== 'BODY') {
			pos.x -= parent.clientLeft + parent.offsetLeft;
			pos.y -= parent.clientTop + parent.offsetTop;
		}
	}
	/* drawing and layout update functions */

	function drawVolumeControl() {
		if (!volumeCtx) {
			return;
		}
	
		var drawHeight = volume.height - 17;
		var drawPosition = drawHeight * (1 - video.volume);
	
		var ctx = volumeCtx;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.shadowBlur = 0;

		ctx.clearRect(0, 0, volume.width, volume.height);
		ctx.lineWidth = 7;
		ctx.lineCap = 'round';

		//draw background gradient
		var gradient = ctx.createLinearGradient(0, 0, 7, 0);
		gradient.addColorStop(0, 'rgba(112, 112, 112, 0.38)');
		gradient.addColorStop(1, 'rgba(241, 241, 241, 0.38)');
		ctx.strokeStyle = gradient;
		ctx.beginPath();
		ctx.moveTo(8.5, 8.5);
		ctx.lineTo(8.5, drawHeight + 8.5);
		ctx.stroke();
		
		drawPosition += 8.5;
		ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
		ctx.beginPath();
		ctx.moveTo(8.5, 8.5);
		ctx.lineTo(8.5, drawPosition);
		ctx.stroke();

		/* draw volume marker */
		var radius = 8.5;
		var diameter = radius * 2;
		ctx.beginPath();
		ctx.lineWidth = 1;

		ctx.strokeStyle = 'rgb(96, 96, 96)';
		ctx.fillStyle = 'rgb(128, 128, 128)';

		ctx.shadowOffsetX = 1;
		ctx.shadowOffsetY = 2;
		ctx.shadowBlur = 5;
		ctx.shadowColor = "rgba(0, 0, 0, 0.19)";

		ctx.arc(8.5, drawPosition, radius, 0, Math.PI * 2, true);
		ctx.fill();

		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.shadowBlur = 0;

		ctx.beginPath();
		ctx.fillStyle = '#02fdca';
		ctx.arc(8.5, drawPosition, 3.5, 0, Math.PI * 2, true);
		ctx.fill();
	}
	
	function drawProgressBar(force) {
		if (!video.duration || !progressCtx) {
			return;
		}
		
		if (!force && lastProgressTime === video.currentTime && video.networkState >= 4) {
			return;
		}
		
		var drawWidth = progress.width - 17;
		var playPosition = drawWidth * video.currentTime / video.duration;
	
		var ctx = progressCtx;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.shadowBlur = 0;

		ctx.clearRect(0, 0, progress.width, progress.height);
		ctx.lineWidth = 7;
		ctx.lineCap = 'round';

		//draw background gradient
		var gradient = ctx.createLinearGradient(0, 0, 0, 7);
		gradient.addColorStop(0, 'rgba(112, 112, 112, 0.38)');
		gradient.addColorStop(1, 'rgba(241, 241, 241, 0.38)');
		ctx.strokeStyle = gradient;
		ctx.beginPath();
		ctx.moveTo(8.5, 8.5);
		ctx.lineTo(drawWidth + 8.5, 8.5);
		ctx.stroke();
		
		var unloaded = [];
		var i, max, end, buffered = video.buffered;
		var start = 0;
		if (buffered) {
			for (i = 0, max = buffered.length; i < max; i++) {
				end = buffered.start(i);
				//fix stupid Firefox bug
				if (end > video.duration) {
					end = 0;
				}
				if (end !== start) {
					unloaded.push({
						start: start,
						end: end
					});
				}
				start = buffered.end(i);
			}
			if (start !== video.duration) {
				unloaded.push({
					start: start,
					end: video.duration
				});
			}
		}

		if (loadingPatternFrames) {
			//animate loading pattern, but not if we skipped around 'cause that's annoying
			if (start === video.duration) {
				i = 0;
			} else {
				i = Math.floor(Date.now() / 40) % 8;
			}
			ctx.strokeStyle = loadingPatternFrames[i];
			for (i = 0, max = unloaded.length; i < max; i++) {
				start = unloaded[i].start / video.duration * drawWidth;
				end = unloaded[i].end / video.duration * drawWidth;
				ctx.beginPath();
				ctx.moveTo(start + 8.5, 8.5);
				ctx.lineTo(end + 8.5, 8.5);
				ctx.stroke();
			}
		}
		
		playPosition += 8.5;
		ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
		ctx.beginPath();
		ctx.moveTo(8.5, 8.5);
		ctx.lineTo(playPosition, 8.5);
		ctx.stroke();

		/* draw play position marker */
		var pos = {
			x: mousePosition.x,
			y: mousePosition.y
		};
		offsetMousePosition(pos, progress);
		var dist = Math.sqrt(Math.pow(pos.x - playPosition, 2) + Math.pow(pos.y - 8.5, 2)) - 20;
		dist = Math.max(0, dist);
		if (dist < 100) {
			var radius = 8.5 * (1 - dist / 100);
			var diameter = radius * 2;
			if (diameter > 7) {
				ctx.beginPath();
				ctx.lineWidth = 1;

				ctx.fillStyle = 'rgb(128, 128, 128)';

				ctx.shadowOffsetX = 1;
				ctx.shadowOffsetY = 2;
				ctx.shadowBlur = 5;
				ctx.shadowColor = "rgba(0, 0, 0, 0.19)";

				ctx.arc(playPosition, 8.5, radius, 0, Math.PI * 2, true);
				ctx.fill();

				ctx.shadowOffsetX = 0;
				ctx.shadowOffsetY = 0;
				ctx.shadowBlur = 0;
			}
		}

		ctx.beginPath();
		ctx.fillStyle = '#02fdca';
		ctx.arc(playPosition, 8.5, 3.5, 0, Math.PI * 2, true);
		ctx.fill();
	}

	function resize(force) {
		var wWidth = window.innerWidth || 800;
		var wHeight = window.innerHeight || wWidth * 9/16;
		
		if (force || ( (wWidth !== winWidth || wHeight !== winHeight) /* && video.videoHeight */ ) || !progress.width) {
			resized = true;
			winWidth = wWidth;
			winHeight = wHeight;
			var wAspect = wWidth / wHeight;
			//normally, we'd get video dimensions from the element, but we know what they are in advance,
			//so no point in waiting for it to load up. Anyway, only the aspect ratio matters
//			var vAspect = video.videoWidth / video.videoHeight;
			var vAspect = VIDEO_WIDTH / VIDEO_HEIGHT;
			var aspectCompare = vAspect / wAspect;
			
			var top, left, width, height, scale, opacity;
			
			if (aspectCompare > 1.2) {
				//window is very tall, treat it like a webpage
				opacity = Math.min(1, (aspectCompare - 1.2) / 0.25);
				left = Math.min(opacity * 30, Math.max(wWidth - 640, 0) * 0.1);
				width = Math.floor(wWidth - left * 2);
				scale = width / VIDEO_WIDTH;
				height = Math.floor(VIDEO_HEIGHT * scale);
				top = (wHeight * 1.2 / aspectCompare - height) / 2;
			} else if (aspectCompare < 1 / 1.05) {
				//window is very wide
				opacity = Math.min(1, (1/1.05 - aspectCompare) / 0.2);
				top =  Math.min(opacity * 40, Math.max(wWidth - 360, 0) * 0.1);
				height = Math.floor(wHeight - top * 2);
				scale = height / VIDEO_HEIGHT;
				width = Math.floor(VIDEO_WIDTH * scale);
				left = (wWidth * aspectCompare / (1/1.05) - width) / 2;
			} else {
				scale = Math.min(wHeight / VIDEO_HEIGHT, wWidth / VIDEO_WIDTH);
				width = Math.floor(VIDEO_WIDTH * scale);
				height = Math.floor(VIDEO_HEIGHT * scale);
				left = (wWidth - width) / 2;
				top = (wHeight - height) / 2;
				opacity = 0;
			}
			
			if (width < 640) {
				document.body.style.overflow = 'auto';
			} else {
				document.body.style.overflow = '';
			}

			/*			
			if (bgOpacity !== opacity) {
				if (opacity > 0) {
					if (background.style.display !== 'block') {
						background.style.display = 'block';
					}
					background.style.opacity = opacity;

					if (footer.style.display !== 'block') {
						footer.style.display = 'block';
					}
					footer.style.opacity = opacity;
				} else {
					background.style.display = 'none';
					footer.style.display = 'none';
				}
				bgOpacity = opacity;
			}

			document.body.style.fontSize = Math.round(scale * 8) + 'px';

			videoFrame.style.width = width + 'px';
			videoFrame.style.height = height + 'px';
			videoFrame.style.marginLeft = left + 'px';
			videoFrame.style.marginTop = top + 'px';
			*/
			
			if (force || frameWidth !== width) {
				frameWidth = width;
				
				var mainControls = progress.parentNode;
				var progressWidth = mainControls.offsetWidth;
				var i, max, node;
				for (i = 0, max = mainControls.childNodes.length; i < max; i++) {
					node = mainControls.childNodes[i];
					if (node.tagName && node !== progress) {
						//cache control widths so we don't have to reflow here. these should not change
						if (controlWidths[node.id] === undefined && node.offsetWidth > 0) {
							controlWidths[node.id] = node.offsetWidth + 6;
						}
						progressWidth -= controlWidths[node.id];
					}
				}
				progress.width = progressWidth - 6;
	
				//redraw progress bar
				drawProgressBar(true);
			}
		}
		lastInteractionTime = Date.now();
	}

	function setControlsOpacity(pagePos) {
		//set opacity of fading control elements based on mouse position
		
		if (!played) {
			return;
		}
		
		var cutoff = 0.4 * videoFrame.offsetWidth;
		var opacityFactor = Math.max(0, 1 - (Date.now() - lastInteractionTime) / 5000);
		var i, max, pos, element, width, height, dx, dy, distance, opacity;
		for (i = 0, max = fadeElements.length; i < max; i++) {
			element = fadeElements[i];
			width = element.offsetWidth;
			height = element.offsetHeight;

			//calculate mouse position in terms of this element
			pos = {
				x: pagePos.x,
				y: pagePos.y
			};
			offsetMousePosition(pos, element);
			
			if (pos.x < 0) {
				dx = -pos.x;
			} else if (pos.x > width) {
				dx = pos.x - width;
			} else {
				dx = 0;
			}

			if (pos.y < 0) {
				dy = -pos.y;
			} else if (pos.y > height) {
				dy = pos.y - height;
			} else {
				dy = 0;
			}
			
			distance = Math.sqrt(dx * dx + dy * dy);
			opacity = 1 - 0.8 * (distance / cutoff) ;
			if (opacity < 0.2) {
				opacity = 0.2;
			} else if (opacity > 1) {
				opacity = 1;
			}
			element.style.opacity = opacityFactor * opacity;
		}		
	}

	function hideAllControls(event) {
		if (!popUpsVisible) {
			return;
		}

		if (event && event.target && (
			event.target !== event.currentTarget ||
			event.target.classList.contains('button')
		)) {
			return;
		}
		document.getElementById('volume-controls').style.display = 'none';
		document.getElementById('settings-controls').style.display = 'none';
		document.getElementById('help-controls').style.display = 'none';
		document.getElementById('share-controls').style.display = 'none';
		
		popUpsVisible = false;
	}
	
	function validateCommentForm(event) {
		var name = document.getElementById('comment-name'),
			email = document.getElementById('comment-email'),
			comment = document.getElementById('comment-text'),
			button =  document.getElementById('comment-post'),
			
			email_val = trim(email.value),
			
			letterCounter, emailValid,
			
			valid = true;
		
		//validate name
		valid = valid && name.value.length;
		
		//validate email
		emailValid = !email_val.length || emailRegex.test(email_val);
		if (event && event.target === email) {
			if (emailValid) {
				document.getElementById('comment-email-invalid').style.display = 'none';
				email.classList.remove('error');
			} else {
				document.getElementById('comment-email-invalid').style.display = 'block';
				email.classList.add('error');
			}
		}
		valid = valid & emailValid;
		
		//validate comment text
		if (comment.value.length > 150) {
			if (event && event.target === comment) {
				letterCounter = document.getElementById('comment-letter-count');
				letterCounter.innerHTML = 150 - comment.value.length;
				letterCounter.classList.add('error');
			}
		} else if (event && event.target === comment) {
			letterCounter = document.getElementById('comment-letter-count');
			letterCounter.innerHTML = 150 - comment.value.length;
			letterCounter.classList.remove('error');
		}
		
		valid = valid && (comment.value.length <= 150);

		valid = valid && commentTermsChecked;

		if (valid) {
			button.classList.remove('disabled');
		} else {
			button.classList.add('disabled');
		}

		return valid;
	}

	function updateVideoPlayer() {
		if (!played) {
			requestAnimFrame(updateVideoPlayer, videoFrame);
			return;
		}

		var diff = Date.now() - lastInteractionTime;
		drawProgressBar(diff <= 100);

		//auto-hide control pop-ups if we've been idle for too long
		//todo: optimize this
		if (popUpsVisible && diff > 5000) {
			hideAllControls();
		}
		
		//todo: download comments every so often

		var i, max;
		if (video.paused || video.ended) {
			if (lastPlayerState !== (video.paused || video.ended)) {
				for (i = 0, max = fadeElements.length; i < max; i++) {
					fadeElements[i].style.opacity = 1;
				}
			}
		} else if (/*resized || */ diff <= 5000) { //lastMousePosition.x !== mousePosition.x || lastMousePosition.y !== mousePosition.y || 
			setControlsOpacity(mousePosition);
			lastMousePosition = mousePosition;
		}
		lastPlayerState = video.paused || video.ended;

		//update timer display
		
		var currentTimeText, timerText;
		if (video.duration) {
			currentTimeText = timeToText(video.currentTime);
			timerText = currentTimeText + ' / ' + timeToText(video.duration);
		} else {
			currentTimeText = '-:--';
			timerText = '-:-- / -:--';
		}
		
		//only update if we need to, to avoid unnecessary page redraws/reflows
		if (timer.innerHTML !== timerText) {
			timer.innerHTML = timerText;
		}
		if (commentDialogActive && commentTimer.innerHTML !== currentTimeText) {
			commentTimer.innerHTML = currentTimeText;
		}

		requestAnimFrame(updateVideoPlayer, videoFrame);
	}

	/*
	 * Player Interaction functions
	 *
	 */
	 
	function toggleVideo() {
		if (video.paused) {			
			video.play();
		} else if (video.ended) {
			video.currentTime = 0;
			video.play();
		} else {
			video.pause();
		}
	}

	function updateSetting(setting) {
		/*
		this code assumes only two languages. will need to come up with something fancier
		if we ever want to support more than two
		*/
		
		var toggle = document.getElementById(setting + '-toggle');
		if (!toggle) {
			return;
		}
		if ( extrasEnabled[ setting ] ) {
			toggle.innerHTML = (language === 'de' ? 'ein' : 'On');
			toggle.classList.add('on');
		} else {
			toggle.innerHTML = (language === 'de' ? 'aus' : 'Off');
			toggle.classList.remove('on');
		}
	}

	function loadCommentData() {
		function flagComment(id, unflag) {
			var url = 'comments.php?' + (unflag ? 'unflag' : 'flag') + '=' + id;
			var req = new XMLHttpRequest();
			req.open('GET', url, true);
			req.send(null);
		}
		
		if (!language) {
			return;
		}
		
		var url = 'comments.php?vtime=' + (video.currentTime || 0) + '&language=' + language;
		
		if (lastCommentUpdate[language]) {
			//no matter what, don't update comments more often than five seconds
			if (Date.now() - lastCommentUpdate[language] < 5000) {
				return;
			}
			url += '&since=' + (lastCommentUpdate[language] / 1000);
		}
		
		var req = new XMLHttpRequest();
		req.open('GET', url, true);
		req.onreadystatechange = function (aEvt) {
			if (req.readyState === 4) {
				if(req.status === 200) {
					var newCommentData = JSON.parse(req.responseText);
					var i, max, comment;
					for (i = 0, max = newCommentData.length; i < max; i++) {
						comment = newCommentData[i];
						//don't add any duplicates
						if (comment && !commentData[comment[0]]) {
							commentData[comment[0]] = comment;
							popcorn.videoComment({
								start: comment[2],
								end: comment[2] + 5,
								id: comment[0],
								author: comment[4],
								text: comment[5],
								date: comment[1] * 1000,
								language: comment[3],
								target: 'comments',
								flagCallback: flagComment
							});

						}
					}
				}
			}
		};
		req.send(null);
		lastCommentUpdate[language] = Date.now();
	}

	function updateLanguage(noServerUpdate) {
		if (!noServerUpdate && videoEnabled) {
			loadCommentData();
		}
		
		document.documentElement.setAttribute('lang', language);
	
		//update language controls
		var radio, i, languages = ['en', 'de'];
		for (i = 0; i < languages.length; i++) {
			radio = document.getElementById('language-' + languages[i]);
			if (languages[i] === language) {
				radio.classList.add('on');
			} else {
				radio.classList.remove('on');
			}
		}

		//update button text
		var elements, element, text, j, k, max_j, max_k;
		for (i in controlText) {
			if (controlText.hasOwnProperty(i)) {
				try {
					elements = document.querySelectorAll(i);
				} catch (e) {
					//this should only happen with ie7/8, so we don't need to be too thorough here
					elements = document.getElementById(i.substr(1));
					if (elements) {
						elements = [elements];
					} else {
						elements = [];
					}
				}
				text = (controlText[i][language] || '').split('\n');
				for (k = 0, max_k = elements.length; k < max_k; k++) {
					element = elements[k];
					if (element && text.length && text[0].length) {
						//element.innerHTML = '';
						while (element.firstChild) {
							element.removeChild(element.firstChild);
						}

						try {
							element.appendChild(document.createTextNode(text[0]));
							for (j = 1; j < text.length; j++) {
								element.appendChild(document.createElement('br'));
								element.appendChild(document.createTextNode(text[j]));
							}
						} catch (e) {
							//stupid IE 7/8 bug
							if (i === '#title') {
								document.title = text.join(' ');
							}
						}
					}
				}
			}
		}

		//update comment dialog box
		if (commentDialogActive) {
			//properly size all the input elements - CSS doesn't make this easy for us
			//do this again when language changes
			var ids = [
				'comment-email',
				'comment-name',
				'comment-text'
			],
			widths = [];
			elements = [];

			for (i = 0; i < ids.length; i++) {
				elements.push(document.getElementById(ids[i]));
				widths.push(elements[i].previousSibling.offsetWidth);
			}
			for (i = 0; i < ids.length; i++) {
				elements[i].style.paddingLeft = widths[i] + 'px';
			}
		}
		
		//update on/off values
		updateSetting('comments');
		updateSetting('subtitles');
		updateSetting('resources');
		
		//update subtitles
		if (popcorn && popcorn.updateSubtitleLanguage) {
			popcorn.updateSubtitleLanguage();
		}
	}
	
	function showCommentDialog() {
		commentDialogActive = true;
		video.pause();
		
		//If user already started typing a comment, keep it, unless we're at a very different part of the video. Ten seconds ought to do it.
		
		if (Math.abs(lastCommentTime - video.currentTime) > 10) {
			document.getElementById('comment-text').value = '';
		}

		var currentTimeText;
		if (video.duration) {
			currentTimeText = timeToText(video.currentTime);
		} else {
			currentTimeText = '-:--';
		}
		
		//only update if we need to, to avoid unnecessary page redraws/reflows
		if (commentDialogActive && commentTimer.innerHTML !== currentTimeText) {
			commentTimer.innerHTML = currentTimeText;
		}

		document.getElementById('add-comment-controls').style.display = 'block';

		updateLanguage(true);					
	}
	
	function keyPress(event) {
		if (event.altKey || event.altGraphKey || event.metaKey) {
			return;
		}
	
		//todo: make sure focus is in the right place. i.e., on the video window, document/body or play button
		
		lastInteractionTime = Date.now();			

		if (commentDialogActive) {
			//validateCommentForm(event);
			return;
		}
		
		var key = event.keyCode || event.which;

		//letters
		if ( (key >= 65 && key <= 90) || (key >= 97 && key <= 122) ||
			//very rough approximation of unicode letters
			//http://en.wikipedia.org/wiki/Unicode#Standardized_subsets
			(key >= 0x0100 && key <= 0x0292) ||
			(key >= 0x0374 && key <= 0x1FFF)
			) {
			event.preventDefault();
			showCommentDialog();
			var commentField = document.getElementById('comment-text');
			commentField.value = String.fromCharCode(key);
			commentField.setSelectionRange(commentField.value.length, commentField.value.length);
			commentField.focus();
			validateCommentForm();
			return;
		}
		
		if (key === 32) {
			toggleVideo();
			event.preventDefault();
		}
		lastInteractionTime = Date.now();
	}

	function saveLanguage() {
		var req = new XMLHttpRequest();
		req.open('GET', 'save.php?language=' + language, true);
		/*
		req.onreadystatechange = function (aEvt) {
			if (req.readyState === 4) {
				if(req.status === 200) {
					console.log(req.responseText);
				} else {
					console.log('error saving language settings');
				}
			}
		};
		*/
		req.send(null);
	}
	
	function showHidePage(page) {
		var youTubeFrame;

		if (page === activePage) {
			return;
		}
		
		if (videoEnabled) {
			video.pause();
			hideAllControls();
		} else {
			youTubeFrame = document.getElementById('youtube-container');
			if (video && video.pauseVideo) {
				video.pauseVideo();
			}
		}
		
		window.location.hash = page || '';

		if (activePage) {
			document.getElementById(activePage).style.display = 'none';
		}
		if (page) {
			if (youTubeFrame) {
				youTubeFrame.style.display = 'none';
			}
		
			if (!activePage) {
				document.getElementById('back-controls').style.display = 'block';
				document.getElementById('bottom-controls').style.display = 'none';
				if (pageBackground) {
					pageBackground.style.display = 'block';
				}
	
				
			}
			document.getElementById(page).style.display = 'block';
			
			logo.style.zIndex = '1500';
			
			activePage = page;
			
			return;
		}
		
		activePage = false;

		if (!activePage) {
			if (video.currentTime > INTRO_FADE_TIME) {
				logo.style.zIndex = '';
			}
			document.getElementById('back-controls').style.display = '';
			document.getElementById('bottom-controls').style.display = '';
			if (pageBackground) {
				pageBackground.style.display = '';
			}

			if (youTubeFrame) {
				youTubeFrame.style.display = '';
			}
		}
	}

	/* initialization functions */

	function setUpLayoutData() {
		var i;
		
		/* set up loading progress animation frames */
		var progressPattern = new Image();
		progressPattern.onload = function () {
			loadingPatternFrames = []; //[progressCtx.createPattern(progressPattern, 'repeat')];
			var tempCanvas = document.createElement('canvas');
			tempCanvas.height = 7;
			tempCanvas.width = 8;
			var ctx = tempCanvas.getContext('2d');
			for (i = 0; i < 8; i++) {
				ctx.clearRect(0, 0, 8, 7);
				ctx.drawImage(progressPattern, -i, 0);
				ctx.drawImage(progressPattern, 8 - i, 0);
				loadingPatternFrames.push(progressCtx.createPattern(tempCanvas, 'repeat'));
			}
			
		};
		progressPattern.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAHCAYAAAA1WQxeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAExJREFUeNpi/P//fzADA4MwAwLcAuIDUDYbE5DYDMRvkRSoAbEDlP0LpOAXPkWMQCtggmxA7ItuHRNUNQMuk5igRuFUxASlcSoCCDAA+ZwYM8U0vFEAAAAASUVORK5CYII=';
		
		var e = document.getElementsByClassName('fade');
		for (i = 0; i < e.length; i++) {
			fadeElements.push(e.item(i));
		}
	}

	//set up progress bar shuttling
	function setUpProgressBar() {
		var shuttlePaused = true;
		function mouseShuttle(event) {
			//ignore right-click
			var rightClick;
			if (event.which) {
				rightClick = (event.which === 3);
			} else if (event.button) {
				rightClick = (event.button === 2);
			}
			if (rightClick) {
				return false;
			}
			
			hideAllControls();
		
			shuttlePaused = shuttlePaused && video.paused;

			var pos = getMousePosition(event);
			offsetMousePosition(pos, progress);
			var t = (pos.x - 8.5) / (progress.offsetWidth - 17);
			if (t >= 0 && t <= 1) {
				t *= video.duration;
				popcorn.currentTime(t);
			}
			video.pause();

			return true;
		}
		applyMouseTouchHandlers(progress, mouseShuttle, mouseShuttle, function () {
			if (!shuttlePaused) {
				video.play();
				shuttlePaused = true;
			}
		});
	}
	
	//set up volume control interaction
	function setUpVolumeBar() {
		var shuttlePaused = true;
		function mouseShuttle(event) {
			//ignore right-click
			var rightClick;
			if (event.which) {
				rightClick = (event.which === 3);
			} else if (event.button) {
				rightClick = (event.button === 2);
			}
			if (rightClick) {
				return false;
			}
		
			var pos = getMousePosition(event);
			offsetMousePosition(pos, volume);
			var v = 1 - (pos.y - 8.5) / (volume.offsetHeight - 17);
			if (v >= 0 && v <= 1) {
				video.volume = v;
			}

			return true;
		}
		applyMouseTouchHandlers(volume, mouseShuttle, mouseShuttle, null);
	}

	function loadedMetaData() {
		if (videoStartTime > video.duration) {
			videoStartTime = video.duration;
		}
		
		if (videoStartTime) {
			video.currentTime = videoStartTime;
			if (!paused) {
				video.play();
			}
			played = true;
		}
		
		if (muted) {
			video.muted = true;
		}
	
		setUpProgressBar();

		updateVideoPlayer();
	}

	//scan location hash for page or video time to display
	function parseTarget() {
		var p, page, path, i, foundTime = false;
		path = window.location.pathname.split('/');
		path = path.concat(window.location.hash.substr(1).split('/'));
		for (i = path.length - 1; i >=0; i--) {
			p = path[i].toLowerCase();
			if (p === 'pause') {
				paused = true;
			} else if (p === 'mute') {
				muted = true;
			} else if (!page &&
					(p === 'about' ||
					p === 'contact' ||
					p === 'disclaimer' ||
					p === 'terms-of-use') ) {
				page = p;
			} else if (!foundTime && p &&
				!isNaN(p) &&
				p >= 0) {
				foundTime = true;
				videoStartTime = parseFloat(p);
			}
			if (page && foundTime && muted && paused) {
				break;
			}
		}
		targetPage = page;
		if (targetPage) {
			if (pageBackground) {
				showHidePage(targetPage);
			} else {
				intro.style.display = 'none';
			}
		} else if (foundTime && video && video.duration > videoStartTime) {
			video.currentTime = videoStartTime;
		}
	}
	
	function languageSetting () {
		//return document.getElementById('lang-select').value;
		return language;
	}
	
	function handleNoVideo() {
		videoEnabled = false;
		videoStartTime = 0;
		document.getElementById('no-video').style.display = 'block';
		document.getElementById('intro-play').style.display = 'none';
		
		controlText['#intro-caption'] = {
			en: 'With the popcorn.js and HTML5 video technology on board, Europeana Remix is at the vanguard of using audiovisual heritage in engaging people with their history.',
			de: 'Mit dem Popcorn.js und HTML5-Video-Technologie an Bord, ist Europeana Remix an der Spitze der Nutzung von Online-Video im Dialog mit Menschen mit ihrer Geschichte.'
		};
		
		var yt = document.createElement('script');
		yt.setAttribute('type', 'text/javascript');
		yt.src = 'http://www.youtube.com/player_api';

		var ytContainer = document.createElement('div');
		ytContainer.id = 'youtube-container';
		ytContainer.style.display = 'none';
		intro.insertBefore(ytContainer, document.getElementById('intro-text'));

		window.onYouTubePlayerAPIReady = function() {
			var html5 = navigator.userAgent.match(/iPad/i) ? 1 : 0;
			video = new window.YT.Player('youtube-container', {
				width: 640,
				height: 320,
				videoId: '8uLOWsWod7c',
				playerVars: {
					origin : document.location.protocol+"//"+document.location.hostname,
					html5: html5
				}
			});
		}

		document.body.appendChild(yt);

		document.getElementById('no-video-continue').onclick = function() {
			document.getElementById('intro-text').style.display = 'none';
			ytContainer.style.display = '';
		};


		document.body.classList.add('no-video');
	}

	function initialize() {
	
		parseTarget();
		
		window.addEventListener('hashchange', parseTarget, false);
		
		if (!Modernizr || !Modernizr.video || navigator.userAgent.match(/iPad/i) !== null) {
			handleNoVideo();
		} else {

			popcorn = Popcorn('#video');

			try {
				volumeCtx = volume.getContext('2d');
				progressCtx = progress.getContext('2d');
			} catch (e) {
			}

			if (video.readyState >= 2) {
				loadedMetaData();
			} else {
				video.addEventListener('loadedmetadata', loadedMetaData, false);
			}
	
			if (document.body && videoStartTime > INTRO_FADE_TIME) {
				//the popcorn 'code' event that does this is going to be skipped
				document.body.style.backgroundColor = '#000';
			}
		}	
		
		//window.addEventListener('DOMContentLoaded', function() {
			resize();
			
			if (videoStartTime > INTRO_FADE_TIME) {
				//the popcorn 'code' event that does this is going to be skipped
				document.body.style.backgroundColor = '#000';
			}

			/* set up initial language */
			language = document.documentElement.getAttribute('lang') || 'en';
			updateLanguage();

			if (videoEnabled) {
				setUpVolumeBar();
				setUpLayoutData();
		
				/* video events */
				video.addEventListener('play', function () {
					document.getElementById('play-button').classList.add('active');
					lastInteractionTime = Date.now();
					
					if (!played) {
						if (videoStartTime < INTRO_FADE_TIME) {
							animateCss('bottom-controls', {
								opacity: { from: 0, to: 1 }
							}, 0.5);
						}
						document.getElementById('intro-play').style.display = 'none';
	
						//just to make sure
						video.style.display = 'block';
	
						played = true;
					}
				}, false);
				video.addEventListener('pause', function () {
					document.getElementById('play-button').classList.remove('active');
					lastInteractionTime = Date.now();
				}, false);
				
				video.addEventListener('ended', function () {
					document.getElementById('play-button').classList.remove('active');
				}, false);
				
				video.addEventListener('volumechange', function () {
					//draw volume display
					if (document.getElementById('volume-button').offsetHeight) {
						drawVolumeControl();
					}
					if (video.volume < 0.05) {
						document.getElementById('volume-button').classList.add('active');
					} else {
						document.getElementById('volume-button').classList.remove('active');
					}
					
					if (window.localStorage) {
						localStorage.euRemixVolume = video.volume;
					}
				}, false);
			}
				
			/* set up control events */
			/* todo: make sure this works with touch events as well */
			video.addEventListener('click', hideAllControls, false);
			document.getElementById('resources').addEventListener('click', hideAllControls, false);
			document.getElementById('bottom-controls').addEventListener('click', hideAllControls, false);
			document.getElementById('top-controls').addEventListener('click', hideAllControls, false);
			document.getElementById('play-button').addEventListener('click', toggleVideo, false);
			document.addEventListener('click', function(event) {
			}, false);
			
			document.getElementById('intro-en').addEventListener('click', function() {
				language = 'en';
				updateLanguage();
				saveLanguage();
			}, false);
		
			document.getElementById('intro-de').addEventListener('click', function() {
				language = 'de';
				updateLanguage();
				saveLanguage();
			}, false);
					
			if (videoEnabled) {
				document.getElementById('comments-button').addEventListener('click', function() {
					extrasEnabled.comments = !extrasEnabled.comments;
					updateSetting('comments');
					if (extrasEnabled.comments) {
						popcorn.enable('videoComment');
					} else {
						popcorn.disable('videoComment');
					}
				}, false);
				
				document.getElementById('resources-button').addEventListener('click', function() {
					var i, max;
					extrasEnabled.resources = !extrasEnabled.resources;
					updateSetting('resources');
					if (extrasEnabled.resources) {
						for (i = 0, max = resourceTypes.length; i < max; i++) {
							popcorn.enable(resourceTypes[i]);
						}
					} else {
						for (i = 0, max = resourceTypes.length; i < max; i++) {
							popcorn.disable(resourceTypes[i]);
						}
					}
				}, false);
				
				document.getElementById('subtitles-button').addEventListener('click', function() {
					extrasEnabled.subtitles = !extrasEnabled.subtitles;
					updateSetting('subtitles');
					if (extrasEnabled.subtitles) {
						popcorn.enable('subtitle');
					} else {
						popcorn.disable('subtitle');
					}
				}, false);
				
				document.getElementById('language-en').addEventListener('click', function() {
					language = 'en';
					updateLanguage();
					saveLanguage();
				}, false);
			
				document.getElementById('language-de').addEventListener('click', function() {
					language = 'de';
					updateLanguage();
					saveLanguage();
				}, false);
			
				document.getElementById('logo-link').addEventListener('click', function() {
					video.pause();
				}, false);
			
				document.getElementById('settings-button').addEventListener('click', function() {
					var settings = document.getElementById('settings-controls');
					var show = !settings.offsetHeight;
			
					hideAllControls();
					//toggle
					if (show) {
						settings.style.display = 'block';
						popUpsVisible = true;
					}
				}, false);
			
				document.getElementById('volume-button').addEventListener('click', function() {
					var vol = document.getElementById('volume-controls');
					var show = !vol.offsetHeight;
			
					hideAllControls();
					//toggle
					if (show) {
						vol.style.display = 'block';
						drawVolumeControl();
						popUpsVisible = true;
					}
				}, false);
				document.getElementById('add-comment-button').addEventListener('click', function() {
					commentDialogActive = !commentDialogActive;
					if (commentDialogActive) {
						showCommentDialog();
					} else {
						lastCommentTime = video.currentTime;
						document.getElementById('add-comment-controls').style.display = 'none';
					}
				}, false);
	
				document.getElementById('comment-tos-checkbox').addEventListener('click', function(event) {
					/*
					commentTermsChecked = !commentTermsChecked;
	
					if (commentTermsChecked) {
						this.style.backgroundImage = '';
					} else {
						this.style.backgroundImage = 'none';
					}
					*/
					
					commentTermsChecked = this.checked;
	
					validateCommentForm();
				}, false);
				commentTermsChecked = document.getElementById('comment-tos-checkbox').checked;
	
				document.getElementById('comment-post').addEventListener('click', function() {
					//todo: validate form
					if (!commentTermsChecked) {
						return;
					}
					
					//save comment to server
					var req = new XMLHttpRequest();
					req.open('POST', 'save-comment.php', true);

					var formData,
						email = document.getElementById('comment-email').value,
						name = document.getElementById('comment-name').value,
						commentText = document.getElementById('comment-text').value;
					if (window.FormData) {
						formData = new FormData();
						formData.append('language', language);
						formData.append('name', name);
						formData.append('email', email);
						formData.append('comment', commentText);
						formData.append('time', video.currentTime);
					} else {
						formData = [
							'language=' + encodeURIComponent(language),
							'name=' + encodeURIComponent(name),
							'email=' + encodeURIComponent(email),
							'comment=' + encodeURIComponent(commentText),
							'time=' + encodeURIComponent(video.currentTime)
						].join('&');
						req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
						req.setRequestHeader("Content-length", formData.length);
						req.setRequestHeader("Connection", "close");
					}
					
					req.send(formData);
	
					req.onreadystatechange = function (aEvt) {
						if (req.readyState === 4) {
							if(req.status === 200) {
								//add saved comment to popcorn
								var response = JSON.parse(req.responseText);
								if (response.success) {
									var comment = response.data;
									//don't add any duplicates
									if (comment && !commentData[comment[0]]) {
										commentData[comment[0]] = comment;
										popcorn.videoComment({
											start: comment[2],
											end: comment[2] + 5,
											id: comment[0],
											author: comment[4],
											text: comment[5],
											date: comment[1] * 1000,
											language: comment[3],
											target: 'comments'
										});	
									}
									
									//hide comment dialog and clear out comment text input
									commentDialogActive = false;
									
									lastCommentTime = video.currentTime;
									document.getElementById('add-comment-controls').style.display = 'none';
									document.getElementById('comment-text').value = '';
								//} else {
								//todo: report error?
								}
								
							} else {
								console.log('error saving comment');
							}
						}
					};
	
				}, false);
	
				document.getElementById('end-close').addEventListener('click', function() {
					document.getElementById('end').style.display = 'none';
				}, true);
				
				document.getElementById('play-again').addEventListener('click', function() {
					video.currentTime = 0;
					video.play();
				}, true);
				
				document.getElementById('comment-cancel').addEventListener('click', function() {
					commentDialogActive = false;
					lastCommentTime = video.currentTime;
					document.getElementById('add-comment-controls').style.display = 'none';
				}, true);
				
				document.getElementById('comment-name').addEventListener('change', validateCommentForm, false);
				document.getElementById('comment-email').addEventListener('change', validateCommentForm, false);
				document.getElementById('comment-text').addEventListener('change', validateCommentForm, false);
				document.getElementById('comment-name').addEventListener('keyup', validateCommentForm, false);
				document.getElementById('comment-email').addEventListener('keyup', validateCommentForm, false);
				document.getElementById('comment-text').addEventListener('keyup', validateCommentForm, false);

			}

			document.getElementById('about-button').addEventListener('click', function() {
				showHidePage('about');
			}, false);

			document.getElementById('contact-button').addEventListener('click', function() {
				showHidePage('contact');
			}, false);

			document.getElementById('back-button').addEventListener('click', function() {
				showHidePage();
			}, false);

			document.getElementById('help-button').addEventListener('click', function() {
				var help = document.getElementById('help-controls');
				var show = !help.offsetHeight;
		
				hideAllControls();
				//toggle
				if (show) {
					help.style.display = 'block';
					popUpsVisible = true;
				}
			}, false);

			document.getElementById('share-button').addEventListener('click', function() {
				var share = document.getElementById('share-controls');
				var show = !share.offsetHeight;
		
				hideAllControls();
				//toggle
				if (show) {
					share.style.display = 'block';
					popUpsVisible = true;
				}
			}, false);

			document.getElementById('twitter-button').addEventListener('click', function() {
				var base = window.location.protocol + '//' + window.location.host + window.location.pathname;
				var safeUrl = encodeURIComponent(base);

				var safeText = encodeURIComponent(controlText.shareTwitter[language]);

				var tweetUrl = 'http://twitter.com/share?count=none&counturl=' + safeUrl + '&text=' + safeText + '&url=';// + safeUrl;

				twitterWindow = window.open(
					tweetUrl,
					'europeanasharetweet',
					"left=" + Math.round((screen.width/2)-(550/2)) + ",top=" + Math.round((screen.height/2)-(450/2)) + ",width=550,height=450,personalbar=0,toolbar=0,scrollbars=1,resizable=1"
				);
				
				twitterWindow.focus();
				
				//Google Analytics
				_gaq.push(['_trackSocial', 'twitter', 'tweet', 'remix.europeana.eu']);
			}, false);
			
			document.getElementById('facebook-button').addEventListener('click', function() {
				var base = window.location.protocol + '//' + window.location.host + window.location.pathname;
				var safeUrl = base; //encodeURIComponent(base);

				var safeText = encodeURIComponent(controlText.shareFacebook[language]);

				var url = 'http://facebook.com/sharer.php?u=' + safeUrl + '&t=' + safeText;

				facebookWindow = window.open(
					url,
					'europeanasharefacebook',
					"left=" + Math.round((screen.width/2)-(550/2)) + ",top=" + Math.round((screen.height/2)-(450/2)) + ",width=550,height=450,personalbar=0,toolbar=0,scrollbars=1,resizable=1"
				);
				
				facebookWindow.focus();

				//Google Analytics
				_gaq.push(['_trackSocial', 'facebook', 'send', 'remix.europeana.eu']);
			}, false);
			
			animateCss('top-controls', {
				opacity: { from: 0, to: 1 }
			}, 0.5);

		//}, false);
	
		//temp?
		window.addEventListener('load', function () {
			resize(true);
		}, false);
		
		window.addEventListener('resize', resize, true);
		
		document.addEventListener('mousemove', function(event) {
			lastInteractionTime = Date.now();
			mousePosition = getMousePosition(event);
		}, false);
		
		var cssPath = document.getElementById('main-style').getAttribute('href');
			
		var resourcesToLoad = [
			{
				url: 'image/page-bg.jpg',
				category: 'display'
			},
			'image/background.jpg',
			{
				url: cssPath,
				mode: 'font',
				id: 'chevin',
				families: ['Chevin-Light'],
				category: 'display'
			},
			'image/bg.png',
			'image/logo.png',
			'image/icon_facebook.png',
			'image/icon_twitter.png',
			'image/radio.png',
			'image/settings.png'
		];
		if (videoEnabled) {
			resourcesToLoad = resourcesToLoad.concat([
				{
					url: 'video/otto-and-bernard.webm',
					element: video,
					id: 'video',
					category: 'play'
				},
				{
					url: 'data/resources.txt?' + Date.now(),
					type: 'json',
					category: 'data',
					id: 'resources'
				},
				{
					url: 'data/subtitles.txt',
					type: 'json',
					category: 'data',
					id: 'subtitles'
				},
				'image/playpause.png',
				'image/check.png',
				'image/comment.png',
				'image/comments.png',
				'image/volume.png',
				'image/intro-play.png',
				'image/media-icons.png'
			]);
		}
		
		var loaderator = new Loaderator(resourcesToLoad, 'all', function(resources) {
			if (!videoEnabled) {
				return false;
			}
		
			//everything is loaded, so make the player visible

			if (videoStartTime > INTRO_FADE_TIME) {
				animateCss('bottom-controls', {
					opacity: { from: 0, to: 1 }
				}, 0.5);
			} else {
				var playButton = document.getElementById('intro-play');
				playButton.innerHTML = '<img src="image/intro-play.png"/>';
				playButton.addEventListener('click', function() {
					footer.innerHTML = '<a href="http://www.europeana.eu" target="_blank"><img src="image/poweredby-white.png"/></a>';
					video.play();
				}, false);
			}
			
			window.addEventListener('keypress', keyPress, false);
		});
		loaderator.addEventListener('all:chevin', function (res) {
			resize();
			if (videoStartTime < INTRO_FADE_TIME || !videoEnabled) {
				animateCss('intro-text', {
					opacity: { from: 0, to: 1 }
				}, 1);
				animateCss('intro-en', {
					opacity: { from: 0, to: 1 }
				}, 1);
				animateCss('intro-de', {
					opacity: { from: 0, to: 1 }
				}, 1);
			} else {
				document.getElementById('intro-text').style.opacity = 1;
			}
		});
		loaderator.addEventListener('all:image/logo.png', function (res) {
			resize();
			logo.style.zIndex = '1500';
			animateCss(logo, {
				opacity: { from: 0, to: 1 }
			}, 1);
		});
		loaderator.addEventListener('all:image/page-bg.jpg', function (res) {
			var img = res.element;
			img.id = 'page-background';
			pageBackground = img;
			intro.parentNode.insertBefore(img, intro.nextSibling);
			
			if (!videoEnabled) {
				intro.style.display = 'block';
			}
		});
		loaderator.addEventListener('display', function (res) {
			if (targetPage && !activePage) {
				showHidePage(targetPage);
			}
			if (videoStartTime < INTRO_FADE_TIME || !videoEnabled) {
				intro.style.display = 'block';
			}
		});
		
		loaderator.addEventListener('all:image/background.jpg', function (res) {
			resize();
			var img = res.element;
			intro.insertBefore(img, intro.firstChild);
			
			if (!videoEnabled) {
				return;
			}
			if (videoStartTime < INTRO_FADE_TIME) {
				animateCss(img, {
					opacity: { from: 0, to: 1 }
				}, 1, function() {
					video.style.display = 'block';
				});
				if (pageBackground) {
					intro.style.display = 'block';
				}
			} else {
				video.style.display = 'block';
			}
			
			var end = document.getElementById('end');
			img = img.cloneNode(false);
			end.insertBefore(img, end.firstChild);
		});

		if (videoEnabled) {
			loaderator.addEventListener('all:video', function (res) {
				res.element.style.visibility = 'visible';

				/*
				if (window.localStorage && localStorage.euRemixVolume !== undefined && !isNaN(localStorage.euRemixVolume) ) {
					 video.volume = localStorage.euRemixVolume;
				}
				*/

				//end screen
				var end = document.getElementById('end'),
					endText = document.getElementById('end-text'),
					close = document.getElementById('end-close'),
					bg = end.firstChild;
				popcorn.code({
					start: '4:26',
					end: popcorn.duration() - 1,
					onStart: function( options ) {
						end.style.display = 'block';
						close.style.display = '';
					},
					onFrame: function ( event, options ) {
						var opacity = Math.min( (popcorn.currentTime() - options.start) / (INTRO_FADE_TIME), 1);
						if (end.style.opacity !== opacity) {
							end.style.opacity = opacity;
						}
					},
					onEnd: function ( options ) {
						// called on end
						if (popcorn.currentTime() < options.start) {
							end.style.display = '';
						}
						close.style.display = 'none';
					}
				});
	
				popcorn.code({
					start: popcorn.duration() - 1,
					end: popcorn.duration(),
					onStart: function( options ) {
						if (!(bg instanceof HTMLImageElement)) {
							bg = end.firstChild;
						}
						end.style.display = 'block';
						
						end.classList.add('final');
					},
					onFrame: function ( event, options ) {
						var opacity = Math.min( (popcorn.currentTime() - options.start) / 0.5, 1);
	
						if (bg.style.opacity !== opacity) {
							bg.style.opacity = opacity;
						}
	
						if (end.style.opacity < opacity) {
							end.style.opacity = opacity;
						}
	
						opacity = 1 - opacity;
						endText.style.backgroundColor = 'rgba(255, 255, 255, ' + (opacity * 0.85) + ')';
						endText.style.borderColor = 'rgba(0, 0, 0, ' + (opacity * 0.6) + ')';
					},
					onEnd: function ( options ) {
						// called on end
						end.style.cssText = '';
	
						end.classList.remove('final');
					}
				});
			});
			loaderator.addEventListener('data:resources', function (res) {
				var apikeys = {
					flickr: window.flickrApiKey || ''
				};
				var resourceData = JSON.parse(res.element.responseText);
				var source, options, i, max;
				for (source in resourceData) {
					if (resourceData.hasOwnProperty(source) && typeof popcorn[source] === 'function') {
						for (i = 0, max = resourceData[source].length; i < max; i++) {
							options = resourceData[source][i];
							if (apikeys[source]) {
								options.apikey = apikeys[source];
							}
							options.target = 'resources';
							if (options.fadeIn === undefined || isNaN(options.fadeIn)) {
								options.fadeIn = 0.5;
							}
							if (options.fadeOut === undefined || isNaN(options.fadeOut)) {
								options.fadeOut = 0.5;
							}
							popcorn[source](options);
						}
						
						//add to resourceTypes
						if (max && resourceTypes.indexOf(source) === -1) {
							resourceTypes.push(source);
							if (!extrasEnabled.resources) {
								popcorn.disable(source);
							}
						}
					}
				}
			});
			loaderator.addEventListener('data:subtitles', function (res) {
				var i, subtitleData = JSON.parse(res.element.responseText);
		
				if (subtitleData) {
					for (i = 0; i < subtitleData.length; i++) {
						subtitleData[i].languagesrc = languageSetting;
						popcorn.subtitle(subtitleData[i]);
					}
				}
			});
			loadCommentData();
	
			//temp
			window.addEventListener('keyup', function(event) {
				var key = event.which || event.keyCode;
				if (commentDialogActive) {
					lastInteractionTime = Date.now();
	
					if (key === 27) {
						commentDialogActive = false;
						lastCommentTime = video.currentTime;
						document.getElementById('add-comment-controls').style.display = 'none';
						event.preventDefault();
					}
				
					return;
				}
				
				if ( key === 37 ) {
					video.currentTime -= 1/25;
					console.log('left', video.currentTime);
				} else if ( key === 39 ) {
					video.currentTime += 1/25;
					console.log('right', video.currentTime);
				}
			}, false);
		
			//intro screen
			popcorn.code({
				start: 0,
				end: INTRO_FADE_TIME,
				onStart: function( options ) {
					// called on start
					intro.style.display = 'block';
					document.body.style.backgroundColor = '#fff';
					logo.style.zIndex = '1500';
				},
				onFrame: function ( options ) {
					// called on every paint frame between start and end.
					// uses mozRequestAnimationFrame, webkitRequestAnimationFrame,
					// or setTimeout with 16ms window.
					var opacity = 1 - Math.min(popcorn.currentTime() / (INTRO_FADE_TIME), 1);
					intro.style.opacity = opacity;
					opacity = Math.round(opacity * 255);
					document.body.style.backgroundColor = 'rgb(' + opacity + ', ' + opacity + ', ' + opacity + ')';
				},
				onEnd: function ( options ) {
					// called on end
					document.body.style.backgroundColor = '#000';
					intro.style.display = 'none';
					logo.style.zIndex = '';
				}
			});
		}
	}

	initialize();

}(window));
