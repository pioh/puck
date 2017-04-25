import {
  observable,
  autorun,
  action,
  runInAction,
} from 'mobx'
import {getSnapshot, applySnapshot} from 'mobx-state-tree'

import {FetchTasks, FetchToWorkTask} from 'side/api/Telephonist'


export class TasksFetcher {
  disposers = []
  tasksStore = null
  history = null
  userStore = null

  @observable loadingFilterString = null
  @observable failedCount         = 0
  @observable failedFilterString  = null
  @observable maxFails            = 3

  constructor ({tasksStore, history, userStore}) {
    this.tasksStore = tasksStore
    this.userStore = userStore
    this.history = history
    this.init()
  }

  async init () {
    await Promise.delay(1)
    this.disposers.push(autorun(this.checkTasksToFetch))
  }

  destroy () {
    this.disposers.forEach(disposer => { disposer() })
    this.disposers = []
  }

  checkTasksToFetch = () => {
    if (this.tasksStore.filterString === this.tasksStore.filterStore.string) return
    if (this.loadingFilterString === this.tasksStore.filterStore.string) return
    if (this.failedCount >= this.maxFails &&
        this.tasksStore.filterStore.string === this.failedFilterString) return
    this.fetchTasks(this.tasksStore.filterStore)
  }

  toWork = async (id) => {
    let response = await FetchToWorkTask({ history: this.history, id: id })
    if (!response || !response.error) {
      runInAction(() => {
        this.tasksStore.tasks
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

  @action fetchTasks (filterStore) {
    this.loadingFilterString = filterStore.string
    let filterString = filterStore.string
    if (filterStore.string !== this.failedFilterString) {
      this.failedFilterString = null
      this.failedCount = 0
      this.tasksStore.fetchError = null
    }
    FetchTasks({
      history : this.history,
      filter  : getSnapshot(filterStore),
      userID  : this.userStore.id,
    }).then(({tasks, tasksCount, error}) => {
      if (error) return this.receiveFail({error, filterString})
      this.receiveTasks({tasks, tasksCount, filterString})
    }).catch(error => {
      this.receiveFail({error, filterString})
    })
  }

  @action receiveTasks ({tasks, tasksCount, filterString}) {
    if (this.loadingFilterString !== filterString) return
    try {
      applySnapshot(this.tasksStore.tasks, tasks)
    } catch (e) {
      this.receiveFail({error: e, filterString})
      return
    }
    this.loadingFilterString = null
    this.tasksStore.filterString = filterString
    this.tasksStore.count = tasksCount
  }

  @action receiveFail ({error, filterString}) {
    console.error(error && error.stack || error)
    if (this.loadingFilterString !== filterString) return
    this.loadingFilterString = null
    this.failedFilterString = filterString
    this.failedCount++
    this.tasksStore.fetchError = 'Произошла внутренняя ошибка\n' + (error && error.message || '')
  }
}

