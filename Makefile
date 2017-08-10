SHELL=/bin/bash

all:
	npm install

clean:
	@rm -rf ./node_modules

TEST_SUITE := $(shell find test/unit/ -name "*.js")
MOCHA_TIMEOUT := 50000

test-kue:
	./node_modules/mocha/bin/mocha -u bdd -t $(MOCHA_TIMEOUT) test/unit/kue.js

test-all:
	./node_modules/mocha/bin/mocha -u bdd -t $(MOCHA_TIMEOUT) $(TEST_SUITE)

