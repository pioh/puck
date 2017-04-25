import React, {PropTypes, Component} from 'react'
import {observer} from 'mobx-react'
import {observable, action, computed, autorun, runInAction} from 'mobx'
import ReactDOM from 'react-dom'
import _get from 'lodash/get'
import _omit from 'lodash/omit'
import classNames from 'classnames'

import s from './Mask.sass'


export default
@observer
class Mask extends Component {
  static propTypes = {
    store     : PropTypes.object.isRequired,
    field     : PropTypes.string.isRequired,
    type      : PropTypes.string,
    onChange  : PropTypes.func,
    textarea  : PropTypes.bool,
    className : PropTypes.string,
    format    : PropTypes.string,
  }
  static defaultProps = {
    type     : 'text',
    textarea : false,
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

  @observable viewValue
  @observable edit = false
  disposers = []
  componentDidMount () {
    this.disposers.push(autorun(this.propsToValue))
  }
  componentWillUnmount () {
    this.disposers.forEach(disposer => disposer())
    this.disposers = []
  }

  propsToValue = () => {
    if (this.edit) return
    if (this.propsValue !== this.viewValue) {
      runInAction(() => {
        this.viewValue = this.propsValue
      })
    }
  }

  @computed get propsValue () {
    return this.edit
      ? this.editReplace(this.toText(this.value))
      : this.blurReplace(this.editReplace(this.toText(this.value)))
  }

  editReplace (text) {
    var c
    switch (this.props.type) {
      case 'meter' :
        text = text.replace(/,/g, '.')
        text = text.replace(/\s/g, '')
        text = text.replace(/[^\d.]/g, '')
        let [a, b] = text.split('.').slice(0, 2)
        if (!a && !b) return ''

        if (!a) a = '0'

        do {
          c = a
          a = c.replace(/(\d)(\d\d\d(?:\s|$))/g, '$1 $2')
        } while (a !== c)
        if (b) b = b.substr(0, 2)
        text = [a]
        if (b !== undefined) {
          text.push(b)
        }
        return text.join('.')
      case 'int' :
        text = text.replace(/\D/g, '')
        do {
          c = text
          text = c.replace(/(\d)(\d\d\d(?:\s|$))/g, '$1 $2')
        } while (text !== c)
        return text
      case 'number' :
        text = text.replace(/\D/g, '')
        return text
      case 'percent' :
        text = text.replace(/\D/g, '')
        if (+text > 100) text = '100'
        return text
      default:
        return text
    }
  }

  blurReplace (text) {
    switch (this.props.type) {
      case 'meter' :
        if (text === '') return text
        let [a, b] = text.split('.')
        if (b === '' || b === undefined) b = '00'
        else if (b.length === 1) b = b + '0'
        return [a, b].join('.')
      default:
        return text
    }
  }

  toText (val) {
    if (val === undefined || val === null) return ''
    return String(val)
  }

  fromText (text) {
    if (text === '') return null
    switch (this.props.type) {
      case 'meter':
      case 'int':
      case 'number':
      case 'percent':
        text = Number(text.replace(/\s/g, ''))
        break
    }
    if (this.props.format === 'string') {
      text = String(text)
    }
    return text
  }

  @action onInput = (e) => {
    this.edit = true
    let input = e.target
    let ereplace = this.editReplace(input.value)
    if (this.viewValue !== ereplace) {
      this.viewValue = ereplace
    } else {
      input.value = ereplace
    }

    let value  = this.fromText(this.blurReplace(ereplace))
    if (value !== this.value) {
      this.value = this.fromText(this.viewValue)
      this.props.onChange && this.props.onChange(this.value)
    }
  }
  @action onBlur = () => {
    this.edit = false
    let input = ReactDOM.findDOMNode(this.refs.input)
    let ereplace = this.editReplace(input.value)
    let breplace = this.blurReplace(ereplace)
    let value  = this.fromText(breplace)
    this.viewValue = breplace

    if (value !== this.value) {
      this.value = this.fromText(this.viewValue)
      this.props.onChange && this.props.onChange(this.value)
    }
  }

  render () {
    let props = _omit(this.props, ['store', 'field', 'type', 'onChange', 'textarea', 'className', 'value'])
    return (this.props.textarea
    ? <textarea
      className={classNames('form-control', s.input, this.props.className)}
      ref='input'
      value={this.edit ? this.viewValue : this.propsValue}
      type='text'
      onChange={this.onInput}
      onBlur={this.onBlur}
      {...props}
      />
    : <input
      className={classNames('form-control', s.input, this.props.className)}
      ref='input'
      value={this.edit ? this.viewValue : this.propsValue}
      type='text'
      onChange={this.onInput}
      onBlur={this.onBlur}
      {...props}
      />
    )
  }
}
