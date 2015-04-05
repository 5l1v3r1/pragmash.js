build/pragmash.js: build
	bash skeletize.sh

build:
	mkdir build

clean:
	$(RM) -r build