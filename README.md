# This is whatmon

whatmon is a tiny Firefox extension or add-on, which can
monitor almost anything you wish to monitor. Number of logged on users? Current
load average?  Health of your LDAP servers? Mail server queues? No problem for
whatmon, as long as you can create a CGI program in Perl, C, or any other
language you are comfortable with, or even a PHP or Active-Whatever script
which runs on your web server and can produce a wee bit of XML. There is one
thing that whatmon cannot reliably watch: the web server from which it
retrieves that XML ... :-)

The XML it expects looks like this:

	<whatmon>
	   <code>0</code>
	   <text>Hello 2</text>
	   <xhover>hi, there</xhover>
	   <msgurl>http://mens.de</msgurl>
	</whatmon>

* _code_ is either of 0 (OK), 1 (Warning), 2 (Error)
* _text_ is displayed in the status bar
* _xhover_ (optional) is displayed as a tooltip
* _msgurl_ (optional), will open a new window at the specified URL when _whatmon_ sees the tag.

To build an installable .xpi on UNIX:

	vi version
	make xpi

On Windows you'll have to mess about with the `mxpi.bat' file.

## Further Reading

* [whatmon documentation](http://jpmens.net/pages/whatmon-mozilla-extension-for-monitoring-whatever/)
* [Building an extension](https://developer.mozilla.org/en/Building_an_Extension)
