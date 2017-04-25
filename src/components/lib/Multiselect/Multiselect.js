import React, { Component, PropTypes } from 'react'
import RBMultiselect from 'react-bootstrap-multiselect'
import _get from 'lodash/get'

import {observer} from 'mobx-react'
import {computed, action} from 'mobx'

import s from './Multiselect.sass'


export default
@observer
class Multiselect extends Component {
  static propTypes = {
    store   : PropTypes.object.isRequired,
    field   : PropTypes.string.isRequired,
    options : PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.array,
    ]).isRequired,
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
  componentWillMount (props) {
    this.checkProps(this.props)
  }
  componentWillReceiveProps (props) {
    this.checkProps(props)
  }

  @action checkProps (props) {
    let badOptions = this.value.filter(key => !this.optionsMap[key])
    if (badOptions.length) {
      this.value =  this.value.filter(key => this.optionsMap[key])
    }
  }
  @computed.struct get selectedMap () {
    let map = {}
    this.value.forEach(v => {
      map[v] = true
    })
    return map
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
        selected: this.selectedMap[value] === true,
      }
    })
  }

  @action onChange = (option, checked) => {
    let label = option.attr('label')
    let val = this.props.options.find(o => o.label === label).value

    let map = {...this.selectedMap}
    map[val] = checked === true
    this.value = Object.entries(map).filter(([k, v]) => v).map(([k]) => k).sort()
  }
  render () {
    return (
      <div className={s.root}>
        <RBMultiselect
          nonSelectedText='Не важно'
          nSelectedText=' выбрано'
          allSelectedText='Все'
          numberDisplayed={2}
          data={this.data}
          onChange={this.onChange}
          ref='select'
          multiple />
      </div>
    )
  }
}
