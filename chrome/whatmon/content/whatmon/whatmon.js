/*
 * whatmon.js (C)2006 - 2008 by Jan-Piet Mens <jpmens at gmail.com>
 *
 * 09-Aug-2006 1.6.0
 *		incorporates heiko weber's patch for alert windows
 * 27-Sep-2006 2.0.0
 *		incorporates ian stirling's patch to support file:// URLs
 *		support for Firefox 2.0 RC1
 *		defaults are set upon installation
 *		changed logo
 * 27-Sep-2006 2.0.1
 *		reverted to original GUID
 *		minor code cleanups
 *		submitted to Mozilla Addons
 * 30-Sep-2006 2.0.2
 *		added preference observer
 *		If no XML data returned by CGI, the issue diagnostic on status bar
 * 15-Sep-2006 2.0.3
 *		click on toolbar forces refresh (suggestion by Petr)
 * 07-Mar-2007 2.0.4
 *		Differing icons depending on level (suggested by "Frangi")
 * 21-Nov-2007 2.0.5
 *		install.rdf Support for Thunderbird 2.0 (LewS)
 *		install.rff Support for Firefox 3 (JP)
 *		click on whatmon does not add a new timer (Scott Carpenter)
 *		whatmon.css: max-width: auto (Scott Carpenter)
 *
 * 04-Dec-2007 2.0.6
 *		Hover over whatmon status bar shows content of XML's `xhover'
 *	    content (suggested by Jeremy Vanderb)
 * 19-Apr-2008 3.0.0
 * 		Show whatmon status as "Loading..." (w/ tooltip containing time)
 * 		when XMLHTTP request is launched; allows user to detect unresponsive
 * 		servers. [idea and code by "bitbyte"]
 * 		Many thanks to Sebastian A. who had excellent ideas, most
 * 		of which had unfortunately already been implemented. :-)
 * 21-Apr-2008 3.0.1
 *		Forgot to try/catch xhover; bug spotted by Scott Crevier
 * 18-Apr-2008 3.0.4
 *      Options dialog provided by Gábor Lipták
 *      Bumped to official Firefox 3.0.*
 * 26-Jul-2009 3.1.0
 *		Bumped to official Firefox 3.5.*
 */
 
var update_interval = (5*60 * 1000);        // The interval, in ms, to update the counter.
var url;
var request = false;
var msgwin = null;
var alertWindowName = 'WhatMonAlertWindow';
var whatmonhover = '';

var prefOb =
{
	register: function()
	{
		var prefService = Components.classes["@mozilla.org/preferences-service;1"].
						getService(Components.interfaces.nsIPrefService);
		this._branch = prefService.getBranch("whatmon.");
		this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this._branch.addObserver("", this, false);
	},
	
	unregister: function()
	{
		if (!this._branch)
			return;
		this._branch.removeObserver("", this);
	},
	
	observe: function(aSubject, aTopic, aData)
	{
		// Get the root branch
		prefs = Components.classes['@mozilla.org/preferences-service;1'].
						getService(Components.interfaces.nsIPrefBranch);

		if (aTopic != "nsPref:changed")
			return;
		
		// aData is the name of the pref that has changed relative to aSubject
		switch (aData) {
			case "refresh":
				update_interval = prefs.getIntPref('whatmon.refresh');
				update_interval = update_interval * 1000;		// make ms
				wm_tooltip();
				get_whatmon();
				break;
			case 'url':
				url = prefs.getCharPref('whatmon.url');
				wm_tooltip();
				get_whatmon();
				break;
		}
	}
}

function loadwhatmon() {
	if (window.statusbar && window.statusbar.visible == true) {
		var userid = 'unknown';
		var server;
		var prefs;
		var bar = document.getElementById('whatmon');

		// Get the root branch
		prefs = Components.classes['@mozilla.org/preferences-service;1'].
						getService(Components.interfaces.nsIPrefBranch);

		try {
			update_interval = prefs.getIntPref('whatmon.refresh');
			update_interval = update_interval * 1000;		// make ms
		} catch (e) {
			update_interval = (5*60 * 1000);
		}
    	
		try {
			url = prefs.getCharPref('whatmon.url');
		}
		catch (e) {
			url = 'http://fupps.com/extensions/whatmon/whatmon-alert.php';
		}

		whatmonhover = 'whatmon ' + url + ' (' + (update_interval / 1000) + 's)';
		bar.style.color = '#0000CA';
		wm_tooltip();
	
		window.setTimeout(get_whatmon, 5000);
		prefOb.register();
	}
}

