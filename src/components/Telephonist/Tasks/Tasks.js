import React, {Component, PropTypes} from 'react'
import {computed, asMap, observable, action} from 'mobx'
import {PrettyInt, PrettyFloat} from 'lib/Pretty'
import {observer} from 'mobx-react'
import classNames from 'classnames'

import {RealtyType} from 'store/Telephonist/const/enums'
import Table from 'components/lib/Table'

import s from './Tasks.sass'

const tableScheme = {
  localIndicator : 'telephonistTasks',
  fields         : {
    index: {
      title     : '#',
      width     : 40,
      className : classNames(s.index),
    },
    'offer.rawAddress': {
      title    : 'Адрес',
      minWidth : 260,
      sortable : true,
    },
    'offer.realtyType': {
      title     : 'Тип объекта оценки',
      width     : 160,
      sortable  : true,
      className : classNames(s.rightBy1),
    },
    'offer.total': {
      title     : 'Общая площадь',
      width     : 128,
      sortable  : true,
      className : classNames(s.rightBy1),
    },
    'offer.price': {
      title          : 'Цена',
      width          : 150,
      sortable       : true,
      className      : classNames(s.rightBy0),
      classNameValue : classNames(s.price),
    },
    'offer.published': {
      title     : 'Публикация',
      width     : 115,
      sortable  : true,
      className : classNames(s.rightBy0),
    },
    'taskStatus': {
      title     : 'Задача',
      width     : 110,
      sortable  : true,
      className : classNames(s.rightBy0),
      noLink    : true,
    },
    'offer.verificationStatus': {
      title     : 'Объявление',
      width     : 135,
      sortable  : true,
      className : classNames(s.rightBy0),
    },
  },
  groups: [
    'index',
    [
      ['offer.rawAddress'],
      [['offer.realtyType', 'offer.total']],
    ],
    [
      [[['offer.price', 'offer.published']]],
      [[[['taskStatus', 'offer.verificationStatus']]]],
    ],
  ],
  key: 'id',
}

const statusMap = {
  CHECKED: {
    title : 'Закрыта',
    color : '#1c5925',
  },
  IN_PROGRESS: {
    title : 'В работе',
    color : '#013384',
  },
  VALID: {
    title : 'Дополнено',
    color : '#1c5925',
  },
  INVALID: {
    title : 'Невалидное',
    color : '#983225',
  },
  CANNOTCHECK: {
    title : 'Невозможно проверить',
    color : '#983225',
  },
  null: {
    title : 'Не проверено',
    color : '#333',
  },
}


export default
@observer
class Tasks extends Component {
  static propTypes = {
    tasksStore   : PropTypes.object.isRequired,
    tasksFetcher : PropTypes.object.isRequired,
  }

  toLink = id => {
    return {
      pathname : '/telephonist/task',
      args     : {
        taskID: id,
      },
    }
  }

  tooltip = id => {
    let o = this.props.tasksStore.tasks.find(o => o.id === id)
    if (!o || !o.comments) return null
    return <div className={s.tooltip}>{o.comments}</div>
  }

  @observable statusBusy = asMap({})
  @action toWork = e => {
    let id = e.target.getAttribute('data')
    this.statusBusy.set(id, true)
    this.props.tasksFetcher.toWork(id).finally(action(() => {
      this.statusBusy.delete(id)
    }))
  }

  @computed.struct get data () {
    return this.props.tasksStore.tasks.map(o => {
      let taskStatus = o.taskStatus
      return {
        ...o,
        offer: {
          ...o.offer,
          price      : o.offer.price ? o.offer.price.toString()::PrettyInt() + ' руб.' : undefined,
          total      : o.offer.total ? <span>{o.offer.total.toString()::PrettyFloat()} м<sup>2</sup></span> : undefined,
          realtyType : RealtyType[o.offer.realtyType] || o.offer.realtyType,
          published  : (
            <div className={s.manuallyCreated}>
              {o.offer.published}
              {o.manuallyCreated && <div title='Объявление созданное оператором'>Новое</div>}
            </div>
          ),
          verificationStatus: (
            <div className={s.verificationStatus} style={{color: statusMap[o.offer.verificationStatus].color}}>
              {statusMap[o.offer.verificationStatus].title}
            </div>
          ),
        },
        taskStatus: statusMap[taskStatus] ? (
          <div className={s.statusText} style={{color: statusMap[taskStatus].color}}>
            {statusMap[taskStatus].title}
          </div>
        ) : (
          <button
            className={`btn btn-default btn-xs ${s.statusButton}`}
            data={o.id}
            disabled={this.statusBusy.get(o.id) === true}
            onClick={this.toWork}>
              Взять в работу
          </button>
        ),
      }
    })
  }
  render () {
    return (
      <div className={s.root}>
        <Table
          className={s.table}
          scheme={tableScheme}
          filter={this.props.tasksStore.filterStore}
          data={this.data}
          count={this.props.tasksStore.count}
          toLink={this.toLink}
          tooltip={this.tooltip}
          loading={this.props.tasksStore.isLoading}
          error={this.props.tasksStore.fetchError}
          forceScroll
          />
      </div>
    )
  }
}
