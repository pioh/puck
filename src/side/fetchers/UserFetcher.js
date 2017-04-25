import {applySnapshot, onSnapshot} from 'mobx-state-tree'

import {permissions, nullUser} from 'store/UserStore'
import {FetchUser, FetchLogin, FetchLogout} from 'side/api'


export class UserFetcher {
  userStore = null
  disposers = []

  constructor ({userStore, history}) {
    this.userStore = userStore
    this.history = history

    if (this.userStore.permissions.get(permissions.LOADING)) {
      this.loadFromLocalStorage()
      this.fetchUser().catch(e => console.error(e && e.stack || e))
    }
    this.disposers.push(onSnapshot(this.userStore, this.saveToLocalStorage))
    this.disposers.push((() => {
      let timer = setInterval(this.fetchUser, 30000)
      return () => clearInterval(timer)
    })())
  }

  destroy () {
    this.disposers.forEach(disposer => disposer())
    this.disposers = []
  }

  loadFromLocalStorage () {
    let userSnapshot
    try {
      userSnapshot = JSON.parse(localStorage.getItem('userSnapshot'))
      userSnapshot.permissions[permissions.LOADING] = true
    } catch (e) {
      return
    }
    if (!userSnapshot) return

    applySnapshot(this.userStore, userSnapshot)
  }

  saveToLocalStorage (userSnapshot) {
    localStorage.setItem('userSnapshot', JSON.stringify(userSnapshot))
  }

  fetchUser = async () => {
    var response
    try {
      response = await FetchUser({history: this.history})
    } catch (e) {
      console.error(e && e.stack || e)
      response = {error: {message: 'Произошла внутренняя ошибка', e}}
    }
    if (response.error) {
      applySnapshot(this.userStore, nullUser)
      return response
    }
    applySnapshot(this.userStore, response)
    return {}
  }

  async login ({username, password}) {
    try {
      return await FetchLogin({username, password, history: this.history})
    } catch (e) {
      console.error(e && e.stack || e)
      return {error: {message: 'Произошла внутренняя ошибка', e}}
    }
  }

  async logout () {
    try {
      return await FetchLogout({history: this.history})
    } catch (e) {
      console.error(e && e.stack || e)
      return {error: {message: 'Произошла внутренняя ошибка', e}}
    }
  }
}
