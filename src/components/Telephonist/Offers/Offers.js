import React, {Component, PropTypes} from 'react'
import {computed, asMap, observable, action} from 'mobx'
import {observer} from 'mobx-react'
import classNames from 'classnames'
import {PrettyInt, PrettyFloat} from 'lib/Pretty'

import {RealtyType} from 'store/Telephonist/const/enums'
import Table from 'components/lib/Table'

import s from './Offers.sass'

const tableScheme = {
  localIndicator : 'telephonistOffers',
  fields         : {
    index: {
      title     : '#',
      width     : 40,
      className : classNames(s.index),
    },
    rawAddress: {
      title    : 'Адрес',
      minWidth : 260,
      sortable : true,
    },
    total: {
      title     : 'Общая площадь',
      width     : 128,
      sortable  : true,
      className : classNames(s.rightBy1),
    },
    realtyType: {
      title     : 'Тип объекта оценки',
      width     : 160,
      sortable  : true,
      className : classNames(s.rightBy2),
    },
    price: {
      title          : 'Цена',
      width          : 145,
      sortable       : true,
      className      : classNames(s.rightBy1),
      classNameValue : classNames(s.price),
    },
    published: {
      title     : 'Публикация',
      width     : 90,
      sortable  : true,
      className : classNames(s.rightBy0),
    },
    markNoticed: {
      title     : 'Замечено',
      width     : 85,
      sortable  : true,
      className : classNames(s.rightBy0),
    },
    lastSourceUpdate: {
      title     : 'Обновлено',
      width     : 85,
      sortable  : true,
      className : classNames(s.rightBy0),
    },
    action: {
      title     : 'Статус',
      width     : 115,
      className : classNames(s.rightBy0),
    },
  },
  groups: [
    'index',
    [
      ['rawAddress', 'realtyType'],
      [['total', 'price']],
    ], [
      [[['published', 'lastSourceUpdate']]],
      [[[['markNoticed', 'action']]]],
    ],
  ],
  key: 'hid',
}

const statusMap = {
  CHECKED: {
    title : 'Обработано',
    color : '#35aa47',
  },
  IN_PROGRESS: {
    title : 'В работе',
    color : '#4d90fe',
  },
}

export default
@observer
class Offers extends Component {
  static propTypes = {
    offersStore   : PropTypes.object.isRequired,
    offersFetcher : PropTypes.object.isRequired,
  }
  @observable statusBusy = asMap({})
  @action toWork = e => {
    let hid = e.target.getAttribute('data')
    this.statusBusy.set(hid, true)
    this.props.offersFetcher.toWork(hid).finally(action(() => {
      this.statusBusy.delete(hid)
    }))
  }

  @computed.struct get data () {
    return this.props.offersStore.offers.map(o => {
      let taskStatus = this.props.offersStore.taskStatus.get(o.hid)
      return {
        ...o,
        price      : o.price ? o.price.toString()::PrettyInt() + ' руб.' : undefined,
        total      : o.total ? <span>{o.total.toString()::PrettyFloat()} м<sup>2</sup></span> : undefined,
        realtyType : RealtyType[o.realtyType] || o.realtyType,
        action     : statusMap[taskStatus] ? (
          <div className={s.statusText} style={{color: statusMap[taskStatus].color}}>
            {statusMap[taskStatus].title}
          </div>
        ) : (
          <button
            className={`btn btn-default btn-xs ${s.statusButton}`}
            data={o.hid}
            disabled={this.statusBusy.get(o.hid) === true}
            onClick={this.toWork}>
              Взять в работу
          </button>
        )
      }
    })
  }
  @computed get error () {
    return this.props.offersStore.fetchError || (
      this.props.offersStore.filterStore.location &&
      this.props.offersStore.filterStore.location.length ? null : 'Необходимо ввести Адрес'
    ) || null
  }
  render () {
    return (
      <div className={s.root}>
        <Table
          className={s.table}
          scheme={tableScheme}
          filter={this.props.offersStore.filterStore}
          data={this.data}
          count={this.props.offersStore.count}
          loading={this.props.offersStore.isLoading}
          error={this.error}
          forceScroll
          />
      </div>
    )
  }
}
