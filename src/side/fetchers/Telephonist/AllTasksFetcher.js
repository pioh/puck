import {
  observable,
  autorun,
  runInAction,
  action,
} from 'mobx'
import {getSnapshot, applySnapshot} from 'mobx-state-tree'

import {FetchUsers} from 'side/api/FetchUser'
import {
  FetchAllTasks,
  FetchToWorkTask,
  FetchChangeTaskStatus,
  FetchChangeTaskUser,
} from 'side/api/Telephonist'


export class AllTasksFetcher {
  disposers = []
  allTasksStore = null
  allUsersStore = null
  history = null

  @observable loadingFilterString = null
  @observable failedCount         = 0
  @observable failedFilterString  = null
  @observable maxFails            = 3

  constructor ({allTasksStore, history, allUsersStore}) {
    this.allUsersStore = allUsersStore
    this.allTasksStore = allTasksStore
    this.history = history
    this.init()
  }

  async init () {
    await Promise.delay(1)
    await this.fetchAllUsers()
    this.disposers.push(autorun(this.checkAllTasksToFetch))
  }

  destroy () {
    this.disposers.forEach(disposer => { disposer() })
    this.disposers = []
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

  checkAllTasksToFetch = () => {
    if (this.allTasksStore.filterString === this.allTasksStore.filterStore.string) return
    if (this.loadingFilterString === this.allTasksStore.filterStore.string) return
    if (this.failedCount >= this.maxFails &&
        this.allTasksStore.filterStore.string === this.failedFilterString) return
    this.fetchAllTasks(this.allTasksStore.filterStore)
  }

  toWork = async (id) => {
    let response = await FetchToWorkTask({ history: this.history, id: id })
    if (!response || !response.error) {
      runInAction(() => {
        this.allTasksStore.allTasks
        .filter(task => String(task.id) === String(id))
        .forEach(task => {
          task.taskStatus = 'IN_PROGRESS'
        })
      })
      return {
        status: 'IN_PROGRESS'
      }
    }
    return response
  }

  changeUser = async ({id, userId}) => {
    let response = await FetchChangeTaskUser({
      history: this.history,
      id,
      userId,
    })
    return response
  }
  changeStatus = async ({id, status}) => {
    let response = await FetchChangeTaskStatus({
      history: this.history,
      id,
      status,
    })
    return response
  }

  @action fetchAllTasks (filterStore) {
    this.loadingFilterString = filterStore.string
    let filterString = filterStore.string
    if (filterStore.string !== this.failedFilterString) {
      this.failedFilterString = null
      this.failedCount = 0
      this.allTasksStore.fetchError = null
    }
    FetchAllTasks({
      history : this.history,
      filter  : getSnapshot(filterStore),
    }).then(({allTasks, users, tasksCount, error}) => {
      if (error) return this.receiveFail({error, filterString})
      this.receiveAllTasks({allTasks, users, tasksCount, filterString})
    }).catch(error => {
      this.receiveFail({error, filterString})
    })
  }

  @action receiveAllTasks ({allTasks, users, tasksCount, filterString}) {
    if (this.loadingFilterString !== filterString) return
    try {
      applySnapshot(this.allTasksStore.allTasks, allTasks)
      applySnapshot(this.allUsersStore, {
        users: {
          ...getSnapshot(this.allUsersStore).users,
          ...users,
        },
      })
    } catch (e) {
      this.receiveFail({error: e, filterString})
      return
    }
    this.loadingFilterString = null
    this.allTasksStore.filterString = filterString
    this.allTasksStore.count = tasksCount
  }

  @action receiveFail ({error, filterString}) {
    console.error(error && error.stack || error)
    if (this.loadingFilterString !== filterString) return
    this.loadingFilterString = null
    this.failedFilterString = filterString
    this.failedCount++
    this.allTasksStore.fetchError = 'Произошла внутренняя ошибка\n' + (error && error.message || '')
  }
}

