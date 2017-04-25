import {createFactory, arrayOf} from 'mobx-state-tree'

import {TaskStore} from './TaskStore'
import {TasksFilterStore} from './TasksFilterStore'


export const TasksStore = createFactory({
  tasks        : arrayOf(TaskStore),
  count        : 0,
  filterStore  : TasksFilterStore,
  filterString : null,
  fetchError   : null,

  get isLoading () {
    if (this.fetchError) return false
    if (this.filterStore.string === this.filterString) return false
    return true
  },
})
