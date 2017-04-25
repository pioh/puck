import {
  createFactory,
  getSnapshot,
  applySnapshot,
  clone,
} from 'mobx-state-tree'


export const TasksFilterStoreDefault = {
  sortBy  : 'createdTime',
  reverse : true,
  limit   : 40,
  offset  : 0,
}

export const TasksFilterStore = createFactory({
  sortBy  : 'createdTime',
  reverse : true,
  limit   : 40,
  offset  : 0,

  get string () {
    return JSON.stringify(getSnapshot(this))
  },
  set string (filterString) {
    applySnapshot(this, JSON.parse(filterString || TasksFilterStore().string))
  }
})

export class TasksFilterViewStore  {
  filter = null

  constructor (filter) {
    this.filter = clone(filter)
  }
}
