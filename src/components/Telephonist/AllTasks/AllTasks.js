import React, {Component, PropTypes} from 'react'
import {computed, asMap, observable, action, extendObservable} from 'mobx'
import {PrettyInt, PrettyFloat} from 'lib/Pretty'
import {observer} from 'mobx-react'
import classNames from 'classnames'

import {Select} from 'components/lib'
import {RealtyType} from 'store/Telephonist/const/enums'
import Table from 'components/lib/Table'

import s from './AllTasks.sass'

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
      className : classNames(s.rightBy2),
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
      className      : classNames(s.rightBy1),
      classNameValue : classNames(s.price),
    },
    'offer.published': {
      title     : 'Публикация',
      width     : 115,
      sortable  : true,
      className : classNames(s.rightBy0),
    },
    'userId': {
      title     : 'Оператор',
      width     : 150,
      className : classNames(s.rightBy0),
      noLink    : true,
    },
    'taskStatus': {
      title     : 'Задача',
      sortable  : true,
      width     : 110,
      className : classNames(s.rightBy0),
      noLink    : true,
    },
    'offer.verificationStatus': {
      title     : 'Объявление',
      sortable  : true,
      width     : 135,
      className : classNames(s.rightBy0),
    },
  },
  groups: [
    'index',
    [
      ['offer.rawAddress', 'offer.realtyType'],
      [['offer.total', 'offer.price']],
    ],
    [
      [[['taskStatus', 'userId']]],
      [[[['offer.published', 'offer.verificationStatus']]]],
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
class AllTasks extends Component {
  static propTypes = {
    allTasksStore   : PropTypes.object.isRequired,
    allUsersStore   : PropTypes.object.isRequired,
    allTasksFetcher : PropTypes.object.isRequired,
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
    let o = this.props.allTasksStore.allTasks.find(o => o.id === id)
    if (!o || !o.comments) return null
    return <div className={s.tooltip}>{o.comments}</div>
  }

  @observable statusBusy = asMap({})
  @observable userIdBusy = asMap({})
  @action toWork = e => {
    let id = e.target.getAttribute('data')
    this.statusBusy.set(id, true)
    this.props.allTasksFetcher.toWork(id).finally(action(() => {
      this.statusBusy.delete(id)
    }))
  }

  @action changeUser = (o, oldUser) => {
    this.userIdBusy.set(o.id, true)
    this.props.allTasksFetcher.changeUser({
      id     : o.id,
      userId : o.userId,
    }).then(action(response => {
      if (!response.ok) {
        o.userId = oldUser
      }
    })).catch(action((e) => {
      console.error(e.stack)
      o.userId = oldUser
    })).finally(action(() => {
      this.userIdBusy.delete(o.id)
    }))
  }
  @action changeStatus = (o, oldStatus) => {
    this.statusBusy.set(o.id, true)
    this.props.allTasksFetcher.changeStatus({
      id     : o.id,
      status : o.taskStatus,
    }).then(action(response => {
      if (!response.ok) {
        o.taskStatus = oldStatus
      }
    })).catch(action((e) => {
      console.error(e.stack)
      o.taskStatus = oldStatus
    })).finally(action(() => {
      this.statusBusy.delete(o.id)
    }))
  }

  @computed.struct get usersSelect () {
    let users = {}
    this.props.allUsersStore.users.values()
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
    return users
  }

  @observable dataCells = {}

  getDataCell (i) {
    if (this.dataCells[i]) return this.dataCells[i]
    extendObservable(this.dataCells, {
      [i]: computed(() => {
        let o = this.props.allTasksStore.allTasks[i]
        let userSelectOptions = Object.entries(this.usersSelect).map(a => a.reverse())
        userSelectOptions = userSelectOptions.map(([value, label]) => ({value, label}))
        if (!o.userId) {
          userSelectOptions.unshift({
            value : null,
            label : ``,
          })
        } else {
          let found = userSelectOptions.find(a => a.value === o.userId)
          if (!found) {
            userSelectOptions.push({
              value : o.userId,
              label : `#${o.userId}`,
            })
          }
        }
        let userSelect = (
          <Select
            store={o}
            field='userId'
            options={userSelectOptions}
            size='small'
            disabled={this.userIdBusy.get(o.id) === true}
            style={{
              maxWidth: 130,
            }}
            onChange={this.changeUser.bind(this, o, o.userId)}
          />
        )
        let statusSelectOptions = [
          ['UNCHECKED', 'Отложена'],
          ['IN_PROGRESS', 'В работе'],
        ]
        if (o.taskStatus === 'CHECKED') statusSelectOptions.push(['CHECKED', 'Закрыта'])

        statusSelectOptions = statusSelectOptions.map(([value, label]) => ({value, label}))
        let statusSelect = (
          <Select
            store={o}
            field='taskStatus'
            options={statusSelectOptions}
            size='small'
            disabled={this.statusBusy.get(o.id) === true}
            style={{
              maxWidth: 130,
            }}
            onChange={this.changeStatus.bind(this, o, o.taskStatus)}
          />
        )

        return {
          ...o,
          offer: {
            ...o.offer,
            price : o.offer.price ? o.offer.price.toString()::PrettyInt() + ' руб.' : undefined,
            total : o.offer.total ? (
              <span>{o.offer.total.toString()::PrettyFloat()} м<sup>2</sup></span>
            ) : undefined,
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
          taskStatus : statusSelect,
          userId     : userSelect,
        }
      }),
    })
    return this.dataCells[i]
  }

  @computed get data () {
    return this.props.allTasksStore.allTasks.map((o, i) => {
      return this.getDataCell(i)
    })
  }
  render () {
    return (
      <div className={s.root}>
        <Table
          className={s.table}
          scheme={tableScheme}
          filter={this.props.allTasksStore.filterStore}
          data={this.data}
          count={this.props.allTasksStore.count}
          toLink={this.toLink}
          tooltip={this.tooltip}
          loading={this.props.allTasksStore.isLoading}
          error={this.props.allTasksStore.fetchError}
          forceScroll
          />
      </div>
    )
  }
}
