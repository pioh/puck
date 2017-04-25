
export const worldBounds = [[40, 16], [80, -150]]

export const escapeAddress = address =>
  address
    .toLowerCase()
    .replace(/[^a-zа-яё0-9,]/gmi, ' ')
    .replace(/\s+/gmi, ' ')
    .replace(/^\s/gmi, '').replace(/\s$/gmi, '')

export async function TextToAddress (address, limit = 20, offset = 0) {
  if (!address) return []

  let result = await fetch('https://geocode-maps.yandex.ru/1.x/?' + Object.entries({
    geocode : encodeURIComponent(escapeAddress(address)),
    results : limit,
    format  : 'json',
    skip    : offset,
  }).map(a => a.join('=')).join('&'), {
    cache : 'force-cache',
    mode  : 'cors',
  })
  if (!result.ok) return []
  result = await result.json()

  try {
    result = result.response.GeoObjectCollection.featureMember.map(f => {
      try {
        return f.GeoObject.metaDataProperty.GeocoderMetaData.text
      } catch (e) {
        return null
      }
    }).filter(s => s)
  } catch (e) {
    result = []
  }
  return result
}

export async function AddressToBounds (address) {
  if (!address) return worldBounds
  let result = await fetch('https://geocode-maps.yandex.ru/1.x/?' + Object.entries({
    geocode : encodeURIComponent(escapeAddress(address)),
    results : 1,
    format  : 'json',
  }).map(a => a.join('=')).join('&'), {
    cache : 'force-cache',
    mode  : 'cors',
  })
  if (!result.ok) return worldBounds
  result = await result.json()

  try {
    let env = result.response.GeoObjectCollection.featureMember[0].GeoObject.boundedBy.Envelope
    return [
      env.lowerCorner.split(' ').map(v => +v).reverse(),
      env.upperCorner.split(' ').map(v => +v).reverse(),
    ]
  } catch (e) {
    return worldBounds
  }
}

export async function AddressToLocation (address) {
  if (!address) return null
  let result = await fetch('https://geocode-maps.yandex.ru/1.x/?' + Object.entries({
    geocode : encodeURIComponent(escapeAddress(address)),
    results : 1,
    format  : 'json',
  }).map(a => a.join('=')).join('&'), {
    cache : 'force-cache',
    mode  : 'cors',
  })
  if (!result.ok) return null
  result = await result.json()

  try {
    let env = result.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos
    return env.split(' ').map(v => Math.floor(Number(v) * 100000) / 100000).reverse()
  } catch (e) {
    return null
  }
}

