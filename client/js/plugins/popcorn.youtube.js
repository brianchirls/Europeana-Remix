// PLUGIN: YouTube
(function (Popcorn) {
	
	if (!Popcorn) {
		return;
	}

	/**
* YouTube popcorn plug-in
*
* @param {Object} options
*
* Example:
var p = Popcorn('#video')
.youtube({
start: 5, // seconds, mandatory
end: 15, // seconds, mandatory
target: 'youtubediv' // mandatory
} )
*
*/

	var idx = 0,
	ytFired = false,
	ytLoaded = false,
	loadYouTube = function () {
		if (document.body) {
			ytFired = true;
			
			var oldYTCallback = window.onYouTubePlayerAPIReady;
			window.onYouTubePlayerAPIReady = function() {
				ytLoaded = true;

				if (oldYTCallback) {
					oldYTCallback();
				}
			};
			
			Popcorn.getScript("http://www.youtube.com/player_api");
		} else {
			setTimeout(function () {
				loadYouTube();
			}, 1);
		}
	};

	function rightClick(event) {
		if (!event) {
			return false;
		}
		if (event.which) {
			return (event.which === 3);
		}
		if (event.button) {
			return (event.button === 2);
		}
	}

	Popcorn.plugin( "youtube" , function( options ) {
		var containerDiv,
			contentDiv,
			playerDiv,
			_height, _width, _top, _left,
			_uri,
			ytPlayer,
			popcorn = this,
			paused = false,
			otherWindows, bigWindow, littleWindow, keyPress;

		if (!ytFired) {
			loadYouTube();
		}
			
		keyPress = function (event) {
			var key = event.keyCode || event.which;
			if (key === 27) { //escape
				littleWindow();
				return;
			}

			if (key === 32) { //space
				if (ytPlayer && ytPlayer.pauseVideo) {
					if (ytPlayer.getPlayerState() === 1) {
						ytPlayer.pauseVideo();
					} else if (ytPlayer.getPlayerState() === 2) {
						ytPlayer.playVideo();
					}
				}

				if (event.preventDefault) {
					event.preventDefault();
				}
				if (event.stopPropagation) {
					event.stopPropagation();
				}
				event.returnValue = false;
				event.cancelBubble = true;
			}
			return false;
		};
		
		otherWindows = function(event) {
			if (rightClick(event)) {
				return;
			}

			var target = event.target;
			do {
				if (target === containerDiv) {
					return true;
				}
			} while (target = target.parentNode);
			console.log(event);
			littleWindow();

			return false;
		};

		bigWindow = function (event) {
			if (rightClick(event)) {
				return;
			}

			paused = popcorn.media.paused;
			popcorn.pause();
			contentDiv.removeEventListener('click', bigWindow, false);
			window.addEventListener('click', otherWindows, true);
			
			window.addEventListener('keydown', keyPress, true);

			//most plugins shouldn't use classList, but this is a custom one, so we know it's been prepared
			containerDiv.classList.add('active');

			containerDiv.style.cssText = '';      

			if (ytPlayer && ytPlayer.playVideo) {
				ytPlayer.playVideo();
			}

			if (event) {
				if (event.preventDefault) {
					event.preventDefault();
				}
				if (event.stopPropagation) {
					event.stopPropagation();
				}
				event.returnValue = false;
				event.cancelBubble = true;
			}
			return false;
		};

		littleWindow = function (event) {
			if (rightClick(event)) {
				return;
			}

			if (ytPlayer && ytPlayer.pauseVideo) {
				ytPlayer.pauseVideo();
			}
			containerDiv.classList.remove('active');
			containerDiv.style.width = _width;
			if (_top || _left) {
				containerDiv.style.top = _top;
				containerDiv.style.left = _left;
				containerDiv.style.position = 'absolute';
			}
			contentDiv.addEventListener('click', bigWindow, false);

			window.removeEventListener('keydown', keyPress, true);
			window.removeEventListener('click', otherWindows, true);

			if (!paused) {
				popcorn.play();
			}
			 
			if (event) {
				if (event.preventDefault) {
					event.preventDefault();
				}
				if (event.stopPropagation) {
					event.stopPropagation();
				}
				event.returnValue = false;
				event.cancelBubble = true;
			}

			return false;
		};

		options.loaded = false;

		// create a new div this way anything in the target div is left intact
		containerDiv = document.createElement( "div" );
		containerDiv.setAttribute('class', 'youtube');
		containerDiv.id = "youtube" + idx;
		if (options.width) {
			containerDiv.style.width = options.width;
		}
		if (options.height) {
			containerDiv.style.height = options.height;
		}
		containerDiv.style.display = "none";
		idx++;
		
		// ensure the target container the user chose exists
		if ( document.getElementById( options.target ) ) {
			document.getElementById( options.target ).appendChild( containerDiv );
		} else {
			throw ( "youtube target container doesn't exist" );
		}

		if (options.top || options.left) {
			containerDiv.style.position = 'absolute';
			containerDiv.style.top = options.top;
			containerDiv.style.left = options.left;
		}
	
		contentDiv = document.createElement( "div" );
		contentDiv.style.position = 'relative';
		containerDiv.appendChild(contentDiv);
		
		// get a single video from YouTube API
		// todo: validate id before sending request
		var getYouTubeData = function() {
			//holds off on getting this data from the network until this part of the video has loaded
			if (popcorn.media && popcorn.media.buffered) {
				var i, max, loaded = false, start, end, buffered = popcorn.media.buffered;
				for (i = 0, max = buffered.length; i < max; i++) {
					start = buffered.start(i);
					end = buffered.end(i);

					//fix stupid Firefox bug
					if (start > popcorn.media.duration) {
						start = 0;
					}

					if (start <= options.end && end >= options.start) {
						loaded = true;
						break;
					}
				}
				if (!loaded) {
					setTimeout(getYouTubeData, 10);
					return;
				}
			}
			_uri = 'http://gdata.youtube.com/feeds/api/videos/' + options.videoid + '?v=2&alt=jsonc&callback=youtube';

			Popcorn.xhr.getJSONP( _uri, function( data ) {
				if (!data || !data.data) {
					return;
				}
				
				var video = data.data;
		var url = options.url;
		if (!url) {
			url = 'http://www.youtube.com/watch?v=' + video.id;
		}

		var img = document.createElement('img');
		img.src = video.thumbnail.hqDefault;
		img.style.width = '100%';
		contentDiv.appendChild(img);
		
		var pdiv = document.createElement('div');
		pdiv.id = 'ytplayer-' + video.id;
		pdiv.setAttribute('class', 'player');
		contentDiv.appendChild(pdiv);
 
		var isYouTubeReady = function () {
			if (ytLoaded) {
			
				ytPlayer = new window.YT.Player('ytplayer-' + video.id, {
					height: 320,
					width: 240,
					videoId: video.id,
					playerVars: {
						origin : document.location.protocol+"//"+document.location.hostname,
						html5: 1
					},
					events : {
						onReady: function(blah) {
						//iframe.style.visibility = 'visible';
						}
					}
				});
			
			} else {
			setTimeout(isYouTubeReady, 1);
			}
		};

		var info = document.createElement('div');
		info.setAttribute('class', 'info');

		info.innerHTML = '<div class="media">video<span class="hiding"> | <span class="popcorn-source">source</span>: <a href="' + url + '" target="_new">YouTube</a></span></div><div><a href="' + url + '" target="_new">' + video.title + '</a></div><div class="watch">watch video</div>';
		
		contentDiv.appendChild(info);

		var minimize = document.createElement('span');
		minimize.innerHTML = 'minimize window';
		minimize.setAttribute('class', 'minimize');
		minimize.addEventListener('click', littleWindow, false);
		contentDiv.appendChild(minimize);

		isYouTubeReady();

		_width = options.width;
		_top = options.top;
		_left = options.left;
				img.addEventListener('load', function() {
					var re = /(\d*(\.\d*)?)\s*(px|em|\%|em|rem)?/,
						match, units, width, height,
						imgWidth, imgHeight;
			
						imgWidth = img.width || img.naturalWidth;
						imgHeight = img.height || img.naturalHeight;

					if (options.width && !options.height) {
						match = re.exec(options.width);
						if (match && match.length > 1) {
							units = match[3] || '';
							width = parseFloat(match[1]);
							height = width * img.height / img.width;
							contentDiv.style.height = height + units;
        			
							//internet explorer 9
							if (!img.width) {
								img.style.height = 100 * imgHeight / imgWidth + '%';
							}
						}
					}
					options.loaded = true;
				}, false);

				contentDiv.addEventListener('click', bigWindow, false);
			});
		};
		
		if ( options.url && !options.videoid ) {
			var regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_\-]*)/i;
			var match = regex.exec(options.url);
			if (match && match.length >= 5) {
				options.videoid = match[4];
			}
		}

		if ( options.videoid ) {
			getYouTubeData();
		}

		var duration = options.end - options.start;
		if (isNaN(options.fadeIn)) {
			options.fadeIn = Math.min(0.25, duration / 8);
		} else if (options.fadeIn > duration) {
			options.fadeIn = duration;
		}
		duration -= options.fadeIn;
		if (isNaN(options.fadeOut)) {
			options.fadeOut = Math.min(0.25, (options.end - options.start) / 8);
		} else if (options.fadeOut > duration) {
			options.fadeIn = duration;
		}

		return {
			/**
			* @member youtube
			* The start function will be executed when the currentTime
			* of the video reaches the start time provided by the
			* options variable
			*/
			start: function( event, options ) {
				var isLoaded = function() {
					if (options.loaded) {
						containerDiv.style.display = "";
					} else {
						setTimeout(isLoaded, 1);
					}
				};
				isLoaded();
			},
			/**
			* @member youtube
			* The end function will be executed when the currentTime
			* of the video reaches the end time provided by the
			* options variable
			*/
			end: function( event, options ) {
				containerDiv.style.display = "none";
				littleWindow();
			},
			_teardown: function( options ) {
				//todo: if there are no more instances alive, remove playerDiv from document
				littleWindow();
				var target = document.getElementById( options.target );
				if (target) {
					target.removeChild( containerDiv );
				}
			},
			frame: function(event, options, time){
				if (!options.loaded) {
					return;
				}
				var t = time - options.start;
				var opacity = 1;
				if (t < options.fadeIn) {
					opacity = t / options.fadeIn;
				} else if (time > options.end - options.fadeOut) {
					opacity = (options.end - time) / options.fadeOut;
				}
				containerDiv.style.opacity = opacity;
			}
		};
	},
	{
		about: {
			name: "Popcorn YouTube Plugin",
			version: "0.1",
			author: "Brian Chirls",
			website: "http://chirls.com/"
		},
		options: {
			start: {
				elem: "input",
				type: "number",
				label: "In"
			},
			end: {
				elem: "input",
				type: "number",
				label: "Out"
			},
			target: "youtube-container",
			height: {
				elem: "input",
				type: "text",
				label: "Height"
			},
			width: {
				elem: "input",
				type: "text",
				label: "Width"
			},
			top: {
				elem: "input",
				type: "text",
				label: "Top"
			},
			left: {
				elem: "input",
				type: "text",
				label: "Left"
			}
		}
	});
}( window.Popcorn ));