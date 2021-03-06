/* -*- mode: javascript; c-basic-offset: 4; indent-tabs-mode: t; -*- */

/* adapted from compiz's scale plugin, it's license is: */
/*
 * Copyright © 2005 Novell, Inc.
 *
 * Permission to use, copy, modify, distribute, and sell this software
 * and its documentation for any purpose is hereby granted without
 * fee, provided that the above copyright notice appear in all copies
 * and that both that copyright notice and this permission notice
 * appear in supporting documentation, and that the name of
 * Novell, Inc. not be used in advertising or publicity pertaining to
 * distribution of the software without specific, written prior permission.
 * Novell, Inc. makes no representations about the suitability of this
 * software for any purpose. It is provided "as is" without express or
 * implied warranty.
 *
 * NOVELL, INC. DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE,
 * INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS, IN
 * NO EVENT SHALL NOVELL, INC. BE LIABLE FOR ANY SPECIAL, INDIRECT OR
 * CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
 * OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
 * NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION
 * WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * Author: David Reveman <davidr@novell.com>
 */

var exposeLayer = document.getElementById ("exposeLayer");
var exposeBackground = document.getElementById ("exposeBackground");

var exposeAnimating = false;

var ss = new Object ();


function ScaleAnimation (sw, out, duration) {
    this.sw = sw;
    this.duration = duration;
    this.in = out;

    if (out) {
	this.to_left = this.sw.slot.x1;
	this.to_top = this.sw.slot.y1;
	this.to_width = this.sw.slot.x2 - this.sw.slot.x1;
	this.to_height = this.sw.slot.y2 - this.sw.slot.y1;
	this.to_opacity = 0.4;

	this.from_left = this.sw.orig_left;
	this.from_top = this.sw.orig_top;
	this.from_width = this.sw.orig_width;
	this.from_height = this.sw.orig_height;
	this.from_opacity = this.sw.orig_opacity;
    }
    else {
	this.from_left = this.sw.slot.x1;
	this.from_top = this.sw.slot.y1;
	this.from_width = this.sw.slot.x2 - this.sw.slot.x1;
	this.from_height = this.sw.slot.y2 - this.sw.slot.y1;
	this.from_opacity = this.sw.style.opacity;

	this.to_left = this.sw.orig_left;
	this.to_top = this.sw.orig_top;
	this.to_width = this.sw.orig_width;
	this.to_height = this.sw.orig_height;
	this.to_opacity = this.sw.orig_opacity;
    }

    this.delta_left = this.to_left - this.from_left;
    this.delta_top = this.to_top - this.from_top;
    this.delta_width = this.to_width - this.from_width;
    this.delta_height = this.to_height - this.from_height;
    this.delta_opacity = this.to_opacity - this.from_opacity;
}

ScaleAnimation.prototype = {
    updateProgress: function (progress) {
	var left = this.from_left + this.delta_left * progress;
	var top = this.from_top + this.delta_top * progress;
	var width = this.from_width + this.delta_width * progress;
	var height = this.from_height + this.delta_height * progress;

	this.sw.style.left = left + "px";
	this.sw.style.top = top + "px";
	this.sw.style.width = width + "px";
	this.sw.style.height = height + "px";

	// XXX this next line causes the following error on the console:
	// CSS Error (chrome://compzilla/content/start.xul :0.6): Expected end of value for property but found '0.6'.  Error in parsing value for property 'opacity'.  Declaration dropped.

	//this.sw.style.opacity = opacity;
    }
}

/* for now, just always say windows should be scaled */
function isScaleWin (w) {
    return true;
}

function layoutSlots () {

    ss.slots = new Array ();
    var nSlots = 0;

    var lines = Math.floor (Math.sqrt (ss.windows.length + 1));

    var x1 = 0;
    var y1 = 0;
    var x2 = screen.width;
    var y2 = screen.height;

    y      = y1 + ss.spacing;
    height = Math.floor (((y2 - y1) - (lines + 1) * ss.spacing) / lines);

    for (i = 0; i < lines; i++) {
	n = Math.min (ss.windows.length - nSlots,
		      Math.ceil (ss.windows.length / lines));

	x     = x1 + ss.spacing;
	width = Math.floor (((x2 - x1) - (n + 1) * ss.spacing) / n);

	for (var j = 0; j < n; j++) {
	    var new_slot = new Object ();
	    new_slot.x1 = x;
	    new_slot.y1 = y;
	    new_slot.x2 = x + width;
	    new_slot.y2 = y + height;
	    new_slot.filled = false;

	    nSlots = ss.slots.push (new_slot);

	    x += width + ss.spacing;
	}

	y += height + ss.spacing;
    }
}

