import $ from 'jquery'


let _api = false
let version = '2.1.45'
// if (window.IE8) version = '2.0.41'

export async function loadApi () {
  if (_api) {
    if (_api === true) return // already loaded
    return new Promise((resolve) => _api.push(resolve)) // loading now, wait...
  }
  // start loading
  _api = []
  await $.getScript(`https://api-maps.yandex.ru/${version}/?load=package.full&lang=ru-RU`).promise()

  await new Promise((resolve) => {
    window.ymaps.ready(resolve)
  })
  _api.forEach((resolve) => resolve())
  _api = true
}
