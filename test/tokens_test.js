var assert = require('assert');
var pragmash = require('../build/pragmash.js');

// Test raw tokens.
assert.deepEqual(pragmash.tokenizeLine('a b c'), ['a', 'b', 'c']);
assert.deepEqual(pragmash.tokenizeLine('a\\ b c'), ['a b', 'c']);
assert.deepEqual(pragmash.tokenizeLine('a  b \t c'), ['a', 'b', 'c']);
assert.deepEqual(pragmash.tokenizeLine(' a b c '), ['a', 'b', 'c']);

// Test quoted tokens.
assert.deepEqual(pragmash.tokenizeLine('a "b c" d'), ['a', 'b c', 'd']);
assert.deepEqual(pragmash.tokenizeLine('a "b c"'), ['a', 'b c']);
assert.deepEqual(pragmash.tokenizeLine('"a b c"'), ['a b c']);
assert.deepEqual(pragmash.tokenizeLine('"a b\\" c"'), ['a b" c']);

// Test nested commands.
assert.deepEqual(pragmash.tokenizeLine('a (b c) d'), ['a', ['b', 'c'], 'd']);
assert.deepEqual(pragmash.tokenizeLine('a ( b c) d'), ['a', ['b', 'c'], 'd']);
assert.deepEqual(pragmash.tokenizeLine('a (b c ) d'), ['a', ['b', 'c'], 'd']);
assert.deepEqual(pragmash.tokenizeLine('a (b c)'), ['a', ['b', 'c']]);
assert.deepEqual(pragmash.tokenizeLine('(b c) d'), [['b', 'c'], 'd']);

// Test quick variable access.
assert.deepEqual(pragmash.tokenizeLine('a $b'), ['a', ['get', 'b']]);
assert.deepEqual(pragmash.tokenizeLine('a $b c'), ['a', ['get', 'b'], 'c']);
assert.deepEqual(pragmash.tokenizeLine('$b c'), [['get', 'b'], 'c']);

// Make sure certain things trigger errors.
var errorTriggers = [
  'a "bcd',
  'hey "',
  'a "bcd"e',
  'a (bcd)e',
  'a (bcd'
];
for (var i = 0; i < errorTriggers.length; ++i) {
  try {
    pragmash.tokenizeLine(errorTriggers[i]);
  } catch (e) {
    continue;
  }
  throw new Error('line should trigger error: ' + errorTriggers[i]);
}

// Test line splitting.
assert.deepEqual(pragmash.parseLines('a\nb\\\nc\nd\n\n#abc\\\nabc'),
  [{text: 'a', number: 1}, {text: 'bc', number: 2}, {text: 'd', number: 4},
   {text: 'abc', number: 7}]);

// Make sure a trailing \ triggers an error.
try {
  pragmash.parseLines('abc\\\ndef\\');
  throw 'nope';
} catch (e) {
  if (e === 'nope') {
    throw new Error('expected error for trailing \\.');
  }
}

console.log('PASS');