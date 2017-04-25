
export function omit (v) { // fix for ie8 __proto__
  if (typeof v === 'function') {
    v = {...v}
  }
  if (v === null) return v
  if (typeof v !== 'object') {
    return v
  }
  if (v.length === 0) return undefined
  if (v.length !== undefined) {
    return [...v]
  }
  v = {...v}
  for (let key in v) {
    if (key.match(/^__/) || ['array', 'default', 'const'].indexOf(key) >= 0) {
      delete v[key]
    } else if (v[key] === undefined) {
      delete v[key]
    } else {
      v[key] = omit(v[key])
    }
  }
  if (Object.keys(v).length === 0) return undefined
  return v
}


export function omitNull (v) { // fix for ie8 __proto__
  if (typeof v === 'function') {
    v = {...v}
  }
  if (v === null) return undefined
  if (typeof v !== 'object') {
    return v
  }
  if (v.length === 0) return undefined
  if (v.length !== undefined) {
    return [...v]
  }
  v = {...v}
  for (let key in v) {
    if (key.match(/^__/) || ['array', 'default', 'const'].indexOf(key) >= 0) {
      delete v[key]
    } else if (v[key] === undefined) {
      delete v[key]
    } else if (v[key] === null) {
      delete v[key]
    } else {
      v[key] = omitNull(v[key])
    }
  }
  if (Object.keys(v).length === 0) return undefined
  return v
}

