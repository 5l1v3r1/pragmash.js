#!/bin/bash

# This script encapsulates JavaScript code in a function.
# It provides the code with an exports variable which differs depending on the
# environment.

echo "(function() {

  var exports;
  if ('undefined' !== typeof window) {
    // Browser
    if (!window.pragmash) {
      window.pragmash = {};
    }
    exports = window.pragmash;
  } else if ('undefined' !== typeof self) {
    // WebWorker
    if (!self.pragmash) {
      self.pragmash = {};
    }
    exports = self.pragmash;
  } else if ('undefined' !== typeof module) {
    // Node.js
    if (!module.exports) {
      module.exports = {};
    }
    exports = module.exports;
  }
" >build/pragmash.js

# Read the source file and indent it.
cat src/*.js | sed -e 's/^/  /g' | sed -e 's/[ \t]*$//g' >>build/pragmash.js

echo "" >>build/pragmash.js
echo "})();" >>build/pragmash.js