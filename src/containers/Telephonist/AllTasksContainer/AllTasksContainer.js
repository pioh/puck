import React, {Component, PropTypes} from 'react'
import {observer, inject} from 'mobx-react'

import {AllTasksStore, AllUsersStore} from 'store/Telephonist/AllTasksStore'
import {AllTasksFilterStoreDefault} from 'store/Telephonist/AllTasksFilterStore'
import {AllTasksFetcher} from 'side/fetchers/Telephonist'
import AllTasks from 'components/Telephonist/AllTasks'
import AllTasksFilter from 'components/Telephonist/AllTasksFilter'

import s from './AllTasksContainer.sass'


export default
@inject('history')
@observer
class AllTasksContainer extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
  }
  allTasksStore = AllTasksStore({filterStore: AllTasksFilterStoreDefault})
  allUsersStore = AllUsersStore()
  allTasksFetcher = new AllTasksFetcher({
    allTasksStore : this.allTasksStore,
    allUsersStore : this.allUsersStore,
    history       : this.props.history,
  })

  componentWillUnmount () {
    this.allTasksFetcher.destroy()
  }

  render () {
    return (
      <div className={s.root}>
        <AllTasksFilter
          filter={this.allTasksStore.filterStore}
          allTasksFetcher={this.allTasksFetcher}
          allUsersStore={this.allUsersStore} />
        <AllTasks
          allTasksStore={this.allTasksStore}
          allUsersStore={this.allUsersStore}
          allTasksFetcher={this.allTasksFetcher}
          />
      </div>
    )
  }
}