function findBestSlots () {

    var d;
    var d0 = 0;

    var sx, sy, cx, cy;

    for (var i = 0; i < ss.windows.length; i++) {
	w = ss.windows[i];

	if (w.slot != null)
	    continue;

	w.sid      = 0;
	w.distance = /* XXX something suitably large since there's no MAXSHORT */ 9999999;

	for (var j = 0; j < ss.slots.length; j++) {
	    if (!ss.slots[j].filled) {
		sx = (ss.slots[j].x2 + ss.slots[j].x1) / 2;
		sy = (ss.slots[j].y2 + ss.slots[j].y1) / 2;

		cx = w.orig_left + w.orig_width  / 2;
		cy = w.orig_top + w.orig_height / 2;

		cx -= sx;
		cy -= sy;

		d = Math.sqrt (cx * cx + cy * cy);

		if (d0 + d < w.distance) {
		    w.sid      = j;
		    w.distance = Math.floor (d0 + d);
		}
	    }
	}

	d0 += w.distance;
    }
}

function fillInWindows () {
    var width, height;
    var sx, sy, cx, cy;

    for (i = 0; i < ss.windows.length; i++) {
	w = ss.windows[i];

	if (w.slot == null) {
	    if (ss.slots[w.sid].filled)
		return true;

	    w.slot = ss.slots[w.sid];

	    width  = w.offsetWidth  /*+ w.input.left + w.input.right*/;
	    height = w.offsetHeight /*+ w.input.top  + w.input.bottom*/;

	    sx = (w.slot.x2 - w.slot.x1) / width;
	    sy = (w.slot.y2 - w.slot.y1) / height;

	    w.slot.scale = Math.min (Math.min (sx, sy), 1.0);

	    sx = width  * w.slot.scale;
	    sy = height * w.slot.scale;
	    cx = (w.slot.x1 + w.slot.x2) / 2;
	    cy = (w.slot.y1 + w.slot.y2) / 2;

	    //cx += w.input.left * w.slot.scale;
	    //cy += w.input.top  * w.slot.scale;

	    w.slot.x1 = cx - sx / 2;
	    w.slot.y1 = cy - sy / 2;
	    w.slot.x2 = cx + sx / 2;
	    w.slot.y2 = cy + sy / 2;

	    w.slot.filled = true;

	    w.lastThumbOpacity = 0.0;

	    w.adjust = true;
	}
    }

    return false;
}

function compareWindowsDistance (a, b)
{
    return a.distance - b.distance;
}

function layoutThumbs () {
    ss.windows = new Array ();

    /* add windows scale list, top most window first */
    for (var swi = 0; swi < ss.reverseWindows.length; swi ++) {
	var sw = ss.reverseWindows[swi];

	if (sw.slot != null)
	    sw.adjust = true;

	sw.slot = null;

	if (!isScaleWin (sw))
	    continue;

	ss.windows.push (sw);
    }

    if (ss.windows.length == 0)
	return false;

    /* create a grid of slots */
    layoutSlots ();

    do {
	/* find most appropriate slots for windows */
	findBestSlots ();

	ss.windows.sort (compareWindowsDistance);

    } while (fillInWindows ());

    return true;
}

function scaleTerminate () {
    if (exposeAnimating)
	return false;

    if (ss.state != "none") {

	sb = new NIHStoryboard ();

	for (var swi = 0; swi < ss.windows.length; swi++) {
	    var sw = ss.windows[swi];
	    if (sw.slot != null) {
		// animate the scaled windows back to their original spots
		sb.addAnimation (new ScaleAnimation (sw, false, 400));
	    }
	}

	sb.completed = function () {
	    exposeAnimating = false;
	    for (var i = 0; i < ss.windows.length; i ++) {
		ss.windows[i].orig_window.style.opacity = ss.windows[i].orig_opacity;
		ss.windows[i].ondestroy ();
		ss.windows[i].slot = null;
		exposeLayer.removeChild (ss.windows[i]);
	    }
	    ss.reverseWindows = new Array ();
	    ss.state = "none";

	    exposeLayer.style.display = "none";
	}

	sb.start ();
    }

    return false;
}

