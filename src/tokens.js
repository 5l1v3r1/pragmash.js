// A LineError represents an error that occurred while tokenizing a line.
function LineError(msg) {
  this.message = msg;
}

// toString returns a string representation of the error.
LineError.prototype.toString = function() {
  return 'LineError: ' + this.message;
};

// A ParseError includes a line number and error message.
function ParseError(line, message) {
  this.line = line;
  this.message = message;
}

// toString returns a string which indicates the line number and message.
ParseError.prototype.toString = function() {
  return 'line ' + this.line + ': ' + this.message;
};

// A Scanner treats a string as an input stream.
function Scanner(s) {
  this.index = 0;
  this.text = s;
}

// done returns true if the scanner has no more characters to read.
Scanner.prototype.done = function() {
  return this.index >= this.text.length;
};

// next reads the next character from the scanner.
Scanner.prototype.next = function() {
  if (this.done()) {
    return '';
  }
  return this.text[this.index++];
};

// skipRequiredSpace skips until the next non-whitespace character.
// This throws an exception if the next character is not a whitespace character.
Scanner.prototype.skipRequiredSpace = function() {
  if (this.done()) {
    return;
  }
  
  // Make sure at least one character is consumed.
  var cur = this.index;
  this.skipSpace();
  if (cur === this.index) {
    throw new LineError('expecting whitespace but got: ' + this.text[cur]);
  }
}

// skipSpace skips until the first non-whitespace character.
Scanner.prototype.skipSpace = function() {
  while (!this.done()) {
    var next = this.next();
    if (!isSpace(next)) {
      this.unread();
      return;
    }
  }
};

// unread makes it as if the last character was not read.
Scanner.prototype.unread = function() {
  this.index--;
};

// isSpace returns true if a string is a whitespace character.
function isSpace(s) {
  return s === ' ' || s === '\t';
}

// parseLines returns an array of objects of the form
// {text: "...", number: ...}.
function parseLines(s) {
  var rawLines = s.split('\n');
  var result = [];
  
  for (var i = 0, len = rawLines.length; i < len; ++i) {
    var number = i+1;
    var text = trimWhitespace(rawLines[i]);
    
    // If the line is a comment or is blank, skip it.
    if (text === '' || text[0] === '#') {
      continue;
    }
    
    // If the line is a normal line, append it.
    if (text[text.length-1] !== '\\') {
      result.push({text: text, number: number});
      continue;
    }
    
    // Keep reading lines until there's no line continuation.
    text = text.substring(0, text.length-1);
    for (++i; i < len; ++i) {
      var nextLine = rawLines[i];
      if (nextLine[nextLine.length-1] === '\\') {
        nextLine = nextLine.substring(0, nextLine.length-1);
        text = text + nextLine;
      } else {
        text = text + nextLine;
        break;
      }
    }
    
    // If the loop terminated because i === rawLines.length, then the last line
    // ended with a \.
    if (i === rawLines.length) {
      throw new ParseError(rawLines.length, 'unexpected \\ at end of input');
    }
    
    result.push({text: text, number: number});
  }
  
  return result;
}

// readCommand reads the command after a "(".
function readCommand(scanner) {
  var tokens = [];
  scanner.skipSpace();
  while (!scanner.done()) {
    var next = scanner.next();
    if (next === '"') {
      tokens.push(readQuoted(scanner));
    } else if (next === '(') {
      tokens.push(readCommand(scanner));
    } else if (next === '$') {
      var variableName = readRaw(scanner);
      tokens.push(['get', variableName]);
    } else if (next === ')') {
      return tokens;
    } else {
      scanner.unread();
      tokens.push(readRaw(scanner));
    }
    
    // If this is the end of the line then we should trigger a syntax error
    // since there was no ')'.
    if (scanner.done()) {
      break;
    }
    
    // Skip the next bunch of whitespace or detect a ')' character.
    var next = scanner.next();
    if (next === ')') {
      return tokens;
    } else if (!isSpace(next)) {
      throw new LineError('expected whitespace but got: ' + next);
    }
    scanner.skipSpace();
  }
  throw new LineError('missing expected close parenthesis');
}

// readEscape reads the character(s) after a "\" and returns the unescaped.
function readEscape(scanner) {
  if (scanner.done()) {
    throw new LineError('no escape code');
  }
  
  // TODO: support hex escapes.
  
  var char = scanner.next();
  var res = {'n': '\n', 'r': '\r', 'a': '\a', 't': '\t'}[char];
  if ('undefined' === typeof res) {
    return char;
  } else {
    return res;
  }
}

// readQuoted reads the text after a quote and returns the parsed string.
function readQuoted(scanner) {
  var str = '';
  while (!scanner.done()) {
    var next = scanner.next();
    if (next === '\\') {
      next = readEscape(scanner);
    } else if (next === '"') {
      return str;
    }
    str += next;
  }
  throw new LineError("missing end quote");
}

// readRaw reads a raw string and returns it.
function readRaw(scanner) {
  var str = '';
  while (!scanner.done()) {
    var next = scanner.next();
    if (next === '\\') {
      next = readEscape(scanner);
    } else if (isSpace(next) || next === ')') {
      // NOTE: we unread the whitespace so that skipRequiredSpace doesn't throw
      // an exception.
      scanner.unread();
      return str;
    }
    str += next;
  }
  return str;
}

// tokenizeLine generates tokens for a line of code or throws a LineError.
// The resulting line is an array of strings or arrays. The nested arrays are
// likewise arrays of strings or arrays. Array tokens represent nested commands.
function tokenizeLine(s) {
  var scanner = new Scanner(s);
  var tokens = [];
  scanner.skipSpace();
  while (!scanner.done()) {
    var next = scanner.next();
    if (next === '"') {
      tokens.push(readQuoted(scanner));
    } else if (next === '(') {
      tokens.push(readCommand(scanner));
    } else if (next === '$') {
      var variableName = readRaw(scanner);
      tokens.push(['get', variableName]);
    } else {
      scanner.unread();
      tokens.push(readRaw(scanner));
    }
    scanner.skipRequiredSpace();
  }
  return tokens;
}

// tokenizeScript parses a script and returns an array of tokenized lines.
function tokenizeScript(s) {
  var lines = parseLines(s);
  var tokenizedLines = [];
  for (var i = 0, len = lines.length; i < len; ++i) {
    var line = lines[i];
    try {
      var tokens = tokenizeLine(line.text);
      tokenizedLines.push(tokens);
    } catch (lineError) {
      throw lineError;
      throw new ParseError(line.number, lineError.message);
    }
  }
  return tokenizedLines;
}

// trimWhitespace removes the whitespace from the beginning of a string.
function trimWhitespace(s) {
  while (isSpace(s[0])) {
    s = s.substring(1);
  }
  return s;
}

exports.parseLines = parseLines;
exports.tokenizeLine = tokenizeLine;
exports.tokenizeScript = tokenizeScript;