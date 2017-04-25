import {
  createFactory,
  getSnapshot,
  applySnapshot,
  clone,
  arrayOf,
} from 'mobx-state-tree'
import {observable, computed} from 'mobx'


export const AllTasksFilterStoreDefault = {
  sortBy     : 'createdTime',
  reverse    : true,
  limit      : 40,
  offset     : 0,
  userId     : [],
  taskStatus : [],
}

export const AllTasksFilterStore = createFactory({
  sortBy     : 'createdTime',
  reverse    : true,
  limit      : 40,
  offset     : 0,
  taskStatus : arrayOf(),
  userId     : arrayOf(),

  get string () {
    return JSON.stringify(getSnapshot(this))
  },
  set string (filterString) {
    applySnapshot(this, JSON.parse(filterString || AllTasksFilterStore().string))
  }
})

const TaskStatus = {
  CHECKED     : 'Закрыта',
  UNCHECKED   : 'Отложена',
  IN_PROGRESS : 'В работе',
}

export class AllTasksFilterViewStore  {
  filter = null
  allUsersStore = null

  @observable taskStatusOptions = Object.entries(TaskStatus).map(([value, label]) => ({
    value, label
  }))

  @computed.struct get userIdOptions () {
    let users = {}
    this.allUsersStore.users.values()
    .filter(u => u.firstName || u.lastName || u.username)
    .sort((a, b) => {
      let s = u => [
        u.firstName || u.lastName ? 1 : 0,
        u.permissions.get('TELEPHONIST_FULL_ACCESS') ? 0 : 1,
        String('0000000000' + u.id).slice(-10),
      ].join()
      return s(a) > s(b)
    }).forEach(u => {
      let name = u.firstName || u.lastName
        ? [u.firstName, u.lastName].filter(v => v).join(' ')
        : u.username
      users[name] = u.id
    })
    return Object.entries(users).map(([label, value]) => ({
      value, label
    }))
  }

  constructor (filter, allUsersStore) {
    this.filter = clone(filter)
    this.allUsersStore = allUsersStore
  }
}
