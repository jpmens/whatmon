DIST=whatmon-ff-tb

all:

xpi: version
	./build-xpi


push:
	git push github master
