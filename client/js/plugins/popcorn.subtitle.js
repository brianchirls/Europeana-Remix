// PLUGIN: Subtitle
/* Modified by Brian Chirls for Europeana:
	 - remove translation, only show currently selected language
	 - enable language setting from function, rather than just a <select> element
	 - make language update more efficient
	 - fades in and out
	 - allow for display modes other than inline
*/

(function ( Popcorn ) {

	if (!Popcorn) {
		return;
	}

	var scriptLoaded = false,
		i = 0,
		createDefaultContainer = function( context ) {
			
			var ctxContainer = context.container = document.createElement( "div" ),
				style = ctxContainer.style,
				media = context.media;

			// clear this function from future calls; we are done
			createDefaultContainer = Popcorn.nop;

			var updatePosition = function() {
				var position = context.position();
				// the video element must have height and width defined
				style.fontSize = "18px";
				style.width = media.offsetWidth + "px";
				style.top = position.top  + media.offsetHeight - ctxContainer.offsetHeight - 40 + "px";
				style.left = position.left + "px";

				setTimeout( updatePosition, 10 );
			};

			ctxContainer.id = "subtitlediv";
			style.position = "absolute";
			style.color = "white";
			style.textShadow = "black 2px 2px 6px";
			style.fontWeight = "bold";
			style.textAlign = "center";

			updatePosition();

			document.body.appendChild( ctxContainer );
		},
		getSelectedLanguage = function (options) {
			
			if (!options.languagesrc) {
				return;
			}
			if (typeof options.languagesrc === 'function') {
				return options.languagesrc();
			}
			if (options.languagesrc.tagName === 'SELECT') {
				return options.languagesrc.options[ options.languagesrc.selectedIndex ].value;
			}
			if (options.languagesrc.value !== undefined) {
				return options.languagesrc.value;
			}
		};

	//Popcorn.getScript( "http://www.google.com/jsapi", callBack );

	/**
	 * Subtitle popcorn plug-in 
	 * Displays a subtitle over the video, or in the target div
	 * Options parameter will need a start, and end.
	 * Optional parameters are target and text.
	 * Start is the time that you want this plug-in to execute
	 * End is the time that you want this plug-in to stop executing
	 * Target is the id of the document element that the content is
	 *  appended to, this target element must exist on the DOM
	 * Text is the text of the subtitle you want to display.
	 *
	 * Language is the expected language the subtitle text is in
	 * languagesrc is the target id of the element that contains 
	 *  the language value ("en", "fr", etc.) to translate the text into
	 *  example:
	 *  <select id="language">
	 *    <option value="zh" selected="selected">Chinese</option>
	 *    <option value="en">English</option>
	 *    <option value="fr">French</option>
	 *    <option value="de">German</option>
	 *    <option value="it">Italian</option>
	 *    <option value="ja">Japanese</option>
	 *    <option value="ko">Korean</option>
	 *    <option value="fa">Persian</option>
	 *    <option value="pl">Polish</option>
	 *    <option value="pt">Portuguese</option>
	 *    <option value="es">Spanish</option>
	 *  </select>
	 * Accessibilitysrc is the target id of a checkbox element
	 *  checked means show all subtitles regardless of language and languagesrc
	 *  not checked means only translate if language and languagesrc are different
	 *  if no accessibilitysrc exists, default is to display all subtitles regardless
	 * 
	 * @param {Object} options
	 * 
	 * Example:
		 var p = Popcorn('#video')
				.subtitle({
					start:            5,                 // seconds, mandatory
					end:              15,                // seconds, mandatory
					text:             'Hellow world',    // optional
					target:           'subtitlediv',     // optional
					language:         'en',              // optional
					languagesrc:      'language',        // optional
					accessibilitysrc: 'accessibility'    // optional
				} )
	 *
	 */

	// translates whatever is in options.container into selected language
/*
	var translate = function( options, text ) {

		options.selectedLanguage = options.languagesrc.options[ options.languagesrc.selectedIndex ].value;
		google.language.translate( text, "", options.selectedLanguage, function( result ) {
			
			for( var k = 0, children = options.container.children, len = children.length; k < len; k++ ) {
				if ( children[ k ].style.display === "inline" ) {   
					children[ k ].innerHTML = result.translation;    
				}  
			}

		});
	};
*/
	Popcorn.plugin( "subtitle" , {
		
		manifest: {
			about: {
				name: "Popcorn Subtitle Plugin",
				version: "0.1",
				author: "Scott Downe",
				website: "http://scottdowne.wordpress.com/"
			},
			options: {
				start: {
					elem: "input", 
					type: "text", 
					label: "In"
				},
				end: {
					elem: "input", 
					type: "text", 
					label: "Out"
				},
				target: "subtitle-container",
				text: {
					elem: "input", 
					type: "text", 
					label: "Text"
				},
				fadeIn : {elem:'input', type:'text', label:'Text'},
				fadeOut : {elem:'input', type:'text', label:'Text'}
			}
		},

		_setup: function( options ) {
			var newdiv = document.createElement( "div" ),
					accessibility = document.getElementById( options.accessibilitysrc );

			newdiv.id = "subtitle-" + i;
			if (options.cssText) {
				newdiv.style.cssText = options.cssText;
			}
			newdiv.style.display = "none";
			newdiv.setAttribute('lang', options.language);
			i++;

			// Creates a div for all subtitles to use
			if ( !this.container && !options.target || options.target === "subtitle-container" ) {
				createDefaultContainer( this );
			}

			// if a target is specified, use that
			if ( options.target && options.target !== "subtitle-container" ) {
				options.container = document.getElementById( options.target );
			} else { 
				// use shared default container
				options.container = this.container;
			}
			
			document.getElementById( options.container.id ).appendChild( newdiv );
			options.innerContainer = newdiv;

			options.showSubtitle = function() {
				options.innerContainer.innerHTML = options.text;
			};
			options.toggleSubtitles = function() {};

/*        
			var readyCheck = setInterval(function() {
				if ( !scriptLoaded ) {
					return;
				}
				clearInterval( readyCheck );
*/
			if ( options.languagesrc ) {
				//options.showSubtitle = translate;
				var langSelect;
				if (typeof options.languagesrc === 'string' && (langSelect = document.getElementById( options.languagesrc ) )) {
					options.languagesrc = langSelect;
				}
				options.selectedLanguage = getSelectedLanguage(options);

				if ( !this.languageSources ) {
					this.languageSources = {};
				}

				if ( !this.languageSources[ options.languagesrc ] ) {
					this.languageSources[ options.languagesrc ] = {};
				}

				if ( !this.languageSources[ options.languagesrc ][ options.target ] ) {
					this.languageSources[ options.languagesrc ][ options.target ] = true;

					var p = this;
					this.updateSubtitleLanguage = function() {
						options.toggleSubtitles();
						var selectedLanguage = getSelectedLanguage(options);
						var currentTime = p.currentTime();
						var k, events;

						for (k = p.data.trackEvents.startIndex - 1, events = p.data.trackEvents.byStart; k >= 0; k--) {
							var opts = events[k];
							if (opts._natives.type !== 'subtitle' || opts.end < currentTime) {
								break;
							}
							if (opts.language === getSelectedLanguage(opts)) {
								opts.innerContainer.style.display = '';
							} else {
								opts.innerContainer.style.display = 'none';
							}
							opts.showSubtitle( opts, opts.text );
						}
					};
					if (options.languagesrc.addEventListener) {
						options.languagesrc.addEventListener( "change", this.updateSubtitleLanguage, false );
					}
				}
			}
			if ( accessibility ) {
				options.accessibility = accessibility;

				options.toggleSubtitles = function() {

					options.selectedLanguage = getSelectedLanguage(options);

					if ( options.accessibility.checked || options.selectedLanguage !== ( options.language || "") ) {

						options.display = "";
						options.container.style.display = options.display;
					} else if ( options.selectedLanguage === ( options.language || "") ) {

						options.display = "none";
						options.container.style.display = options.display;
					}
				};

				options.accessibility.addEventListener( "change", options.toggleSubtitles, false );

				// initiate it once to set starting state
				options.toggleSubtitles();

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
		},
		/**
		 * @member subtitle 
		 * The start function will be executed when the currentTime 
		 * of the video  reaches the start time provided by the 
		 * options variable
		 */
		start: function( event, options ){
			if (options.language === getSelectedLanguage(options)) {
				options.innerContainer.style.display = "";
				options.showSubtitle( options, options.text );
			}
		},
		/**
		 * @member subtitle 
		 * The end function will be executed when the currentTime 
		 * of the video  reaches the end time provided by the 
		 * options variable
		 */
		end: function( event, options ) {
			options.innerContainer.style.display = "none";
			options.innerContainer.innerHTML = "";
		},

		_teardown: function ( options ) {
			options.container.removeChild( options.innerContainer );
		},
		frame: function(event, options, time){
			var t = time - options.start;
			var opacity = 1;
			if (t < options.fadeIn) {
				opacity = t / options.fadeIn;
			} else if (time > options.end - options.fadeOut) {
				opacity = (options.end - time) / options.fadeOut;
			}
			options.innerContainer.style.opacity = opacity;
		}	 
	});

}( window.Popcorn ));
