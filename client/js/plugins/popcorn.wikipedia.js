// PLUGIN: Wikipedia
(function (Popcorn) {
	
	if (!Popcorn) {
		return;
	}

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



	Popcorn.plugin( "wikipedia" , function( options ) {
		var containerDiv, //containerDiv is 'position: absolute' to position within frame and fix width/height
			contentDiv,  //contentDiv is 'position: relative' for laying out stuff inside it
			_userid,
			_uri,
			_link,
			_image,
			article_id,
			lang,
			_height, _width, _top, _left,
			_padding = options.padding || "5px",
			_border = options.border || "0px",
			popcorn = this,
			paused = false,
			otherWindows, bigWindow, littleWindow, keyPress;
		
	if (!options || (!options.url && !options.id)) {
		return;
	}
		
		//parse URL for article id
		if (options.id) {
			article_id = options.id;
			lang = window.language || options.language || 'en';
			options.url = 'http://en.wikipedia.org/wiki/' + article_id;
			
		} else {
			article_id = /(https?:\/\/)?((en)\.)?wikipedia\.org\/wiki\/(.*)\/?/.exec(options.url);
			//this should use popcorn localization functions when they're ready (v0.8?)
			lang = window.language || options.language || article_id[3] || 'en';
			article_id = article_id[4];
			if (!article_id) {
				return;
			}
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
		containerDiv.setAttribute('class', 'wikipedia');
		containerDiv.id = "wikipedia" + idx;
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
			throw ( "wikipedia target container doesn't exist" );
		}

		if (options.top || options.left) {
			containerDiv.style.position = 'absolute';
			containerDiv.style.top = options.top;
			containerDiv.style.left = options.left;
		}
	
		contentDiv = document.createElement( "div" );
		contentDiv.style.position = 'relative';
		containerDiv.appendChild(contentDiv);
		
		_uri = 'http://' + lang + '.wikipedia.org/w/api.php?action=parse&props=text&page=' + article_id + '&format=json&callback=wikipedia';
		Popcorn.xhr.getJSONP( _uri, function( data ) {
			if (!data || !data.parse) {
				return;
			}
			
			var html = data.parse.text['*'];

			//extract first paragraph for summary text
			var summary = html.substr(html.indexOf('<p>') + 3);
			summary = summary.substr(0, summary.indexOf('</p>'));
			summary = summary.replace(/((<(.|\n)+?>)|(\((.*?)\) )|(\[(.*?)\]))/g, "");
			
			//prioritize images to guess which one to use
			var images = [];
			
			var png,
				imageUrl,
				ext,
				i;

			images = images.concat(data.parse.images);

			for (i = 0; i < images.length; i++) {
				ext = images[i].substr(-4).toLowerCase();
				if (ext === '.jpg') {
					imageUrl = images[i];
					break;
				} else if (ext === '.png') {
					png = images[i];
				}
			}
			
			if (!imageUrl) {
				imageUrl = png;
			}

			var content = document.createElement('div');
			content.setAttribute('class', 'content');
			var article = document.createElement('article');
			article.appendChild(document.createTextNode(summary));
			content.appendChild(article);
			content.appendChild(document.createElement('br'));
			contentDiv.appendChild(content);
					
			var info = document.createElement('div');
			info.setAttribute('class', 'info');
			
			var title = data.parse.displaytitle;
			title = title.replace('<', '&lt;');
			title = title.replace('>', '&gt;');
			
			info.innerHTML = '<div class="media"><span class="hiding minimize" style="float: right; margin-right: 20px;">minimize window</span>wiki<span class="hiding"> | <span class="popcorn-source">source</span>: <a href="' + options.url + '" target="_new">wikipedia</a></span></div><div><a href="' + options.url + '" target="_new">' + title + '</a></div><div class="watch">read article</div>';
			
			var minimize = info.getElementsByClassName('minimize').item(0);
			minimize.addEventListener('click', littleWindow, false);
	
			contentDiv.appendChild(info);
	 
			_width = options.width;
			_top = options.top;
			_left = options.left;

			contentDiv.addEventListener('click', bigWindow, false);

			if (imageUrl) {
				//using fixed size for now, but this should be configurable
				imageUrl = 'http://' + lang + '.wikipedia.org/w/api.php?action=query&prop=imageinfo&titles=File:' + imageUrl + '&iiprop=url|size&iiurlwidth=200&iiurlheight=200&format=json&callback=wikipediaImage';
				
				Popcorn.xhr.getJSONP( imageUrl, function( imageData ) {
					var i, j, info, page;
					
					if (imageData.query.pages && imageData.query.pages[0]) {
						info = imageData.query.pages[0].imageinfo[0];
					}
					
					if (!info) {
						return;
					}
					
					var img = document.createElement('img');
					img.src = info.thumburl || info.url;
					//img.width = info.width;
					//img.height = info.height;
					img.onload = function() {
						options.loaded = true;
					};
					
					content.insertBefore(img, content.firstChild);
				});
			} else {
				options.loaded = true;
			}
			

		});
				
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
			name: "Popcorn Wikipedia Plugin",
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
			url: {
				elem: "input",
				type: "text",
				label: "url"
			},
			target: "wikipedia-container"
		}
	});
}( window.Popcorn ));