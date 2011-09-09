/*
 *  loaderator.js
 *
 *  Loaderator - Javascript Library for asynchronously loading remote resources
 *  
 *  Developer: Brian Chirls http://chirls.com
 *  GitHub: https://github.com/brianchirls/loaderator.js
 *  License: MIT
 *  
 *  Copyright (c) 2011 Brian Chirls
 *  
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *  
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *  
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 *  
 */

(function( window, undefined ) {

"use strict";

var _ldr8r_helper;

var document = window.document;
var console = window.console;
if (console === undefined) {
	console = {
		log: function(s) {
			
			return;
		}
	};
}

var urlRegex = /^(([A-Za-z]+):\/\/)+(([a-zA-Z0-9\._\-]+\.[a-zA-Z]{2,6})|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})|localhost)(\:([0-9]+))*(\/[^#]*)?(\#.*)?$/;

/*	We're going to use indexOf later, so let's make sure we have it.
	from: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/IndexOf#Compatibility */
if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(searchElement /*, fromIndex */) {
		
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
			} else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0)) {
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
	};
}

function Loaderator(resource, category, listener) {
	this.categories = {};
	this.resources = {};
	this.eventListeners = [];
	this.loadingCount = 0;
	this.callbackQueue = [];
	this._head = document.getElementsByTagName('head')[0];
	if (resource) {
		this.load(resource, category, listener);
	}
}
window.Loaderator = Loaderator;

Loaderator.Category = function(name, loader) {
	this.name = name;
	this.resources = [];
	this.resourcesById = {};
	this.loader = loader;
	this.eventListeners = {
		load: [],
		single: {}
	};
};

Loaderator.Category.prototype.addResource = function(resource) {
	//make sure this is not in here already
	var id = resource.id || resource.url;
	if (!this.resourcesById[id]) {
		this.resources.push(resource);
		this.resourcesById[id] = resource;
		resource.categories.push(this);
	}
};

Loaderator.Category.prototype.checkForAllLoaded = function() {
	var i, j;
	
	if (this.loader.loadingCount) {
		if (this.loader.callbackQueue.indexOf(this) < 0) {
			this.loader.callbackQueue.push(this);
		}
		return;
	}

	var resources = this.resources;
	i = resources.length;
	if (!i) { return; }

	var listeners = this.eventListeners.load;
	j = listeners.length;
	if (!j) { return; }

	for (i--; i >= 0; i--) {
		if (!resources[i].loaded) { return; }
	}
	
	//I'm not sure if this is useful at all.  The whole listener.async thing might be removed
	var makeTimeoutCallback = function(listener, loader, resources) {
		return function() {
			listener.call(loader,resources);
		};
	};
	
	var listener;
	for (j--; j >= 0; j--) {
		listener = listeners.pop();
		if (listener.async) {
			setTimeout(makeTimeoutCallback(listener, this.loader,this.resourcesById), 0);
		} else {
			listener.call(this.loader,this.resourcesById);
		}
	}
};

Loaderator.prototype.setBase = function(href) {
	var bases = document.getElementsByTagName('base');
	var base;
	var i;
	var matches;

	this.base = null;
	if (href) {
		matches = urlRegex.exec(href);
		if (matches) {
			this.base = {};
			this.base.protocol = matches[2] + ':';
			this.base.hostname = matches[3];
			this.base.port = matches[7] || '';
			this.base.host = this.base.hostname + (this.base.port ? ':' + this.base.port : '');
			this.base.pathname = matches[8];
		}
	} else {
		for (i = 0; i < bases.length; i++) {
			base = bases.item(i);
			href = base.getAttribute('href');
			if (href) {
				matches = urlRegex.exec(href);
				if (matches) {
					this.base = {};
					this.base.protocol = matches[2] + ':';
					this.base.hostname = matches[3];
					this.base.port = matches[7] || '';
					this.base.host = this.base.hostname + (this.base.port ? ':' + this.base.port : '');
					this.base.pathname = matches[8];
					break;
				}
			}
		}
	}
	if (!this.base) {
		this.base = {};
		this.base.protocol = window.location.protocol;
		this.base.host = window.location.host;
		this.base.port = window.location.port;
		this.base.hostname = window.location.hostname;
		this.base.pathname = window.location.pathname;
	}
	var pathArray = this.base.pathname.split('?');
	pathArray = pathArray[0].split('/');
	pathArray.pop();
	this.base.directory = pathArray.join('/');

	return this;
};

