import {createFactory, getEnvironment} from 'mobx-state-tree'


export const layouts = {
  base: {
    BaseLayout: {},
  },
  puck: {
    title      : 'Puck',
    BaseLayout : {
      Puck: {},
    },
  },
  error404: {
    BaseLayout: {
      Error404: {},
    },
  },
  error403: {
    BaseLayout: {
      Error403: {},
    },
  },
}

export const RouterStore = createFactory({
  get redirect () {
    let historyStore = getEnvironment(this, 'historyStore')
    if (historyStore.pathname === '/') {
      return {
        pathname: '/puck',
      }
    }
    return null
  },

  get layoutNameByPathname () {
    let historyStore = getEnvironment(this, 'historyStore')

    switch (historyStore.pathname) {
    case '/' :
      return 'base'
    case '/puck' :
      return 'puck'
    default:
      return 'error404'
    }
  },

  get layoutName () {
    return this.layoutNameByPathname
  },

  get layout () {
    return layouts[this.layoutName]
  },
})
