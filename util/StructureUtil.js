function typeIs(type) {
  return function(any) {
    return typeof any === type;
  };
}

const isFunc = typeIs('function');
const isString = typeIs('string');
const isBoolean = typeIs('boolean');
const isNumber = typeIs('number');

function isEqual(anyArg) {
  return function(any) {
    return any === anyArg;
  };
}

function not(func) {
  return function(any) {
    return !func(any);
  };
}

function or(...rawArgs) {
  var functions = rawArgs.map(function(arg) {
    if (isFunc(arg)) {
      return arg;
    }
    else {
      return isEqual(arg);
    }
  });
  return function(any) {
    return functions.some(function(func) {
      return func(any);
    });
  };
}

function isTruthy(any) {
  return !!(any);
}

function alwaysTrue() {
  return function(any) {
    return true;
  };
}

function nullable(anyArg) {
  if (anyArg === null) {
    return isEqual(null);
  }
  else {
    return or(null, anyArg);
  }
}

function testRegex(regex) {
  console.assert(regex instanceof RegExp);
  return function(any) {
    return isString(any) && regex.test(any);
  };
}

function isArray(func) {
  if (isFunc(func)) {
    return function(any) {
      return Array.isArray(any) && any.length > 0 && any.every(func);
    };
  }
  else {
    return Array.isArray;
  }
}

function funcEvery(funcArray) {
  console.assert(isArray(isFunc)(funcArray), 'funcEvery requires function array.');
  return function(any) {
    return funcArray.every(function(func) {
      return func(any);
    });
  };
}

function objectHasKey(keyArg) {
  if (isString(keyArg)) {
    return function(any) {
      return isObject(any) && keyArg in any;
    };
  }
  else if (isArray(isString)(keyArg)) {
    return function(any) {
      return isObject(any) && keyArg.every(function(key) {
        return key in any;
      });
    }
  }
  else {
    throw new Exception('objectHasKey argument must be string or string array.');
  }
}

function objectValueIs(objArg) {
  console.assert(objArg, 'objectValueIs requires funcion value object');
  const keys = Object.keys(objArg);
  return function(any) {
    return objectHasKey(keys)(any) && keys.every(function(key) {
      return objArg[key](any[key]);
    });
  };
}

const isObject = funcEvery([isTruthy, typeIs('object'), not(Array.isArray)]);

function createValidator(any) {
  if (any === null) {
    return isEqual(null);
  }
  if (any instanceof RegExp) {
    return testRegex(any);
  }
  else if (isObject(any)) {
    if (Object.keys(any).length === 0) {
      return isObject;
    }
    else {
      return objectValueIsParser(any);
    }
  }
  else if (isString(any)) {
    if (any === '*') {
      return alwaysTrue;
    }
    else {
      return isEqual(any);
    }
  }
  else if (isFunc(any)) {
    return any;
  }
  else if (isArray(any)) {
    return isArrayParser(any);
  }
  else {
    return any;
  }
}

function objectValueIsParser(objArg) {

  console.assert(isObject(objArg));
  return objectValueIs(Object.keys(objArg).reduce(function(result, key) {
    result[key] = createValidator(objArg[key]);
    return result;
  }, {}));
}

function isArrayParser(arrayArg) {
  console.assert(isArray(arrayArg));
  return isArray(createValidator(arrayArg[0]));
}

module.exports = {
  isFunc,
  isString,
  isBoolean,
  isNumber,
  isArray,
  nullable,
  objectValueIs,
  createValidator
};