Loaderator.prototype.resolveUrl = function(url) {
	if (!this.base) {
		this.setBase();
	}
	
	if (urlRegex.test(url)) {
		return url;
	}

	var base = this.base;
	var urlSplit = url.split('/');
	
	if (urlSplit.length && urlSplit[0] === '' ) {
		return base.protocol + '//' + base.host + url;
	}
	
	var dir = base.directory.split('/');
	var i;
	for (i = 0; i < urlSplit.length; i++) {
		if (urlSplit[i] === '..') {
			dir.pop();
		} else if (urlSplit[i] !== '.') { //do nothing if directory specified is '.'
			dir.push(urlSplit[i]);
		}
	}
	return base.protocol + '//' + base.host + dir.join('/');
};

/* Helper function to check if CSS is loaded
   http://stackoverflow.com/questions/2635814/javascript-capturing-load-event-on-link
*/
var cssLoad = function(link, callback) {
    var cssLoaded = false;
    try{
        if ( link.sheet && link.sheet.cssRules.length > 0 ){
            cssLoaded = true;
        }else if ( link.styleSheet && link.styleSheet.cssText.length > 0 ){
            cssLoaded = true;
        }else if ( link.innerHTML && link.innerHTML.length > 0 ){
            cssLoaded = true;
        }
    }
    catch(ex){ }
    if ( cssLoaded ){
        callback();
    }else{
        setTimeout(function(){
            cssLoad(link, callback);
        }, 10);
    }
};

