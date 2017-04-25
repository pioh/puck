import {createFactory, arrayOf, mapOf} from 'mobx-state-tree'

import {TaskStore} from './TaskStore'
import {AllTasksFilterStore} from './AllTasksFilterStore'


export const AllTasksStore = createFactory({
  allTasks     : arrayOf(TaskStore),
  count        : 0,
  filterStore  : AllTasksFilterStore,
  filterString : null,
  fetchError   : null,

  get isLoading () {
    if (this.fetchError) return false
    if (this.filterStore.string === this.filterString) return false
    return true
  },
})

export const UserStore = createFactory({
  id       : null,
  fullName : null,
  username : null,
  get firstName () {
    return (this.fullName || '').replace(/<[^>]+>/g, '').split(', ')[0]
  },
  get lastName () {
    return (this.fullName || '').replace(/<[^>]+>/g, '').split(', ')[1]
  },
  permissions: mapOf(),
})

export const AllUsersStore = createFactory({
  users: mapOf(UserStore),
})