function scaleInitiateCommon ()
{
    if (exposeAnimating)
	return false;

    ss.state = "out";

    if (!layoutThumbs ()) {
	ss.state = "wait";
	return false;
    }

    exposeLayer.style.display = "block";

    sb = new NIHStoryboard ();

    // animate the contents moving to the right place
    for (var swi = 0; swi < ss.windows.length; swi++) {
	var sw = ss.windows[swi];
	if (sw.slot != null) {
	    sw.orig_window.style.opacity = 0.0;
	    sb.addAnimation (new ScaleAnimation (sw, true, 400));
	}
    }
    sb.completed = function () {
	exposeAnimating = false;
	for (var swi = 0; swi < ss.windows.length; swi++) {
	    var sw = ss.windows[swi];

	    sw.addEventListener ("mouseover",
				 function (event) {
				     event.currentTarget.setAttributeNS (_PYRO_NAMESPACE, 
									 "selected-item", 
									 "true");
				     event.stopPropagation ();
				     event.preventDefault ();
				 },
				 true);

	    sw.addEventListener ("mouseout",
				 function (event) {
				     event.currentTarget.setAttributeNS (_PYRO_NAMESPACE, 
									 "selected-item", 
									 "false");
				     event.stopPropagation ();
				     event.preventDefault ();
				 },
				 true);

	    sw.addEventListener ("mousedown",
				 function (event) {
				     event.currentTarget.orig_window.doFocus ();
				     scaleSelectedWindow = event.currentTarget;
				     scaleTerminate ();

				     event.stopPropagation ();
				     event.preventDefault ();
				 },
				 true);
	}
	ss.state = "wait";
    };
    sb.start ();
    return false;
}

function scaleInitiateAll ()
{
    if (ss.state != "wait" && ss.state != "out") {
	ss.type = "all";
	return scaleInitiateCommon ();
    }
    
    return false;
}

function scaleAddWindow (w) {
    var sw = CompzillaWindowContent (w.content.nativeWindow);

    sw.className = "exposeItem";

    sw.orig_window = w;

    sw.orig_left = w.offsetLeft + w.content.offsetLeft;
    sw.orig_top = w.offsetTop + w.content.offsetTop;
    sw.orig_width = w._contentBox.offsetWidth; /* XXX need a getter */
    sw.orig_height = w._contentBox.offsetHeight;
    sw.orig_opacity = 1.0; /* document.defaultView.getComputedStyle (w, null).getPropertyValue ("opacity");*/

    sw.style.left = sw.orig_left + "px";
    sw.style.top = sw.orig_top + "px";
    sw.style.width = sw.orig_width + "px";
    sw.style.height = sw.orig_height + "px";
    sw.width = sw.orig_width;
    sw.height = sw.orig_height;

    sw.scale = 1;
    sw.tx = sw.ty = 0;
    sw.xVelocity = sw.yVelocity = 0;
    sw.scaleVelocity = 1;

    exposeLayer.appendChild (sw);

    ss.reverseWindows.push (sw);
}

function scaleStart () {
    exposeLayer.style.display = "block";

    for (var el = windowStack.firstChild; el != null; el = el.nextSibling) {
	if (el.className == "uiDlg" /* it's a compzillaWindowFrame */
	    && el.content.nativeWindow /* it has native content */
	    && el.style.display == "block" /* it's displayed */) {
	    scaleAddWindow (el);
	}
    }

    scaleInitiateAll ();
}

ss.state = "none";
ss.reverseWindows = new Array ();
ss.spacing = 10;
ss.opacity = 1.0;
ss.speed = 1.5;
ss.timestep = 1.2;

function toggleScale () {
    if (ss.state == "none") {
	scaleStart ();
    } else {
	scaleTerminate ();
    }
}