Loaderator.prototype.loaders = {
	script: function(resource) {
		var that = this;
		if (!resource.element) {
			//todo: look through script elements to see if this is loaded somewhere else
			var script = document.createElement('script');
			script.type = resource.mime || 'text/javascript';
			script.id = resource.id || resource.categories[0].name + '-' + resource.categories[0].resources.length;
			resource.element = script;
			script.src = resource.fullUrl;
			this._head.appendChild(script);
		}
		resource.element.onreadystatechange = function () {
			if (this.readyState === 'complete' || this.readyState === 4){
				if (!resource.loaded) {
					that.resLoadCallback(resource, this);
				}
			} else {
				//console.log('script readystate = ' + this.readyState + ' - ' + resource.fullUrl);
			}
		};
		resource.element.onload = function() {
			if (!resource.loaded) {
				that.resLoadCallback(resource, this);
			}
		};

		/*
		resource.element.oninvalid= function(arg) {
			console.log('invalid: ' + resource.fullUrl);
			console.log(arg);
		}
		resource.element.onerror= function(arg) {
			console.log('error: ' + resource.fullUrl);
			console.log(arg);
		}
		*/
	},

	css: function(resource) {
		//make sure not to load the same stylesheet twice
		var i, max, link,
			allLinks = document.getElementsByTagName('link');
		for (i = 0, max = allLinks.length; i < max; i++) {
			link = allLinks.item(i);
			if (link.getAttribute('rel').toLowerCase() === 'stylesheet') {
				if (link.href === resource.fullUrl) {
					resource.element = link;
					break;
				}
			}
		}

		if (!resource.element) {
			var that = this;
			link = document.createElement('link');
			link.type = resource.mime || 'text/css';
			link.setAttribute('rel','stylesheet');
			link.id = resource.id || resource.categories[0].name + '-' + resource.categories[0].resources.length;
			link.href = resource.fullUrl;
			resource.element = link;
			this._head.appendChild(link);
			/*
			resource.element.onreadystatechange= function () {
				if (this.readyState === 'complete' || this.readyState === 4){
					that.resLoadCallback(resource, this);
				}
			};
			resource.element.onload= function() {
				that.resLoadCallback(resource, this);
			};
			*/
			//unfortunately, we have to use a timeout here, since there is no onload event for <link>
			cssLoad(link, function() {
				that.resLoadCallback(resource, this);
			});
		}
		return true;
	},
	
	ajax: function(resource) {
		if (!resource.element) {
			var that = this;
			var xmlhttp = new XMLHttpRequest();
			resource.element = xmlhttp;
			//todo: allow for post, username/password, etc
			xmlhttp.open("GET",resource.fullUrl,true);
			xmlhttp.onreadystatechange = function() {
				if (xmlhttp.readyState === 4) {
					that.resLoadCallback(resource, this);
				}
			};
			xmlhttp.send(null);
		}
	},
	
	object: function(resource) {
		var obj;
		var that = this;
		var i;
		if (!resource.element || !resource.element.tagName) {
			switch (resource.type) {
				//todo: allow multiple 'source' urls for audio and video
				case 'audio':
				case 'video':
					obj = document.createElement(resource.type); //either audio or video
					obj.controls = resource.controls || false;
					obj.loop = resource.loop || false;
					obj.preload = resource.preload || false;
					obj.autobuffer = obj.preload; //deprecated, but just in case we're using an old browser
					obj.doMediaEvents = true;
					obj.id = resource.id || resource.categories[0].name + '-' + resource.categories[0].resources.length;
					if (resource.sources) {
						if (Object.prototype.toString.call(resource.sources) !== '[object Array]') {
							resource.sources = [resource.sources];
						}
						for (i = 0; i < resource.sources.length; i++) {
							var source = document.createElement('source');
							source.src = this.resolveUrl(resource.sources[i]);
							obj.appendChild(source);
						}
					} else {
						obj.src = resource.fullUrl;
					}
					obj.doMediaEvents = true;
					obj.load();
					break;
				case 'image':
					obj = new Image();
					obj.src = resource.fullUrl;
					break;
				case 'html':
					obj = document.createElement('iframe');
					obj.src = resource.fullUrl;
					//obj.style.display='none';
					obj.width = 0;
					obj.height = 0;
					document.body.appendChild(obj);
					break;
				default:
					//todo: throw error?  or at least a warning
					console.log('Resource Loader: unknown object type ' + resource.type);
					return false;
			}
			resource.element = obj;
			if (!obj.doMediaEvents) {
				obj.onload = function(event) {
					that.resLoadCallback(resource, event);
				};
			}
		} else {
			//We can accept an existing element to pin our loading event to
			resource.type = resource.element.tagName.toLowerCase();

			if (resource.type === 'img') {
				resource.type = 'image';
			} else if (resource.type === 'iframe') {
				resource.type = 'html';
			} else if (resource.type === 'audio' || resource.type === 'video') {
				resource.element.doMediaEvents = true;
			} else {
				//todo: throw error?  or at least a warning
				console.log('Resource Loader: unknown object type ' + resource.type);
				return false;
			}

			obj = resource.element;
		}
		if (obj.loaded) {
			that.resLoadCallback(resource, event);
		} else if (obj.doMediaEvents) {
			//for now, only firing on canplay.  todo: allow, other events
			obj.addEventListener('canplay',function(event) {
				if (!resource.loaded) {
					that.resLoadCallback(resource, event);
				}
			}, true);
		}
		return true;
	},
	font: function(resource) {
		var that = this;
		_ldr8r_helper.load({
			url: this.base.protocol + '//ajax.googleapis.com/ajax/libs/webfont/1/webfont.js',
			id: 'webfont-script',
			type: 'script',
			mode: 'script'
		},'webfont');
		_ldr8r_helper.addEventListener('webfont',function() {
			//console.log('Loaded WebFont trying ' + resource.fullUrl);
			var i;
			var familiesToLoad = resource.families.concat([]);
			//console.log(familiesToLoad);

			//only load the css if it hasn't been loaded already
			var max, link, fullUrl, found = false, urls = [];
			var allLinks = document.getElementsByTagName('link');
			for (i = 0, max = allLinks.length; i < max; i++) {
				link = allLinks.item(i);
				if (link.getAttribute('rel').toLowerCase() === 'stylesheet') {
					fullUrl = link.href; //this.resolveUrl(link.getAttribute('href'));
					if (fullUrl === resource.fullUrl) {
						found = true;
						break;
					}
				}
			}
			if (!found) {
				urls.push(resource.fullUrl);
			}
			
			WebFont.load({
				custom: {
					families: resource.families,
					urls: urls
				},
				fontactive: function(familyName, fvd) {
					//console.log('fontactive:' + familyName);
					for (i = 0; i < familiesToLoad.length; i++) {
						if (familiesToLoad[i] === familyName) {
							familiesToLoad.splice(i,1);
							break;
						}
					}
					if (!familiesToLoad.length) {
						that.resLoadCallback(resource, this);
					}
				},
				fontinactive: function(familyName, fvd) {
					console.log('problem loading font:' + familyName);
				},
				inactive: function() {
					console.log('WebFonts are inactive!');
				},
				active: function() {
					//console.log('WebFonts are Active! This is great!');
				}
			});
		});
	}
};

