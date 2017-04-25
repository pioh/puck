import React, {PropTypes, Component} from 'react'
import {observer} from 'mobx-react'
import {computed, action} from 'mobx'

import Datetime from 'react-datetime'
import _get from 'lodash/get'

import s from './Datepicker.sass'

let to2 = s => ('' + s).length === 1 ? '0' + s : s

export default
@observer
class Datepicker extends Component {
  static propTypes = {
    store : PropTypes.object.isRequired,
    field : PropTypes.string.isRequired,
  }
  @computed get store () {
    return _get(this.props, ['store', ...this.props.field.split('.').reverse().slice(1).reverse()])
  }
  @computed get field () {
    return this.props.field.split('.').slice(-1)[0]
  }
  @computed get value () {
    return this.store[this.field]
  }
  set value (v) {
    this.store[this.field] = v
  }

  fromDate (value) {
    if (value && value.date) {
      value = [
        to2(value.date()),
        to2(value.month() + 1),
        value.year(),
      ].join('.')
    }
    if (typeof value === 'string') {
      if (!value.match(/\d\d\.\d\d\.\d\d\d\d/)) {
        value = null
      }
    }
    return value
  }

  @action onChange = v => {
    this.value = this.fromDate(v)
  }

  render () {
    let date = new Date()
    return (
      <div className={s.root}>
        <Datetime
          dateTime={`${to2(date.getDate())}.${to2(date.getMonth() + 1)}.${date.getFullYear()}`}
          dateFormat='DD.MM.YYYY'
          viewMode='days'
          value={this.value}
          inputFormat='DD.MM.YYYY'
          timeFormat={false}
          closeOnSelect
          closeOnTab
          onChange={this.onChange}
          />
      </div>
    )
  }
}
