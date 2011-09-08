(function(b){function c(){}for(var d="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","),a;a=d.pop();)b[a]=b[a]||c})(window.console=window.console||{});


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
		}
		else if (event.clientX !== undefined || event.clientY !== undefined) 	{
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