Loaderator.prototype.extensionTypes = {
	'js':	'script',
	//'vs':	'script',
	//'fs':	'script',
	'ogg':	'audio',
	'mp3':	'audio',
	'wav':	'audio',

	'ogv':	'video',
	'webm':	'video',
	'mp4':	'video',

	'jpg':	'image',
	'jpeg':	'image',
	'png':	'image',
	'gif':	'image',
	
	'css':	'style',

	'xml':	'xml',
	'xhtml':'xml',

	'json':	'json',

	'txt':	'text',

	'html':	'html'
	
};

Loaderator.prototype.load = function(resource, category, listener) {
	var resources;
	if (Object.prototype.toString.call(resource) === '[object Array]') {
		resources = resource;
	} else if (resource) {
		resources = [resource];
	} else {
		return this;
	}

	this.loadingCount += 1;
	
	var res, thisResource, categories, resCategories, cat;
	var i, hash;
	var returnResources = [];
	for (i = 0; i < resources.length; i++) {
		res = resources[i];
		if (res) {
			if (Object.prototype.toString.call(res) === '[object String]' || typeof res === 'string') {
				res = {
					url: res
				};
			}
			
			if (res.url) {
				var fullUrl;
				if (res.fullUrl === undefined) {
					fullUrl = this.resolveUrl(res.url);
				}
				hash = '';
				/*
					Sometimes we might have multiple resources with the same URL, if they're running in different modes.  For example, WebFonts API requires us to index font resources by URL of the style sheet, and we may want to process that separately as CSS.
					
					todo: what happens if we get different resources with the same id?
				*/
				thisResource = this.resources[fullUrl];
				if (thisResource &&
					(!res.mode || res.mode === thisResource.mode)) {
					//this resource already exists.  no duplicates
					resources[i] = thisResource;
					
					//todo: if new resource specifies preload, then go back in to the existing element and pre-load it
				} else {
					//this is a new resource

					if (thisResource) {
						hash = '#' + res.mode;
					}

					thisResource = res;
					thisResource.Loaderator = this;
					this.resources[fullUrl + hash] = thisResource;
					thisResource.fullUrl = fullUrl;
	
					if (!res.type) {
						//try to guess type based on file extension
						var extension = res.fullUrl.split('.');
						if (extension.length > 1) {
							extension = extension.pop().toLowerCase();
						}
						
						//todo: is it faster to put this in a switch?
						res.type = this.extensionTypes[extension] || 'text';
					}
					
					if (!res.mode) {
						//try to guess mode based on type
						switch(res.type) {
							case 'script':
								res.mode = 'script'; break;
							case 'style':
							case 'css':
								res.mode = 'css'; break;
							case 'audio':
							case 'video':
							case 'image':
							case 'html':
								res.mode = 'object'; break;
							case 'xml':
							case 'json':
							case 'text':
								res.mode = 'ajax'; break;
							default:
								res.mode = 'ajax';
						}
					}
				}
			} else if (res.loader) {
				thisResource = res;
			} else {
				thisResource = false;
			}
	
			categories = [];
			if (category) {
				categories.push(category);
			}
			
			var c, catName;
			if (res.category) {
				if (Object.prototype.toString.call(res.category) === '[object Array]') {
					resCategories = res.category;
				} else {
					resCategories = [res.category];
				}
				for (c = 0; c < resCategories.length; c++) {
					catName = resCategories[c];
					if ( categories.indexOf(catName) < 0 ) {
						categories.push(catName);
					}
				}
			}
			
			if (!categories.length) {
				categories.push(thisResource.fullUrl);
			}

			if (thisResource && categories.length && (thisResource.loader|| (thisResource.mode && this.loaders[thisResource.mode])) ) {
				for (c = 0; c < categories.length; c++) {
					catName = categories[c];
					//set up category if it hasn't been set up yet
					cat = this.categories[catName] || (this.categories[catName] = new Loaderator.Category(catName, this));
					if (thisResource.categories === undefined) { thisResource.categories = []; }
					//thisResource.categories.push(cat);
					cat.addResource(thisResource);
				}
		
				if (thisResource.loader) {
					//todo: use provided loader function
				} else if (thisResource.fullUrl) {
					//console.log('Loaderator: attempting to load ' + thisResource.fullUrl);
					if (this.loaders[thisResource.mode].call(this, thisResource)) {
						returnResources.push(thisResource);
					}
				}
			}
		}
	}
	
	if (listener !== undefined && Object.prototype.toString.call(listener) === '[object Function]' && category !== undefined) {
		this.addEventListener(category, listener);
	}
	
	this.loadingCount -= 1;
	
	while (this.callbackQueue.length) {
		cat = this.callbackQueue.splice(0, 1)[0].checkForAllLoaded();
	}
	
	return this;
};

