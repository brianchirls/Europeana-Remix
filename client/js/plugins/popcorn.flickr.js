// PLUGIN: Flickr
(function (Popcorn) {
  
	if (!Popcorn) {
		return;
	}
	
  /**
* Flickr popcorn plug-in
* Appends a users Flickr images to an element on the page.
* Options parameter will need a start, end, target and userid or username and api_key.
* Optional parameters are numberofimages, height, width, padding, and border
* Start is the time that you want this plug-in to execute (in seconds)
* End is the time that you want this plug-in to stop executing (in seconds)
* Userid is the id of who's Flickr images you wish to show
* Tags is a mutually exclusive list of image descriptor tags
* Username is the username of who's Flickr images you wish to show
* using both userid and username is redundant
* an api_key is required when using username
* Apikey is your own api key provided by Flickr
* Target is the id of the document element that the images are
* appended to, this target element must exist on the DOM
* Numberofimages specify the number of images to retreive from flickr, defaults to 4
* Height the height of the image, defaults to '50px'
* Width the width of the image, defaults to '50px'
* Padding number of pixels between images, defaults to '5px'
* Border border size in pixels around images, defaults to '0px'
*
* @param {Object} options
*
* Example:
var p = Popcorn('#video')
.flickr({
start: 5, // seconds, mandatory
end: 15, // seconds, mandatory
userid: '35034346917@N01', // optional
tags: 'dogs,cats', // optional
numberofimages: '8', // optional
height: '50px', // optional
width: '50px', // optional
padding: '5px', // optional
border: '0px', // optional
target: 'flickrdiv' // mandatory
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



  Popcorn.plugin( "flickr" , function( options ) {
    var containerDiv, //containerDiv is 'position: absolute' to position within frame and fix width/height
        contentDiv,  //contentDiv is 'position: relative' for laying out stuff inside it
        _userid,
        _uri,
        _link,
        _image,
        _count = options.numberofimages || 4 ,
        _height, _width, _top, _left,
        _padding = options.padding || "5px",
        _border = options.border || "0px",
        popcorn = this,
        paused = false,
        otherWindows, bigWindow, littleWindow, keyPress;
        
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
    // this is later populated with Flickr images
    containerDiv = document.createElement( "div" );
    containerDiv.setAttribute('class', 'flickr');
    containerDiv.id = "flickr" + idx;
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
      throw ( "flickr target container doesn't exist" );
    }

    if (options.top || options.left) {
      containerDiv.style.position = 'absolute';
      containerDiv.style.top = options.top;
      containerDiv.style.left = options.left;
    }
	
    contentDiv = document.createElement( "div" );
    contentDiv.style.position = 'relative';
    containerDiv.appendChild(contentDiv);
    
    // get the photos from Flickr API by using the user_id and/or tags
    var getFlickrData = function() {
      _uri = "http://api.flickr.com/services/feeds/photos_public.gne?";
      if ( _userid ) {
        _uri += "id=" + _userid + "&";
      }
      if ( options.tags ) {
        _uri += "tags=" + options.tags + "&";
      }
      _uri += "lang=en-us&format=json&jsoncallback=flickr";
      Popcorn.xhr.getJSONP( _uri, function( data ) {
        contentDiv.innerHTML = "<p style='padding:" + _padding + ";'>" + data.title + "<p/>";
        
        Popcorn.forEach( data.items, function ( item, i ) {
          if ( i < _count ) {

            _link = document.createElement( 'a' );
            _link.setAttribute( 'href', item.link );
            _link.setAttribute( "target", "_blank" );
            _image = document.createElement( 'img' );
            _image.setAttribute( 'src', item.media.m );
            _image.setAttribute( 'height',_height );
            _image.setAttribute( 'width', _width );
            _image.setAttribute( 'style', 'border:' + _border + ';padding:' + _padding );
            _link.appendChild( _image );
            contentDiv.appendChild( _link );

            options.loaded = true; //todo: technically, this shouldn't be true until ALL images have loaded
          } else {

            return false;
          }
        });
      });
    };

    // get the userid from Flickr API by using the username and apikey
    var isUserIDReady = function() {
      if ( !_userid ) {

        _uri = "http://api.flickr.com/services/rest/?method=flickr.people.findByUsername&";
        _uri += "username=" + options.username + "&api_key=" + options.apikey + "&format=json&jsoncallback=flickr";
        Popcorn.getJSONP( _uri, function( data ) {
          _userid = data.user.nsid;
          getFlickrData();
        });

      } else {

        setTimeout(function () {
          isUserIDReady();
        }, 5 );
      }
    };

    // get a single photo from Flickr API by using the photo_id
    // todo: validate photo id before sending request
    var getFlickrPhoto = function() {
      //holds off on getting this data from the network until this part of the video has loaded
      if (popcorn.media && popcorn.media.buffered && popcorn.media.buffered.length) {
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
          setTimeout(getFlickrPhoto, 10);
          return;
        }
      }

      _uri = "http://api.flickr.com/services/rest/?method=flickr.photos.getInfo";
      
      if (options.apikey) {
        _uri += "&api_key=" + options.apikey;
      }
      
      _uri += "&photo_id=" + options.photoid + "&lang=en-us&format=json&jsoncallback=flickr";
      Popcorn.xhr.getJSONP( _uri, function( data ) {
        if (!data || data.stat !== 'ok' || !data.photo) {
          return;
        }
        
        var photo = data.photo;
        var _image = document.createElement('img');
        _image.src = 'http://farm' + photo.farm + '.static.flickr.com/' + photo.server + '/' + photo.id + '_' + photo.secret + '_m.jpg';
        _image.style.width = '100%';

		var url = options.url;
		if (!url) {
			if (photo.urls && photo.urls.url && photo.urls.url[0] && photo.urls.url[0]._content) {
				url = photo.urls.url[0]._content;
			} else {
				url = 'http://www.flickr.com/photos/' + (photo.owner.nsid) + '/' + photo.id + '/';
			}
		}

 		contentDiv.appendChild(_image);
 		
 		var info = document.createElement('div');
 		info.setAttribute('class', 'info');
 		
 		info.innerHTML = '<div class="media"><span class="hiding minimize" style="float: right; margin-right: 20px;">minimize window</span>photo<span class="hiding"> | <span class="popcorn-source">source</span>: <a href="' + url + '" target="_new">Flickr</a></span></div><div><a href="' + url + '" target="_new">' + photo.title._content + '</a></div><div class="watch">view photo</div>';

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
        			height = width * imgHeight / imgWidth;
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
      });
    };
    
    if ( options.url && !options.photoid ) {
    	var regex = /^((https?:\/\/)?(www\.)?flickr\.com\/photos\/[^\/]+\/)?(\d+)/;
    	var match = regex.exec(options.url);
    	if (match && match.length >= 5) {
    	  options.photoid = match[4];
    	}
    }

    if ( options.photoid ) {
      getFlickrPhoto();
    } else if ( options.username && options.apikey ) {
      isUserIDReady();
    }
    else {
      _userid = options.userid;
      getFlickrData();
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
* @member flickr
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
* @member flickr
* The end function will be executed when the currentTime
* of the video reaches the end time provided by the
* options variable
*/
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
      name: "Popcorn Flickr Plugin",
      version: "0.2",
      author: "Scott Downe, Steven Weerdenburg, Annasob",
      website: "http://scottdowne.wordpress.com/"
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
      userid: {
        elem: "input",
        type: "text",
        label: "UserID"
      },
      tags: {
        elem: "input",
        type: "text",
        label: "Tags"
      },
      username: {
        elem: "input",
        type: "text",
        label: "Username"
      },
      apikey: {
        elem: "input",
        type: "text",
        label: "Api_key"
      },
      target: "flickr-container",
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
      padding: {
        elem: "input",
        type: "text",
        label: "Padding"
      },
      border: {
        elem: "input",
        type: "text",
        label: "Border"
      },
      numberofimages: {
        elem: "input",
        type: "text",
        label: "Number of Images"
      }
    }
  });
}( window.Popcorn ));