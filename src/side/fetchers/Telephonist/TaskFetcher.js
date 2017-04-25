import {autorun, action, runInAction, computed, observable} from 'mobx'
import {onSnapshot, getSnapshot, applySnapshot} from 'mobx-state-tree'
import jsondiffpatch from 'jsondiffpatch/public/build/jsondiffpatch-full.js'
import shortid from 'shortid'
import _uniq from 'lodash/uniq'
import _set from 'lodash/set'
import _get from 'lodash/get'
import {TaskStore} from 'store/Telephonist/TaskStore'

import {
  FetchTask,
  FetchSaveTask,
  FetchDoneTask,
  FetchToWorkTask,
  FetchCancelTask,
  FetchDeleteTask,
} from 'side/api/Telephonist'
import {AddressToLocation, AddressToBounds} from 'side/api/Yandex'
import {FetchUsers} from 'side/api/FetchUser'


let patcher = jsondiffpatch.create({
  arrays: {
    detectMove         : true,
    includeValueOnMove : true,
  },
  textDiff: {
    minLength: 60,
  },
})

export class TaskFetcher {
  history = null
  disposers = []
  taskStore = null
  userStore = null
  allUsersStore = null
  taskViewStore = null
  fetchedAddress = null
  @observable loaded = false
  @observable loadingError = null

  constructor ({history, taskStore, taskViewStore, allUsersStore, userStore}) {
    this.history = history
    this.taskStore = taskStore
    this.taskViewStore = taskViewStore
    this.userStore = userStore
    this.allUsersStore = allUsersStore

    this.disposers.push(autorun(() => {
      if (this.taskStore.id) {
        setTimeout(() => {
          runInAction(() => {
            this.history.title = String(this.taskStore.id).match(/^new-/)
              ? 'Новый объект'
              : `Объект #${this.taskStore.id}`
          })
        }, 1)
      }
    }))
    this.disposers.push((() => {
      let timer = setInterval(this.refreshTask, 15000)
      return () => clearInterval(timer)
    })())
    this.disposers.push((() => {
      let timer = setInterval(this.refreshLocalDiff, 2000)
      return () => clearInterval(timer)
    })())
    this.disposers.push(autorun(this.checkAddressLocation))
    this.disposers.push(autorun(this.checkAddressBounds))
    this.disposers.push(onSnapshot(this.taskViewStore.task, this.onTaskViewStoreSnapshot))

    this.firstRequestTask().catch(e => console.error(e && e.stack || e))

    if (this.userStore.permissions.get('TELEPHONIST_FULL_ACCESS')) {
      this.fetchAllUsers()
    }
  }

  fetchAllUsers = async () => {
    let {ok, users, error} = await FetchUsers({history: this.history})
    if (!ok) {
      console.error(error && error.message)
      return
    }
    applySnapshot(this.allUsersStore, {
      users: {
        ...getSnapshot(this.allUsersStore).users,
        ...users,
      },
    })
  }

  async fetchTask () {
    var response
    try {
      response = await FetchTask({history: this.history, id: this.taskStore.id})
      if (!response || !response.task) {
        response = {
          error: {
            message: [
              `Произошла ошибка при загрузке объявления\nПопробуйте обновить страницу`,
              response && response.error && response.error.message,
            ].filter(v => v).join('\n\n')
          }
        }
      }
    } catch (e) {
      if (e.message.match(/AccessDeniedException/)) {
        response = {
          error: {
            message: 'Нет прав на просмотр этой страницы\nПопробуйте зайти под другим пользователем'
          }
        }
      } else if (e.message.match(/EntityNotFoundException/)) {
        response = {
          error: {
            message: 'Такой задачи не существует'
          }
        }
      } else {
        console.error(e && e.stack || e)
        response = {
          error: {
            message: `Произошла ошибка при загрузке объявления\nПопробуйте обновить страницу\n\n${e.message}`
          }
        }
      }
    }
    return response
  }

