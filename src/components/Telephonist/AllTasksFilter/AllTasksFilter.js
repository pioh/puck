import React, {Component, PropTypes} from 'react'
import {observer} from 'mobx-react'
import {action} from 'mobx'
import {getSnapshot, applySnapshot, onPatch, applyPatch} from 'mobx-state-tree'

import {
  Multiselect,
} from 'components/lib'
import {AllTasksFilterViewStore} from 'store/Telephonist/AllTasksFilterStore'


import s from './AllTasksFilter.sass'


export default
@observer
class AllTasksFilter extends Component {
  static propTypes = {
    filter          : PropTypes.object.isRequired,
    allTasksFetcher : PropTypes.object.isRequired,
    allUsersStore   : PropTypes.object.isRequired,
  }

  filterView = new AllTasksFilterViewStore(this.props.filter, this.props.allUsersStore)

  disposers = []
  @action componentWillMount () {
    try {
      let {filter} = JSON.parse(window.localStorage.getItem('allTasksFilterViewStore'))
      if (filter) {
        applySnapshot(this.filterView.filter, filter)
        this.apply()
      }
    } catch (e) {}
  }
  componentDidMount () {
    onPatch(this.props.filter, patch => {
      applyPatch(this.filterView.filter, patch)
      window.localStorage.setItem(
        'allTasksFilterViewStore',
        JSON.stringify({
          filter: getSnapshot(this.filterView.filter),
        })
      )
    })
  }
  componentWillUnmount () {
    this.disposers.forEach(disposer => disposer())
    this.disposers = []
  }

  apply = () => {
    applySnapshot(this.props.filter, getSnapshot(this.filterView.filter))
  }
  render () {
    return (
      <div className={s.root}>
        <div className={s.row}>
          <div className={s.field}>
            <div className={s.fieldLabel}>Статус</div>
            <div className={s.fieldInput}>
              <Multiselect
                store={this.filterView.filter}
                field='taskStatus'
                options={this.filterView.taskStatusOptions}
                />
            </div>
          </div>
          <div className={s.field}>
            <div className={s.fieldLabel}>Оператор</div>
            <div className={s.fieldInput}>
              <Multiselect
                store={this.filterView.filter}
                field='userId'
                options={this.filterView.userIdOptions}
                />
            </div>
          </div>
          <button
            disabled={
              this.props.allTasksFetcher.loadingFilterString !== null ||
              this.props.filter.string === this.filterView.filter.string
            }
            className={`btn btn-primary ${s.buttonApply}`}
            onClick={this.apply}>
            Применить
          </button>
        </div>
      </div>
    )
  }
}
