import {computed, observable, action, autorun, runInAction} from 'mobx'

import createHistory from 'history/createBrowserHistory'
import {basenames} from 'config/basenames'

export default
class History {
  static singletonInstance

  @observable props = observable.map()
  @observable basename = '' // format: '9r/baikal'
  @observable pathname = '/'
  @observable title    = 'Телефонист'
  @observable pushedTitle = 'Телефонист'

  history = undefined
  unlisten = undefined

  constructor () {
    if (History.singletonInstance) return History.singletonInstance
    History.singletonInstance = this

    this.initHistory()

    this.unlisten = this.history.listen(this.syncFromUrl)
    autorun(this.syncToBrowserUrl)
  }

  @action initHistory () {
    for (let basename of basenames) {
      if (window.location.pathname.match(new RegExp(`^/${basename}/`))) {
        this.basename = basename
        break
      }
    }
    this.history = createHistory()
    this.syncFromUrl()
  }

  syncToBrowserUrl = () => {
    let {pathname, props} = this.fromUrl()
    let now = this.toHref(pathname, props)
    if (this.url === now) return
    if (this.pushedTitle !== this.title || this.history.action === 'POP') {
      this.history.push(this.url)
      runInAction('pushTitle', () => {
        this.pushedTitle = this.title
      })
    } else {
      this.history.replace(this.url)
    }
  }

  toHref (pathname = this.pathname, props = this.props.toJS(), basename = this.basename) {
    let locationPathname = ['', basename, pathname].map(a => a.replace(/(^\/|\/$)/g, '')).join('/')

    let search = Object.keys(props)
      .sort()
      .filter(key => key && props[key])
      .map(key => props[key] === true ? key : `${key}=${encodeURIComponent(props[key])}`)
      .join('&')

    return locationPathname + (search ? `?${search}` : '')
  }

  @computed get url () {
    return this.toHref()
  }

  @action syncFromUrl = (location) => {
    location = location || this.history.location
    let {props, pathname} = this.fromUrl(location)
    this.pathname = pathname

    this.props.keys().forEach(key => {
      if (!props[key]) this.props.delete(key)
    })
    this.props.merge(props)
  }

  fromUrl (location = this.history.location) {
    let pathname = location.pathname
    if (this.basename) pathname = pathname.replace(new RegExp(`^/${this.basename}/`), '/')

    let props = {}
    location.search.replace(/^\?/, '')
    .split('&')
    .map(kv => kv.split('='))
    .filter(([k, v]) => k)
    .map(([k, v]) => {
      props[k] = v === undefined ? true : decodeURIComponent(v)
    })
    return {pathname, props}
  }

  @action replace = ({pathname, props}) => {
    if (pathname) this.pathname = pathname
    if (props) this.props.merge(props)
    let now = this.toHref(this.pathname, this.props)
    if (this.url === now) return
    this.history.replace(this.url)
  }
}