  @action refreshTask = async ({dry = false, forceRefresh = false} = {}) => {
    this.loadingError = null
    let diff = this.diff
    let response = await this.fetchTask()
    await this.refreshTaskApply({diff, response, dry, forceRefresh})
  }
  @action async refreshTaskApply ({diff, response, dry, forceRefresh}) {
    if (response.error) {
      this.loadingError = response.error.message
      return
    }
    this.loaded = true
    if (patcher.diff(getSnapshot(this.taskStore), getSnapshot(TaskStore(response.task)))) {
      applySnapshot(this.taskStore, response.task)
    }
    if (forceRefresh) applySnapshot(this.taskViewStore.task, response.task)
    if (dry || forceRefresh) return
    try {
      var patched = patcher.patch(patcher.clone(getSnapshot(this.taskStore)), diff)
      if (patched.offer.photoUrls) {
        let arr = [...patched.offer.photoUrls]
        arr = _uniq(arr).sort()
        patched.offer.photoUrls = arr
      }
      if (patcher.diff(getSnapshot(this.taskViewStore.task), patched)) {
        applySnapshot(this.taskViewStore.task, patched)
        if (this.fetchedAddress !== patched.offer.rawAddress) {
          this.fetchedAddress = patched.offer.rawAddress
        }
      }
    } catch (e) {
      console.error(e.stack)
      return
    }
  }

  @action async firstRequestTask () {
    this.loadingError = null
    let diff = window.localStorage.getItem(`TASK_DIFF_${this.taskStore.id}`) || undefined
    this.localDiff = diff
    try {
      diff = JSON.parse(diff) || undefined
    } catch (e) {
      diff = undefined
    }
    let response = await this.fetchTask()
    await this.refreshTaskApply({diff, response})
  }
  @action async firstRequestTaskApply ({diff, response}) {
    if (response.error) {
      this.loadingError = response.error.message
      return
    }
    this.loaded = true
    applySnapshot(this.taskStore, response.task)

    try {
      var patched = patcher.patch(patcher.clone(getSnapshot(this.taskStore)), diff)
      if (patched.offer.photoUrls) {
        let arr = [...patched.offer.photoUrls]
        arr = _uniq(arr).sort()
        patched.offer.photoUrls = arr
      }
      applySnapshot(this.taskViewStore.task, patched)
      this.fetchedAddress = patched.offer.rawAddress
    } catch (e) {
      applySnapshot(this.taskViewStore.task, getSnapshot(this.taskStore))
      console.error(e.stack)
      return
    }
  }

  actionReset = async () => {
    applySnapshot(this.taskViewStore.task, getSnapshot(this.taskStore))
  }

  actionSave = async () => {
    await this.refreshTask()
    let {ok, newTaskID, error} = await FetchSaveTask({
      history : this.history,
      task    : getSnapshot(this.taskViewStore.task)
    })
    if (!ok || error) return {error}

    if (newTaskID) {
      runInAction(() => {
        this.history.props.set('taskID', newTaskID)
      })
      return
    }
    await this.refreshTask({ dry: true })
    runInAction(() => {
      this.changedFields
        .filter(k => (
          !(this.taskViewStore.fields[k] || this.taskViewStore.otherFields[k]) ||
          _get(this.taskViewStore.task, k) === null))
        .forEach(k => {
          _set(this.taskViewStore.task, k, _get(this.taskStore, k))
        })
    })
  }

  actionDone = async () => {
    let response = await FetchDoneTask({history: this.history, id: this.taskViewStore.task.id})
    await this.refreshTask({forceRefresh: true})
    return response
  }
  actionToWork = async () => {
    let response = await FetchToWorkTask({history: this.history, id: this.taskViewStore.task.id})
    await this.refreshTask({forceRefresh: true})
    return response
  }
  actionCancel = async () => {
    let response = await FetchCancelTask({history: this.history, id: this.taskViewStore.task.id})
    await this.refreshTask({forceRefresh: true})
    return response
  }

