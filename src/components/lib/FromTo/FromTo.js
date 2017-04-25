import React, {Component} from 'react'
import PropTypes from 'prop-types'
import FormGroup from 'react-bootstrap/es/FormGroup'
import InputGroup from 'react-bootstrap/es/InputGroup'
import {observer} from 'mobx-react'
import {action, observe, observable, computed} from 'mobx'
import Datetime from 'react-datetime'
import 'react-datetime/css/react-datetime.css'
import classNames from 'classnames'
import _get from 'lodash/get'

import {Mask} from 'components/lib'

import s from './FromTo.sass'

const Addon = InputGroup.Addon

let to2 = s => (String(s)).length === 1 ? '0' + s : s

export default
@observer
class FromTo extends Component {
  static propTypes = {
    from: PropTypes.shape({
      store : PropTypes.object.isRequired,
      field : PropTypes.string.isRequired,
      type  : PropTypes.string,
    }).isRequired,
    to: PropTypes.shape({
      store : PropTypes.object.isRequired,
      field : PropTypes.string.isRequired,
      type  : PropTypes.string,
    }).isRequired,
    type: PropTypes.string,
  }
  @observable from = {
    store: computed(() => {
      return _get(this.props.from, ['store', ...this.props.from.field.split('.').reverse().slice(1).reverse()])
    }),
    field: computed(() => {
      return this.props.from.field.split('.').slice(-1)[0]
    }),
  }
  @observable to = {
    store: computed(() => {
      return _get(this.props.to, ['store', ...this.props.to.field.split('.').reverse().slice(1).reverse()])
    }),
    field: computed(() => {
      return this.props.to.field.split('.').slice(-1)[0]
    }),
  }

  disposers = []
  componentDidMount () {
    this.disposers.push(observe(
      this.from.store,
      this.from.field,
      this.onChange.bind(this, 'from'),
    ))
    this.disposers.push(observe(
      this.to.store,
      this.to.field,
      this.onChange.bind(this, 'to'),
    ))
  }
  componenWillUnmount () {
    this.disposers.forEach(disposer => disposer())
    this.disposers = []
  }
  fromDate (value) {
    if (this.props.type === 'date') {
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
    }
    return value
  }
  @action setFrom = v => {
    this.from.store[this.from.field] = this.fromDate(v)
  }
  @action setTo = v => {
    this.to.store[this.to.field] = this.fromDate(v)
  }

  @action onChange (field, text) {
    let other = field === 'from' ? 'to' : 'from'

    let v1 = text
    let v2 = this[other].store[this[other].field]
    if (this[field].store[this[field].field] !== text) {
      this[field].store[this[field].field] = text
    }
    if (this.props.type === 'date') {
      v1 = (v1 || '').split('.').reverse().join('')
      v2 = (v2 || '').split('.').reverse().join('')
    }
    if (v1 === '' || v2 === '' || v1 === null || v2 === null) {
      v1 = undefined
      v2 = undefined
    }

    v1 = Number(v1)
    v2 = Number(v2)
    if (isNaN(v1)) v1 = null
    if (isNaN(v2)) v2 = null

    if (v1 !== null && v2 !== null) {
      if (field === 'from' && v1 > v2 || field === 'to' && v1 < v2) {
        this[other].store[this[other].field] = text
      }
    }
  }
  renderDate () {
    let date = new Date()
    return (
      <FormGroup className={s.form_group}>
        <InputGroup className={classNames(s.input_group_date, s.input_group_left)}>
          <Addon>от</Addon>
          <Datetime
            dateTime={`${to2(date.getDate())}.${to2(date.getMonth() + 1)}.${date.getFullYear()}`}
            dateFormat='DD.MM.YYYY'
            viewMode='days'
            value={this.from.store[this.from.field]}
            inputFormat='DD.MM.YYYY'
            timeFormat={false}
            closeOnSelect
            closeOnTab
            onChange={this.setFrom}
          />
        </InputGroup>
        <InputGroup className={s.input_group_date}>
          <Addon>до</Addon>
          <Datetime
            dateTime={`${to2(date.getDate())}.${to2(date.getMonth() + 1)}.${date.getFullYear()}`}
            dateFormat='DD.MM.YYYY'
            viewMode='days'
            value={this.to.store[this.to.field]}
            inputFormat='DD.MM.YYYY'
            timeFormat={false}
            closeOnSelect
            closeOnTab
            onChange={this.setTo}
          />
        </InputGroup>
      </FormGroup>
    )
  }
  renderMask () {
    return (
      <FormGroup className={s.form_group}>
        <InputGroup className={s.input_group}>
          <Addon>от</Addon>
          <Mask {...this.props.from} />
        </InputGroup>
        <InputGroup className={s.input_group}>
          <Addon>до</Addon>
          <Mask {...this.props.to} />
        </InputGroup>
      </FormGroup>
    )
  }
  render () {
    return this.props.type === 'date' ? this.renderDate() : this.renderMask()
  }
}
