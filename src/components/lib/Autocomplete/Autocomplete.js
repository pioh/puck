import React, {PropTypes, Component} from 'react'
import {observer} from 'mobx-react'
import {observable, action, asStructure, autorun, runInAction, computed} from 'mobx'
import $ from 'jquery'
import classNames from 'classnames'
import _get from 'lodash/get'

import s from './Autocomplete.sass'


export default
@observer
class Autocomplete extends Component {
  static propTypes = {
    store        : PropTypes.object.isRequired,
    field        : PropTypes.string.isRequired,
    autocomplete : PropTypes.func.isRequired,
    className    : PropTypes.string,
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

  @observable isFocus = false
  @observable list = asStructure([])
  @observable listWord = null

  disposers = []
  componentDidMount () {
    this.disposers.push(autorun(this.autocomplete))
  }
  componentWillUnmount () {
    this.disposers.forEach(disposer => disposer())
    this.disposers = []
    this.removeClickListener()
  }

  autocomplete = () => {
    if (!this.isFocus) return
    if (this.listWord === this.value) return
    this.requestList().catch(e => console.error(e && e.stack || e))
  }

  async requestList () {
    let word = this.value
    let list = await this.props.autocomplete(word)
    if (word !== this.value) return
    runInAction(() => {
      this.list = list
      this.listWord = word
    })
  }

  @action onFocus = () => {
    this.addClickListener()
    this.isFocus = true
  }

  @action onInput = () => {
    this.addClickListener()
    this.isFocus = true
  }

  addClickListener () {
    if (this.listener) return
    $('body').on('mousedown', this.onWindowClick)
    this.listener = true
  }

  removeClickListener () {
    if (!this.listener) return
    $('body').off('mousedown', this.onWindowClick)
    this.listener = false
  }

  @action onChange = (e) => {
    if (e.target.value !== this.value) {
      this.value = e.target.value
    }
  }

  @action onWindowClick = (e) => {
    if (!$.contains(this.refs.root, e.target)) {
      this.isFocus = false
      this.removeClickListener()
      return
    }
    let row = $(e.target).hasClass(s.row)
      ? $(e.target) : $(e.target).parent().hasClass(s.row)
      ? $(e.target).parent() : null
    if (row) {
      this.isFocus = false
      this.props.store[this.props.field] = row.attr('data')
    }
  }

  highlight (str, words) {
    str = [str]
    words = words.toLowerCase().replace(/[^a-zа-яё0-9]/g, ' ').replace(/^\s+/, '').replace(/\s+$/, '').split(/\s+/)
    let key = 0
    words.forEach(word => {
      let nstr = []
      str.forEach(s => {
        if (typeof s !== 'string') return nstr.push(s)
        let m = s.match(new RegExp(`${word}`, 'mig'))
        m = (m || []).map(s => (
          <strong key={key++}>{s}</strong>
        ))
        s = s.split(new RegExp(`${word}`, 'mig'))
        s.forEach((s, i) => {
          if (i > 0) nstr.push(m[i - 1])
          nstr.push(s)
        })
      })
      str = nstr
    })
    return str
  }

  render () {
    return (
      <div className={classNames(s.root, this.props.className)} ref='root'>
        <input
          spellCheck={false}
          className={'form-control ' + s.input}
          ref='input'
          value={this.value || ''}
          type='text'
          onInput={this.onInput}
          onChange={this.onChange}
          onFocus={this.onFocus}
          />
        {this.isFocus && this.list.length > 0 && (
          <div className={s.list}>
            {this.list.map((item, i) =>
              <div className={s.row} data={item} key={i}>
                {this.highlight(item, this.value)}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
}