function wm_tooltip()
{
	var bar = document.getElementById('whatmon');

	// Change tooltiptext and add refresh seconds
	bar.setAttribute('tooltiptext', whatmonhover);
}

function get_whatmon()
{
	load_xml(url);
	setTimeout('get_whatmon()', update_interval);
}

function load_xml(url)
{
	/* When the XMLHTTP request times out, we didn't update the
	 * status bar, continuing to show the old <text>. Replace
	 * text with "Loading..." whenever whatmon fetches new data;
	 * if there is a timeout, that doesn't get replaced, so user
	 * notices it. [suggested by "bitbyte"]
	 */

	var bar = document.getElementById('whatmon');

	 bar.setAttribute('label', 'Loading...');
	 bar.setAttribute('tooltiptext', 'whatmon @ ' + wmtime() + ' - ' + url  +
	 		' (' + (update_interval / 1000) + 's)');

	request = new XMLHttpRequest();
	// request.overrideMimeType('text/xml');
	request.onreadystatechange = process_request;
	request.open('GET', url, true);
	request.send(null);
}

// This function is called once the request state changes.
function process_request()
{
	var fld = document.getElementById('whatmon');
	var msg;
	var httstatus = 200;
	
				// Patch by Ian to support file:// URLs
	if (url.toLowerCase().indexOf("file://") == 0) {
		httstatus = 0;
	}
		
	try {
		if (request.readyState == 4 && request.status == httstatus) {
			var response = request.responseXML;
			if (response == null) {
				fld.style.color = '#FF0000';
				fld.setAttribute('label', 'no XML data');
			} else {
				var whatmon = response.getElementsByTagName('whatmon')[0];
				var wh;
				
				try {
					wh = whatmon.getElementsByTagName('xhover')[0].firstChild.data;
					if (wh == null) {
						wh = '';
					}
				} catch (e) {
					wh = '';
				}
				whatmonhover = wh;
				wm_tooltip();
				
					
				var code = whatmon.getElementsByTagName('code')[0].firstChild.data;
				if (code == 2) {
					fld.style.color = '#FF0000';	// Red
					fld.style.listStyleImage = 'url("chrome://whatmon/skin/whatmon16red.png")';
				} else if (code == 1) {
					fld.style.color = '#919100';	// Yellow
					fld.style.listStyleImage = 'url("chrome://whatmon/skin/whatmon16yellow.png")';
				} else {
					fld.style.color = '#008000';	// Green
					fld.style.listStyleImage = 'url("chrome://whatmon/skin/whatmon16.png")';
				}
				var text = whatmon.getElementsByTagName('text')[0].firstChild.data;
				fld.setAttribute('label', text);
				
				var msgurl = whatmon.getElementsByTagName('msgurl')[0].firstChild.data;
				if (msgurl != null) {
					openAlertWindow(msgurl);
				}
			}
		} else {
			msg = '';
			if (request.readyState == 4) {
				msg = request.status;
				fld.style.color = '#FF0000';
				fld.setAttribute('label', msg);
			
			}
			
		}
		if (request.readyState == 4) {
			request = false;
		}
	}
	catch (e) {
		
	}
}

function openAlertWindow(murl)
{
	if (msgwin == null || msgwin.closed == true) {
		msgwin = window.open(murl, 
			alertWindowName,
			'width=700,height=600,left=100,top=100,location=no,statusbar=no');
	} else {
		msgwin.location.href = murl;
		msgwin.focus();
	}
}

/*
 * whatmonrefresh() is called upon a click on the statusbar
 */
 
function whatmonrefresh()
{
	wm_tooltip();
	// get_whatmon();  // Noted by Scott Carpenter: adds another timer
	load_xml(url);
}

/* wmtime()
 * code by "bitbyte"
 */

function wmtime() {
	var d = new Date();
	var hour = d.getHours();
	var minute = d.getMinutes();
	var second = d.getSeconds();
	var t = ((hour < 10) ? "0" : "") + hour;
	t += ((minute < 10) ? ":0" : ":") + minute;
	t += ((second < 10) ? ":0" : ":") + second;

	return t;
} 