  actionInvalid = async () => await this.actionDone()
  actionCannotCheck = async () => await this.actionDone()

  actionDelete = async () => {
    let response = await FetchDeleteTask({history: this.history, id: this.taskViewStore.task.id})
    runInAction(() => {
      let task = getSnapshot(this.taskViewStore.task)
      applySnapshot(this.taskViewStore.task, {
        id    : 'new-deleted' + shortid.generate(),
        offer : {
          ...task.offer,
          id  : null,
          hid : null,
        },
        comments: this.taskViewStore.task.comments,
      })
      applySnapshot(this.taskStore, {
        id    : this.taskViewStore.task.id,
        offer : {},
      })
    })
    setTimeout(action(() => {
      this.history.props.set('taskID', this.taskViewStore.task.id)
    }), 10)
    return response
  }

  destroy () {
    this.disposers.forEach(disposer => { disposer() })
    this.disposers = []
  }

  checkAddressLocation = () => {
    if (!this.taskViewStore.task.offer.rawAddress) return
    if (!this.taskViewStore.task.offer.location || !this.taskViewStore.task.offer.location.length || (
      this.fetchedAddress !== this.taskViewStore.task.offer.rawAddress
    )) {
      this.fetchLocation()
    }
  }
  checkAddressBounds = () => {
    if (!this.taskViewStore.task.offer.rawAddress) return
    this.fetchBounds()
  }

  @action async fetchLocation () {
    this.fetchedAddress = this.taskViewStore.task.offer.rawAddress
    let location = await AddressToLocation(this.taskViewStore.task.offer.rawAddress)
    if (this.taskViewStore.task.offer.rawAddress === this.fetchedAddress && location) {
      runInAction(() => {
        this.taskViewStore.task.offer.location = location
      })
    }
  }
  @action async fetchBounds () {
    let bounds   = await AddressToBounds(this.taskViewStore.task.offer.rawAddress)
    if (this.taskViewStore.task.offer.rawAddress === this.fetchedAddress && bounds) {
      runInAction(() => {
        this.taskViewStore.bounds = bounds
      })
    }
  }

  @computed.struct get diff () {
    return patcher.diff(getSnapshot(this.taskStore), getSnapshot(this.taskViewStore.task))
  }

  JSONparse = json => {
    try {
      return JSON.parse(json)
    } catch (e) {
      return undefined
    }
  }

  @action refreshLocalDiff = () => {
    let localDiff = window.localStorage.getItem(`TASK_DIFF_${this.taskStore.id}`) || undefined
    if (this.localDiff === localDiff) return
    try {
      let me = this.localDiff && this.JSONparse(this.localDiff) || undefined
      let other = localDiff && this.JSONparse(localDiff) || undefined
      me = patcher.patch(patcher.clone(getSnapshot(this.taskStore)), me)
      other = patcher.patch(patcher.clone(getSnapshot(this.taskStore)), other)
      let newDiff = patcher.diff(me, other)
      if (newDiff) {
        let patched = patcher.patch(
          patcher.clone(getSnapshot(this.taskViewStore.task)),
          newDiff
        )
        applySnapshot(this.taskViewStore.task, patched)
      }
      this.localDiff = localDiff
    } catch (e) {
      console.error('refreshLocalDiff', e.stack)
      return
    }
  }

  onTaskViewStoreSnapshot = (viewSnapshot) => {
    this.refreshLocalDiff()
    let key = `TASK_DIFF_${this.taskStore.id}`
    console.log(this.diff)
    if (!this.diff) {
      window.localStorage.removeItem(key)
      this.localDiff = undefined
      return
    }
    this.localDiff = JSON.stringify(this.diff)
    window.localStorage.setItem(key, this.localDiff)
  }

  @computed.struct get changedFields () {
    if (!this.diff) return []
    return [
      ...Object.keys(this.diff),
      ...Object.keys(this.diff.offer || {}).map(k => `offer.${k}`),
    ].filter(k => k !== 'offer')
  }
}
