
export const Reverse  = function () {
  return this.split('').reverse().join('')
}


export const PrettyInt = function () {
  return this.replace(/\..*/, '')::Reverse().replace(/(\d\d\d)/g, '$1 ')::Reverse()
}

export const PrettyFloat = function () {
  let [a, b] = this.split('.')
  a = a || '0'
  b = b || '0'
  if (b.length < 2) b += '0'
  return [a::PrettyInt(), b.substr(0, 2)].join('.')
}
