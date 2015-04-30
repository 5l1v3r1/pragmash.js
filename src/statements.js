// A CommandStatement compiles a command down to a JavaScript function call.
function CommandStatement(tokens) {
  if (tokens.length === 0) {
    throw new CompileError('empty command cannot be compiled');
  }
  this.name = tokens[0];
  this.arguments = tokens.slice(1);
}

CommandStatement.prototype.compile = function() {
  var res = 'runtime.commands[' + this.name.compile() + '](';
  for (var i = 0, len = this.arguments.length; i < len; ++i) {
    if (i !== 0) {
      res += ', ';
    }
    res += this.arguments[i].compile();
  }
  return res + ')';
};

// A CompileError is triggered when compilation fails.
function CompileError(message, line) {
  this.message = message;
  this.line = line || -1;
}

// toString generates a human-readable representation of the error.
CompileError.prototype.toString = function() {
  return 'line ' + this.line + ': ' + this.message;
};

// A ConditionStatement is a statement which compiles to a boolean expression.
function ConditionStatement(tokens) {
  if (tokens[0] === 'not') {
    tokens = tokens.slice(1);
    this.not = true;
  } else {
    this.not = false;
  }

  this.statements = [];
  for (var i = 0, len = tokens.length; i < len; ++i) {
    this.statements[i] = tokenToStatement(tokens[i]);
  }
}

// compile generates a boolean JavaScript expression for the condition.
ConditionStatement.prototype.compile = function() {
  if (this.statements.length === 0) {
    return this.not ? 'false' : 'true';
  } else if (this.statements.length === 1) {
    // The runtime.isEmpty function will check if a value is empty.
    return (this.not ? '' : '!') + 'runtime.isEmpty(' +
      this.statements[0].compile() + ')';
  } else {
    var res = (this.not ? '!' : '') + 'runtime.areAllEqual(';
    for (var i = 0, len = this.statements.length; i < len; ++i) {
      if (i !== 0) {
        res += ', ';
      }
      res += this.statements[i].compile();
    }
    return res + ')';
  }
};

// A StringStatement compiles to a JavaScript string.
function StringStatement(str) {
  this.string = str;
}

// compile encodes the string as a JavaScript string and returns the result.
StringStatement.prototype.compile = function() {
  return JSON.stringify(this.string);
};

// tokenToStatement generates a StringStatement or CommandStatement from a
// token (which must be a string or array).
function tokenToStatement(token) {
  // The token is either a string or an array.
  if ('string' === typeof token) {
    return new StringStatement(token);
  } else {
    return new CommandStatement(token);
  }
}
