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
      throw new Error('unexpected \\ at end of input.');
    }
    
    result.push({text: text, number: number});
  }
  
  return result;
}

function trimWhitespace(s) {
  while (s[0] === ' ' || s[0] === '\t') {
    s = s.substring(1);
  }
  return s;
}

exports.parseLines = parseLines;