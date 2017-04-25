import {createFactory, getEnvironment} from 'mobx-state-tree'

import {permissions} from 'store/UserStore'

export const layouts = {
  base: {
    BaseLayout: {},
  },
  main: {
    title      : 'НИР Хаб',
    BaseLayout : {
    },
  },
  login: {
    title      : 'Вход',
    BaseLayout : {
      Login: {},
    },
  },
  join: {
    title      : 'Регистрация',
    BaseLayout : {
      // SignUp: {},
    },
  },
  settingsProfile: {
    permissions : [permissions.USER],
    title       : 'Настройки - Ваш профиль',
    BaseLayout  : {
      // SettingsProfile: {},
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
    // let historyStore = getEnvironment(this, 'historyStore')
    // let userStore = getEnvironment(this, 'userStore')
    // if (historyStore.pathname === '/') {
    //   return {
    //     pathname: userStore.permissions.get('TELEPHONIST_FULL_ACCESS')
    //       ? '/telephonist/all-tasks'
    //       : '/telephonist/tasks'
    //   }
    // }
    return null
  },

  get layoutNameByPathname () {
    let historyStore = getEnvironment(this, 'historyStore')

    switch (historyStore.pathname) {
      case '/' :
        return 'main'
      case '/login' :
        return 'login'
      case '/join' :
        return 'join'
      case '/setting/profile' :
        return 'settingsProfile'
      default:
        return 'error404'
    }
  },

  get layoutName () {
    let userStore = getEnvironment(this, 'userStore')
    let layout = layouts[this.layoutNameByPathname]
    if (layout.permissions && layout.permissions.length) {
      if (!layout.permissions.find(permission => userStore.permissions.get(permission))) {
        if (userStore.permissions.get(permissions.LOADING)) return 'base'
        return 'login'
      }
    }
    return this.layoutNameByPathname
  },

  get layout () {
    return layouts[this.layoutName]
  },
})
