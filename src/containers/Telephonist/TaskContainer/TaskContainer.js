import React, {Component, PropTypes} from 'react'
import {observer, inject} from 'mobx-react'

import {TaskStore, TaskStoreDefault, TaskViewStore} from 'store/Telephonist/TaskStore'
import {AllUsersStore} from 'store/Telephonist/AllTasksStore'
import {TaskFetcher} from 'side/fetchers/Telephonist'
import Task from 'components/Telephonist/Task'

import s from './TaskContainer.sass'


@inject('history', 'userStore')
@observer
class TaskSubContainer extends Component {
  static propTypes = {
    history   : PropTypes.object.isRequired,
    userStore : PropTypes.object.isRequired,
  }

  taskStore = TaskStore({...TaskStoreDefault, id: this.props.history.props.get('taskID')})
  taskViewStore = new TaskViewStore(this.taskStore)
  allUsersStore = AllUsersStore()
  taskFetcher = new TaskFetcher({
    history       : this.props.history,
    taskStore     : this.taskStore,
    taskViewStore : this.taskViewStore,
    allUsersStore : this.allUsersStore,
    userStore     : this.props.userStore,
  })

  componentWillUnmount () {
    this.taskFetcher.destroy()
  }

  render () {
    return (
      <div className={s.root}>
        <Task
          taskFetcher={this.taskFetcher}
          taskStore={this.taskStore}
          taskViewStore={this.taskViewStore}
          allUsersStore={this.allUsersStore} />
      </div>
    )
  }
}

export default
@inject('history')
@observer
class TaskContainer extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  render () {
    return <TaskSubContainer key={this.props.history.props.get('taskID')} />
  }
}
