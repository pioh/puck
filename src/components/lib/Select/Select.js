import React, {Component, PropTypes} from 'react'
import RBMultiselect from 'react-bootstrap-multiselect'
import _get from 'lodash/get'
import classNames from 'classnames'

import {observer} from 'mobx-react'
import {computed, action, autorun, runInAction} from 'mobx'

import s from './Select.sass'

export default
@observer
class Select extends Component {
  static propTypes = {
    store   : PropTypes.object.isRequired,
    field   : PropTypes.string.isRequired,
    options : PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.array,
    ]).isRequired,
    upper    : PropTypes.bool,
    size     : PropTypes.string,
    style    : PropTypes.object,
    onChange : PropTypes.func,
    disabled : PropTypes.bool,
  }
  disposers = []
  static defaultProps = {
    upper: false,
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
    this.props.onChange && this.props.onChange(v)
  }
  componentWillMount (props) {
    this.disposers.push(autorun(this.checkProps))
  }
  componentWillUnmount () {
    this.disposers.forEach(disposer => {
      disposer()
    })
    this.disposers = []
  }

  checkProps = () => {
    if (!this.props.options.find(o => o.value === this.value)) {
      runInAction(() => {
        this.value = this.props.options[0] ? this.props.options[0].value : null
      })
    }
  }
  componentWillReceiveProps (props) {
    this.checkProps(props)
  }

  @action checkProps (props) {
    if (this.value !== null && !this.optionsMap[this.value]) {
      this.value = null
    }
  }
  @computed.struct get optionsMap () {
    let map = {}
    this.props.options.forEach(o => {
      map[o.value] = o.label || o.value
    })
    return map
  }
  @computed.struct get data () {
    return this.props.options.map(({value, label}) => {
      return {
        value,
        label,
        selected: this.value === value,
      }
    })
  }

  @action onChange = (option, checked, o) => {
    let label = option.attr('label')
    let val = this.props.options.find(o => o.label === label).value
    this.value = checked ? val : null
  }
  render () {
    return (
      <div
        className={classNames(s.root, {
          [s.upper] : this.props.upper,
          [s.small] : this.props.size === 'small',
          [s.sm]    : this.props.size === 'sm',
        })}
        style={this.props.style}
       >
        <RBMultiselect
          nonSelectedText='Не важно'
          nSelectedText=' выбрано'
          allSelectedText='Все'
          numberDisplayed={2}
          data={this.data}
          disabled={this.props.disabled}
          onChange={this.onChange}
          ref='select'
          />
      </div>
    )
  }
}
