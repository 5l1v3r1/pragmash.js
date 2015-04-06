.PHONY: clean test

build/pragmash.js: build
	bash skeletize.sh

build:
	mkdir build

clean:
	$(RM) -r build

test: build/pragmash.js
	node test/tokens_test.js