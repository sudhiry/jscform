var hasExcape = /~/
var escapeMatcher = /~[01]/g

function escapeReplacer (m: string) {
  switch (m) {
    case '~1': return '/'
    case '~0': return '~'
  }
  throw new Error('Invalid tilde escape: ' + m)
}

function isAbsolutePath(path: string) {
	const pattern = /^\/.*/;
	return pattern.test(path);
}

function getAbsolutePath(jsonPath: string, currentPath: string) {
	if(isAbsolutePath(jsonPath)) return jsonPath;
	const RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/
  if (RELATIVE_JSON_POINTER.test(jsonPath) && currentPath) {
    const evaluatedParts = currentPath.split("/");
    const parts = jsonPath.split("/");
    let level = parseInt(parts.shift() as string);
    while (level > 0) {
      evaluatedParts.pop();
      level--;
    }
    return evaluatedParts.concat(parts).join("/");
  }
  return jsonPath;
}

function untilde (str: string) {
  if (!hasExcape.test(str)) return str
  return str.replace(escapeMatcher, escapeReplacer)
}

function setter (obj: Record<string, any>, pointer: any, value: any) {
  var part: string | number = '';
  var hasNextPart

  for (var p = 1, len = pointer.length; p < len;) {
    if (pointer[p] === 'constructor' || pointer[p] === 'prototype' || pointer[p] === '__proto__') return obj

    part = untilde(pointer[p++])
    hasNextPart = len > p

    if (typeof obj[part] === 'undefined') {
      // support setting of /-
      if (Array.isArray(obj) && part === '-') {
        part = obj.length
      }

      // support nested objects/array when setting values
      if (hasNextPart) {
        if ((pointer[p] !== '' && pointer[p] < Infinity) || pointer[p] === '-') obj[part] = []
        else obj[part] = {}
      }
    }

    if (!hasNextPart) break
    obj = obj[part]
  }

  var oldValue = obj[part]
  if (value === undefined) delete obj[part]
  else obj[part] = value
  return oldValue
}

function compilePointer (pointer: any) {
  if (typeof pointer === 'string') {
    pointer = pointer.split('/')
    if (pointer[0] === '') return pointer
    throw new Error('Invalid JSON pointer.')
  } else if (Array.isArray(pointer)) {
    for (const part of pointer) {
      if (typeof part !== 'string' && typeof part !== 'number') {
        throw new Error('Invalid JSON pointer. Must be of type string or number.')
      }
    }
    return pointer
  }

  throw new Error('Invalid JSON pointer.')
}

function get (obj: Record<string, any>, pointer: any, current = null) {
  if (typeof obj !== 'object') throw new Error('Invalid input object.')
  var relativePointer = current ? getAbsolutePath(pointer, current) : pointer;
  pointer = compilePointer(relativePointer)
  var len = pointer.length
  if (len === 1) return obj

  for (var p = 1; p < len;) {
    obj = obj[untilde(pointer[p++])]
    if (len === p) return obj
    if (typeof obj !== 'object' || obj === null) return undefined
  }
  return obj;
}

function set (obj: Record<string, any>, pointer: any, value: any) {
  if (typeof obj !== 'object') throw new Error('Invalid input object.')
  pointer = compilePointer(pointer)
  if (pointer.length === 0) throw new Error('Invalid JSON pointer for set.')
  return setter(obj, pointer, value)
}

function compile (pointer: any) {
  var compiled = compilePointer(pointer)
  return {
    get: function (object: Record<string, any>) {
      return get(object, compiled)
    },
    set: function (object: Record<string, any>, value: any) {
      return set(object, compiled, value)
    }
  }
}

exports.get = get
exports.set = set
exports.compile = compile
