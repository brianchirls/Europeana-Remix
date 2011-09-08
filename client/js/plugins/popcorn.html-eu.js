// PLUGIN: html

(function (Popcorn) {
	
	if (!Popcorn) {
		return;
	}
	
	/**
	 * HTML popcorn plug-in 
	 * Custom for Europeana Otto and Bernard project
	 * Handles fades and multiple languages
	 * Display arbitrary HTML
	 * 
	 * @param {Object} options
	 * 
	 * Example:
		 var p = Popcorn('#video')
				.subtitle({
				//todo: fill this in
				} )
	 *
	 */

	Popcorn.plugin( "html" , {
		
		manifest: {
			about:{
				name: "Popcorn html Plugin",
				version: "0.1",
				author: "Brian Chirls",
				website: "http://chirls.com/"
			},
			options:{
				start : {elem:'input', type:'text', label:'In'},
				end : {elem:'input', type:'text', label:'Out'},
				target : 'html-container',
				html : {elem:'input', type:'text', label:'Text'},
				fadeIn : {elem:'input', type:'text', label:'Text'},
				fadeOut : {elem:'input', type:'text', label:'Text'}
			}
		},

		_setup: function( options ) {

			// Creates a div for all Lower Thirds to use
/*
			if ( !this.container ) {
				this.container = document.createElement('div');

				this.video.parentNode.appendChild( this.container );
			}
*/
			// if a target is specified, use that
			if ( options.target && options.target !== 'html-container' ) {
				options.container = document.getElementById( options.target );
			} else { // use shared default container
				options.container = this.container;
			}

			var duration = options.end - options.start;
			if (isNaN(options.fadeIn)) {
				options.fadeIn = 0;
			} else if (options.fadeIn > duration) {
				options.fadeIn = duration;
			}
			duration -= options.fadeIn;
			if (isNaN(options.fadeOut)) {
				options.fadeOut = 0;
			} else if (options.fadeOut > duration) {
				options.fadeIn = duration;
			}

			options.div = document.createElement('div');
			if (options.className) {
				options.div.setAttribute('class',options.className);
			}
			options.div.style.display = 'none';
			options.div.innerHTML = options.html;
			options.container.appendChild(options.div);
		},
		/**
		 * @member lowerthird
		 * The start function will be executed when the currentTime
		 * of the video reaches the start time provided by the
		 * options variable
		 */
		start: function(event, options){
			options.div.style.display = '';
		},
		/**
		 * @member lowerthird
		 * The end function will be executed when the currentTime
		 * of the video reaches the end time provided by the
		 * options variable
		 */
		end: function(event, options){
			options.div.style.display = 'none';
		},
		frame: function(event, options, time){
			var t = time - options.start;
			var opacity = 1;
			if (t < options.fadeIn) {
				opacity = t / options.fadeIn;
			} else if (time > options.end - options.fadeOut) {
				opacity = (options.end - time) / options.fadeOut;
			}
			options.div.style.opacity = opacity;
		}	 
	} );

}( window.Popcorn ));
