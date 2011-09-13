// PLUGIN: Image
(function (Popcorn) {
	
	if (!Popcorn) {
		return;
	}

	/**
* Generic Image popcorn plug-in
*
* @param {Object} options
*
* Example:
var p = Popcorn('#video')
.image({
start: 5, // seconds, mandatory
end: 15, // seconds, mandatory
url: '', //mandatory
height: '50px', // optional
width: '50px', // optional
target: 'imagediv' // mandatory
} )
*
*/

	var idx = 0;

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


	Popcorn.plugin( "image" , function( options ) {
		var containerDiv, //containerDiv is 'position: absolute' to position within frame and fix width/height
			contentDiv,  //contentDiv is 'position: relative' for laying out stuff inside it
			_uri,
			_link,
			_image,
			_height, _width, _top, _left,
			popcorn = this,
			paused = false,
			otherWindows, bigWindow, littleWindow, keyPress;

		if (!options.url) {
			return;
		}

		keyPress = function (event) {
			var key = event.keyCode || event.which;
			if (key === 27) { //escape
				littleWindow();
			}
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

		  if (_width && 16 / 9 * 0.4 * _image.height / _image.width > 0.8) {
			containerDiv.style.width = _image.width / _image.height * 0.8 * 9/16 * 100 + '%';
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

			containerDiv.classList.remove('active');
			containerDiv.style.width = _width;
			if (_top || _left) {
				containerDiv.style.top = _top;
				containerDiv.style.left = _left;
				containerDiv.style.position = 'absolute';
			}
			_image.style.width = '100%';

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

		containerDiv = document.createElement( "div" );
		containerDiv.setAttribute('class', 'image');
		containerDiv.id = "image" + idx;
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
			throw ( "image target container doesn't exist" );
		}

		if (options.top || options.left) {
			containerDiv.style.position = 'absolute';
			containerDiv.style.top = options.top;
			containerDiv.style.left = options.left;
		}
	
		contentDiv = document.createElement( "div" );
		contentDiv.style.position = 'relative';
		containerDiv.appendChild(contentDiv);

		var getImageWhenReady = function() {
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
					setTimeout(getImageWhenReady, 10);
					return;
				}
			}

			_image = document.createElement('img');
			_image.src = options.url;
			_image.style.width = '100%';

			contentDiv.appendChild(_image);
			
			var info = document.createElement('div');
			info.setAttribute('class', 'info');
			
			var source = options.source || 'Image';
			var title = options.title;
			if (options.link) {
				title = '<a href="' + options.link + '" target="_new">' + title + '</a>';
				source = '<a href="' + options.link + '" target="_new">' + source + '</a>';
			}
			
			info.innerHTML = '<div class="media"><span class="hiding minimize" style="float: right; margin-right: 20px;">minimize window</span>image<span class="hiding"> | <span class="popcorn-source">source</span>: ' + source + '</span></div><div>' + title + '</div><div class="watch">view image</div>';
			
			var minimize = info.getElementsByClassName('minimize').item(0);
			minimize.addEventListener('click', littleWindow, false);
			
			contentDiv.appendChild(info);
			
			_width = options.width;
			_top = options.top;
			_left = options.left;
			_image.addEventListener('load', function() {
				var re = /(\d*(\.\d*)?)\s*(px|em|\%|em|rem)?/,
					match, units, width, height,
					imgWidth, imgHeight;
		
					imgWidth = _image.width || _image.naturalWidth;
					imgHeight = _image.height || _image.naturalHeight;

				if (options.width && !options.height) {
					match = re.exec(options.width);
					if (match && match.length > 1) {
						units = match[3] || '';
						width = parseFloat(match[1]);
						height = width * _image.height / _image.width;
						contentDiv.style.height = _height = height + units;
        			
						//internet explorer 9
						if (!_image.width) {
							_image.style.height = 100 * imgHeight / imgWidth + '%';
						}

					}
				}
				options.loaded = true;
			}, false);
			
			contentDiv.addEventListener('click', bigWindow, false);

		};
		
		getImageWhenReady();

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
			end: function( event, options ) {
				containerDiv.style.display = "none";
			},
			_teardown: function( options ) {
				var target = document.getElementById( options.target );
				if (target) {
					target.removeChild( containerDiv );
				}
			},
			frame: function(event, options, time){
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
			name: "Popcorn Image Plugin",
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
			target: "image-container",
			height: {
				elem: "input",
				type: "text",
				label: "Height"
			},
			width: {
				elem: "input",
				type: "text",
				label: "Width"
			}
		}
	});
}( window.Popcorn ));