Loaderator.prototype.resLoadCallback = function(resource, event) {
	resource.loaded = true;
	resource.event = event;
	var i, len;
	//console.log('Loaded resource: ' + (resource.id || resource.url));

	//first run any callbacks registered for all incoming events
	len = this.eventListeners.length;
	for (i = 0; i < len; i++) {
		//todo: figure out what to do about 'this' for event listener
		this.eventListeners[i].call(this,resource);
	}

	//I'm not sure if this is useful at all.  The whole listener.async thing might be removed
	var makeTimeoutCallback = function(listener, loader, resource) {
		return function() {
			listener.call(loader,resource);
		};
	};
	
	//next fire any single-resource events for this resource
	len = resource.categories.length;
	var listeners;
	for (i = 0; i < len; i++) {
		var catListeners, cat, l;
		cat = resource.categories[i];
		catListeners = cat.eventListeners.single;
		if ( (resource.id && (listeners = catListeners[resource.id])) ||
			(listeners = catListeners[resource.url]) ||
			(listeners = catListeners[resource.fullUrl])) {
			for (l = 0; l < listeners.length; l++) {
				var listener = listeners[l];
				if (listener.async) {
					setTimeout(makeTimeoutCallback(listener, this,resource), 0);
				} else {
					listener.call(this,resource);
				}
			}
		}
	}
	
	//finally, fire any events for all resources in a category loaded
	for (i = 0; i < len; i++) {
		resource.categories[i].checkForAllLoaded();
	}
};

Loaderator.prototype.addEventListener = function(event, listener, async) {
	if (!listener || Object.prototype.toString.call(listener) !== '[object Function]') { return this; }
	
	var i;

	listener.runAsync = async || false;

	if (event === '*') {
		this.eventListeners.push(listener);
	} else {
		if (typeof event === 'string') {
			event = event.split(':');
		}
		var catName = event[0];
		var category = this.categories[catName] || (this.categories[catName] = new Loaderator.Category(catName, this));
		
		var resourceName = event.length > 1 ? event[1] : false;
		if (resourceName) {
			//this is an event for a single resource. these only get fired once
			
			//first, see if this resource has already loaded
			var resource, res;
			if (!(resource = category.resourcesById[resourceName])) {
				for (i = category.resources.length - 1; i >= 0; i--) {
					res = category.resources[i];
					if (res !== undefined && res.fullUrl === resourceName) {
						resource = res;
						break;
					}
				}
			}
			if (resource && resource.loaded) {
				//the resource has already finished loading, so just fire the event right away
				if (async) {
					setTimeout(function() {
						listener.call(this,resource);
					}, 0);
				} else {
					listener.call(this,resource);
				}
			} else {
				//this resource has not yet loaded, so save the event for later
				var eventQueue =  category.eventListeners.single[resourceName] || (category.eventListeners.single[resourceName] = []);
				eventQueue.push(listener);
			}
		} else {
			//only fire this event when ALL registered resources are finished loading
			category.eventListeners.load.push(listener);
			category.checkForAllLoaded();
		}
	}

	return this;
};

var LoaderatorQueue = function(arg) {
	var q = window.LDR8R;
	if (!q) { return; }
	var i;
	for (i = 0; i < q.length; i++) {
		q[i]();
	}
};

LoaderatorQueue.prototype.push = function(fn) {
	if (Object.prototype.toString.call(fn) === '[object Function]') {
		var args = Array.prototype.slice.call(arguments,1);
		fn.apply(null, args);
	}
};

_ldr8r_helper = new Loaderator();

window.LDR8R = new LoaderatorQueue();

}(window));