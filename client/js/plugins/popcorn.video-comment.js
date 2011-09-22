// PLUGIN: Video Comments
(function (Popcorn) {
	
	if (!Popcorn) {
		return;
	}
	
	/**
*
* Custom for Europeana, by Brian Chirls
*
* @param {Object} options
*
* Example:
var p = Popcorn('#video')
.videoComment({
start: 5, // seconds, mandatory
end: 15, // seconds, mandatory
... todo: document htis
} )
*
*/

	var idx = 0;

	Popcorn.plugin( "videoComment" , function( options ) {
		function pad(n) {
			if (n < 10) {
				return '0' + n;
			}
			return n;
		}
		
		if (!options.text) {
			return false;
		}

		var containerDiv, playing;
		var popcorn = this;

		// create a new div this way anything in the target div is left intact
		containerDiv = document.createElement( "div" );
		containerDiv.setAttribute('class', 'video-comment');
		containerDiv.id = "video-comment" + idx;
		containerDiv.style.display = "none";
		containerDiv.setAttribute('lang', options.language);
		idx++;
		
		// ensure the target container the user chose exists
		if ( document.getElementById( options.target ) ) {
			document.getElementById( options.target ).appendChild( containerDiv );
		} else {
			throw ( "comment target container doesn't exist" );
		}
		
		var dateStr, date = new Date(options.date);
		dateStr = pad(date.getDate()) + '.' + pad(date.getMonth() + 1);
		if (date.getFullYear() !== (new Date()).getFullYear()) {
			dateStr += '.' + pad(date.getFullYear());
		}
		var dateTag = document.createElement('time');
		dateTag.setAttribute('datetime', date.getUTCFullYear()+'-'
			+ pad(date.getUTCMonth()+1)+'-'
			+ pad(date.getUTCDate())+'T'
			+ pad(date.getUTCHours())+':'
			+ pad(date.getUTCMinutes())+':'
			+ pad(date.getUTCSeconds())+'Z');
		dateTag.innerHTML = dateStr;
		containerDiv.appendChild(dateTag);

		var author = document.createElement('span');
		author.setAttribute('class', 'author');
		author.appendChild(document.createTextNode(options.author || 'Anonymous'));
		containerDiv.appendChild(author);

		//since this is a custom plugin, we know the data is coming from our server and is safe,
		//so we don't have to clean it up. if you re-use this, make sure you filter the text
		//before putting it in innerHTML
		var p = document.createElement('p');

	//parse out URLs, make them links and shorten the text
		var text = '';
		var urlRegex = /https?:\/\/([a-zA-Z0-9\.]+\.[a-zA-Z]{2,6}[^\s\n\r\t$]*)/gi;
		var parsed, link, lastIndex = 0;
		while (parsed = urlRegex.exec(options.text)) {
			p.appendChild(document.createTextNode(options.text.substr(lastIndex, parsed.index - lastIndex)));
			
			link = document.createElement('a');
			link.setAttribute('href', parsed[0]);
			link.setAttribute('target', '_new');
			
			if (parsed[1].length > 20) {
				link.appendChild(document.createTextNode(parsed[1].substr(0, 17) + '...'));
		} else {
			link.appendChild(document.createTextNode(parsed[1]));
		}
		
		link.addEventListener('click', function() {
			playing = false;
			popcorn.pause();
		}, true);
		
		p.appendChild(link);

			lastIndex = parsed.index + parsed[0].length;
		}
		if (lastIndex < options.text.length) {
			p.appendChild(document.createTextNode(options.text.substr(lastIndex)));
		}
		
		containerDiv.appendChild(p);
		
		p = document.createElement('div');
	p.setAttribute('class', 'flag');
	p.appendChild(document.createTextNode('Flag this as inappropriate'));
	p.addEventListener('click', function() {
		var c = containerDiv.getAttribute('class');
		c = c.split(' ');
		if (c.indexOf('flagged') < 0) {
			c.push('flagged');
			containerDiv.setAttribute('class', c.join(' '));
		}
		
		if (options.flagCallback) {
			options.flagCallback(options.id);
		}
	}, false);
		containerDiv.appendChild(p);

		p = document.createElement('div');
	p.setAttribute('class', 'unflag');
	p.appendChild(document.createTextNode('unflag this comment'));
	p.addEventListener('click', function() {
		var i, c = containerDiv.getAttribute('class');
		c = c.split(' ');
		i = c.indexOf('flagged');
		if (i >= 0) {
			c.splice(i, 1);
			containerDiv.setAttribute('class', c.join(' '));
		}
		
		if (options.flagCallback) {
			options.flagCallback(options.id, true);
		}
	}, false);
		containerDiv.appendChild(p);

	//pause if hover more than 0.5 seconds
	containerDiv.addEventListener('mouseover', function() {
		var timeout = setTimeout(function() {
			playing = !popcorn.media.paused;
			popcorn.media.pause();
		}, 500);
		containerDiv.onmouseout = function() {
			clearTimeout(timeout);
			if (playing) {
				popcorn.media.play();
			}
		};
	}, false);

		return {
			/**
* @member videoComment
* The start function will be executed when the currentTime
* of the video reaches the start time provided by the
* options variable
*/
			start: function( event, options ) {
				containerDiv.style.display = "";
			},
			/**
* @member videoComment
* The end function will be executed when the currentTime
* of the video reaches the end time provided by the
* options variable
*/
			end: function( event, options ) {
				containerDiv.style.display = "none";
			},
			_teardown: function( options ) {
				document.getElementById( options.target ) && document.getElementById( options.target ).removeChild( containerDiv );
			},
			frame: function(event, options, time){
				var t = time - options.start;
				var opacity = 1, margin = 0;
				if (t < 0.5) {
					margin = -207 * (1 - t / 0.5) + 'px';
				} else if (time > options.end - 0.5) {
					opacity = (options.end - time) / 0.5;
				}
				containerDiv.style.marginRight = margin;
				containerDiv.style.opacity = opacity;
			}
		};
	},
	{
		about: {
			name: "Popcorn Video Comments Plugin",
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
			}
		}
	});
}( window.Popcorn ));