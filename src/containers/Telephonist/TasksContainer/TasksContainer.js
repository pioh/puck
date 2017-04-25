import React, {Component, PropTypes} from 'react'
import {observer, inject} from 'mobx-react'

import {TasksStore} from 'store/Telephonist/TasksStore'
import {TasksFilterStoreDefault} from 'store/Telephonist/TasksFilterStore'
import {TasksFetcher} from 'side/fetchers/Telephonist'
import Tasks from 'components/Telephonist/Tasks'

import s from './TasksContainer.sass'


export default
@inject('history', 'userStore')
@observer
class TasksContainer extends Component {
  static propTypes = {
    history   : PropTypes.object.isRequired,
    userStore : PropTypes.object.isRequired,
  }
  tasksStore = TasksStore({filterStore: TasksFilterStoreDefault})
  tasksFetcher = new TasksFetcher({
    tasksStore : this.tasksStore,
    userStore  : this.props.userStore,
    history    : this.props.history,
  })

  componentWillUnmount () {
    this.tasksFetcher.destroy()
  }

  render () {
    return (
      <div className={s.root}>
        <Tasks tasksFetcher={this.tasksFetcher} tasksStore={this.tasksStore} />
      </div>
    )
  }
}
