export const toISO = (date, end = false) => {
  if (!date || typeof date !== 'string') return date
  return date.split('.').reverse().join('-') + (end ? 'T23:59:59' : 'T00:00:00')
}

export const fromISO = date => {
  if (!date || typeof date !== 'string') return date
  return date.replace(/T.*$/, '').split('-').reverse().join('.')
}

export const toISOFromTo = fromTo => {
  if (!fromTo || typeof fromTo !== 'object') return fromTo
  return {
    ...fromTo,
    from : toISO(fromTo.from),
    to   : toISO(fromTo.to, true),
  }
}

export const fromISOFromTo = fromTo => {
  if (!fromTo || typeof fromTo !== 'object') return fromTo
  return {
    ...fromTo,
    from : fromISO(fromTo.from),
    to   : fromISO(fromTo.to, true),
  }
}
