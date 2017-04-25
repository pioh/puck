import React, {Component, PropTypes} from 'react'
import {observer, inject} from 'mobx-react'
import Tabs from 'react-bootstrap/es/Tabs'
import Tab from 'react-bootstrap/es/Tab'
import {TextToAddress} from 'side/api/Yandex'
import {action, autorun, computed, runInAction, observable} from 'mobx'
import classNames from 'classnames'
import ReactDOM from 'react-dom'
import MDSpinner from 'react-md-spinner'
import Uploader from './Uploader'

import ReactTooltip from 'react-tooltip'

import {YMapLocation, Autocomplete, Mask, Select, Datepicker} from 'components/lib'

import s from './Task.sass'


@observer
class TaskField extends Component {
  static propTypes = {
    fieldName                  : PropTypes.string,
    fieldStore                 : PropTypes.object,
    valueStore                 : PropTypes.object,
    errorsStore                : PropTypes.object,
    shouldHighlightFieldErrors : PropTypes.bool,
  }

  @computed.struct get errors () {
    let errors = this.props.errorsStore[this.props.fieldName]
    return errors && errors.length > 0 && errors || null
  }

  @computed get shouldHighlightFieldErrors () {
    return this.props.shouldHighlightFieldErrors && this.errors
  }

  @computed get selectOptions () {
    let field = this.props.fieldStore[this.props.fieldName]
    let entries
    entries = Object.entries(field.enum || field.renum)
    if (field.renum) entries = entries.map(a => a.reverse())
    return [[null, 'Не выбрано'], ...entries].map(([value, label]) => ({value, label}))
  }
  date () {
    let field = this.props.fieldStore[this.props.fieldName]
    return <Datepicker store={this.props.valueStore} field={this.props.fieldName} {...field.props} />
  }
  select () {
    let field = this.props.fieldStore[this.props.fieldName]
    return (
      <Select
        store={this.props.valueStore}
        field={this.props.fieldName}
        options={this.selectOptions}
        {...field.props} />
    )
  }
  input () {
    let field = this.props.fieldStore[this.props.fieldName]
    return <Mask store={this.props.valueStore} field={this.props.fieldName} {...field.props} />
  }

  render () {
    let field = this.props.fieldStore[this.props.fieldName]
    let value = null
    switch (field.type) {
      case 'select':
        value = this.select()
        break
      case 'date':
        value = this.date()
        break
      case 'input':
      default:
        value = this.input()
    }
    return (
      <div className={classNames(s.fieldsTableRow, {
        [s.fieldsTableRowError]: this.shouldHighlightFieldErrors,
      })}>
        <div className={s.fieldsTableTitle}>
          {field.title || this.props.fieldName}
          {field.required ? <span className={s.required}>*</span> : null}
        </div>
        <div className={s.fieldsTableValue}>
          {value}
        </div>
      </div>
    )
  }
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
@inject('history', 'userStore')
@observer
class Task extends Component {
  static propTypes = {
    taskStore     : PropTypes.object.isRequired,
    taskViewStore : PropTypes.object.isRequired,
    taskFetcher   : PropTypes.object.isRequired,
    history       : PropTypes.object.isRequired,
    userStore     : PropTypes.object.isRequired,
    allUsersStore : PropTypes.object.isRequired,
  }
  disposers = []
  @action onLatChange = e => { this.props.taskViewStore.task.offer.location[0] = Number(e.target.value) }
  @action onLonChange = e => { this.props.taskViewStore.task.offer.location[1] = Number(e.target.value) }

  @action onSelect = (e) => {
    this.props.history.props.set('tab', e === '0' ? undefined : e)
  }

  @observable resetTime = null
  @computed get justReset () {
    if (!this.resetTime) return false
    if (this.nowTime - this.resetTime < 10000) return true
    return false
  }
  @action resetTask = async () => {
    this.resetTime = new Date().getTime()
    await this.props.taskFetcher.actionReset()
  }
  @computed get resetTooltip () {
    let changed = this.props.taskFetcher.changedFields
    let error = ''
    if (changed.length === 0) {
      return (this.props.taskFetcher.diff
       ? error + 'Eсть несохраненные изменения'
       : error + (this.justReset ? 'Локальные изменения сброшены' : 'Нет изменений')
      )
    }
    return ('Изменения:\n' +
      changed
      .map(k => this.props.taskViewStore.fields[k] || this.props.taskViewStore.otherFields[k] || {title: k})
      .map(field => field.title).filter(v => v)
      .map(v => ` * ${v}`).join('\n')
      .replace(/((?:.*\n){30})(.*\n?)+/, '$1...')
    )
  }


  @observable nowTime = new Date().getTime()
  @observable saveSending = false
  @observable saveError = null
  @observable savedTime = null
  @computed get justSaved () {
    if (!this.savedTime) return false
    if (this.nowTime - this.savedTime < 10000) return true
    return false
  }
  @action saveTask = async () => {
    this.saveSending = true
    let error
    try {
      let response = await this.props.taskFetcher.actionSave()
      error = response && response.error
    } catch (e) {
      console.error(e.stack)
      error = e
    }
    runInAction(() => {
      this.saveSending = false
      if (this.props.taskFetcher.diff) {
        if (!error) error = {message: ''}
        error.message = [error.message, 'Не все поля сохранились!'].filter(v => v).join('\n')
      }
      if (error) {
        this.saveError = error.message
        ReactTooltip.show(ReactDOM.findDOMNode(this.refs[`saveTooltipButton`]))
        setTimeout(() => {
          ReactTooltip.hide(ReactDOM.findDOMNode(this.refs[`saveTooltipButton`]))
        }, 4 * 1000)
      } else {
        this.saveError = null
        this.savedTime = new Date().getTime()
      }
    })
  }
  @computed get saveTooltip () {
    let changed = this.props.taskFetcher.changedFields
    if (this.saveSending) return 'Сохранение...'
    let error = ''
    if (this.saveError) {
      error = this.saveError + '\n\n'
    }
    if (changed.length === 0) {
      return (this.props.taskFetcher.diff
       ? error + 'Eсть несохраненные изменения'
       : error + (this.justSaved ? 'Все изменения сохранены' : 'Нет изменений')
      )
    }
    return (error + 'Изменения:\n' +
      changed
      .map(k => this.props.taskViewStore.fields[k] || this.props.taskViewStore.otherFields[k] || {title: k})
      .map(field => field.title).filter(v => v)
      .map(v => ` * ${v}`).join('\n')
      .replace(/((?:.*\n){30})(.*\n?)+/, '$1...')
    )
  }

  @observable doneErrorsHoverTime = 0
  @observable doneSending = false
  @observable doneError = null
  @action doneTask = async () => {
    this.doneSending = true
    this.saveSending = true
    this.props.taskViewStore.task.offer.verificationStatus = null
    let error
    try {
      let response = await this.props.taskFetcher.actionSave()
      error = response && response.error
    } catch (e) {
      console.error(e.stack)
      error = e
    }
    runInAction(() => {
      this.saveSending = false
      if (this.props.taskFetcher.diff) {
        if (!error) error = {message: ''}
        error.message = [error.message, 'Не все поля сохранились!'].filter(v => v).join('\n')
      }
      if (error) {
        this.saveError = error.message
        this.doneError = this.saveTooltip
        setTimeout(() => {
          ReactTooltip.show(ReactDOM.findDOMNode(this.refs[`doneTooltipButton`]))
          setTimeout(() => {
            ReactTooltip.hide(ReactDOM.findDOMNode(this.refs[`doneTooltipButton`]))
          }, 4 * 1000)
        }, 1)
      }
    })
    if (!error && !this.props.taskViewStore.doneErrors.length) {
      var response
      try {
        response = await this.props.taskFetcher.actionDone()
      } catch (e) {
        response = {error: e}
      }
      if (this.props.taskViewStore.task.taskStatus !== 'CHECKED') {
        if (!response.error) response.error = {message: 'Произошла внутренняя ошибка!'}
      }
      if (response && response.error) {
        runInAction(() => {
          this.doneError = response.error.message || 'Произошла внутренняя ошибка!'
          setTimeout(() => {
            ReactTooltip.show(ReactDOM.findDOMNode(this.refs[`doneTooltipButton`]))
            setTimeout(() => {
              ReactTooltip.hide(ReactDOM.findDOMNode(this.refs[`doneTooltipButton`]))
            }, 4 * 1000)
          }, 1)
        })
      }
    }
    runInAction(() => {
      this.doneSending = false
    })
  }
  @computed get doneTooltip () {
    let errs = this.props.taskViewStore.doneErrors.filter(e => e.type === 'DOCUMENT_ERROR')
    errs = (errs || []).map(e => e.message.replace(/((?:.*\n){30})(.*\n?)+/, '$1...')).join('\n\n')
    if (this.doneError) {
      errs = `${this.doneError}\n\n${errs}`
    }
    return errs || null
  }
  @action onDoneHover = () => {
    this.doneErrorsHoverTime = new Date().getTime()
  }
  @computed get shouldHighlightFieldErrors () {
    return (this.nowTime - this.doneErrorsHoverTime) < 1000 * 10
  }

  @observable toWorkSending = false
  @observable toWorkError = null
  @action toWorkTask = async () => {
    this.toWorkSending = true
    this.saveSending = true

    let error
    try {
      let response = await this.props.taskFetcher.actionSave()
      error = response && response.error
    } catch (e) {
      console.error(e.stack)
      error = e
    }
    runInAction(() => {
      this.saveSending = false
      if (this.props.taskFetcher.diff) {
        if (!error) error = {message: ''}
        error.message = [error.message, 'Не все поля сохранились!'].filter(v => v).join('\n')
      }
      if (error) {
        this.saveError = error.message
        this.toWorkError = this.saveTooltip
        setTimeout(() => {
          ReactTooltip.show(ReactDOM.findDOMNode(this.refs[`toWorkTooltipButton`]))
          setTimeout(() => {
            ReactTooltip.hide(ReactDOM.findDOMNode(this.refs[`toWorkTooltipButton`]))
          }, 4 * 1000)
        }, 1)
      }
    })
    if (!error) {
      var response
      try {
        response = await this.props.taskFetcher.actionToWork()
      } catch (e) {
        response = {error: e}
      }
      if (this.props.taskViewStore.task.taskStatus !== 'IN_PROGRESS') {
        if (!response.error) response.error = {message: 'Произошла внутренняя ошибка!'}
      }
      if (response && response.error) {
        runInAction(() => {
          this.toWorkError = response.error.message || 'Произошла внутренняя ошибка!'
          setTimeout(() => {
            ReactTooltip.show(ReactDOM.findDOMNode(this.refs[`toWorkTooltipButton`]))
            setTimeout(() => {
              ReactTooltip.hide(ReactDOM.findDOMNode(this.refs[`toWorkTooltipButton`]))
            }, 4 * 1000)
          }, 1)
        })
      }
    }
    runInAction(() => {
      this.toWorkSending = false
    })
  }
  @computed get toWorkTooltip () {
    let errs = []
    if (this.toWorkError) {
      errs.push(`${this.toWorkError}`)
    }
    return errs.join('\n\n') || null
  }


  @observable deleteSending = false
  @observable deleteError = null
  @action deleteTask = async () => {
    this.deleteSending = true

    var response
    try {
      response = await this.props.taskFetcher.actionDelete()
    } catch (e) {
      response = {error: e}
    }
    if (response && response.error) {
      runInAction(() => {
        this.deleteError = response.error.message || 'Произошла внутренняя ошибка!'
        setTimeout(() => {
          ReactTooltip.show(ReactDOM.findDOMNode(this.refs[`deleteTooltipButton`]))
          setTimeout(() => {
            ReactTooltip.hide(ReactDOM.findDOMNode(this.refs[`deleteTooltipButton`]))
          }, 4 * 1000)
        }, 1)
      })
    }
    runInAction(() => {
      this.deleteSending = false
    })
  }
  @computed get deleteTooltip () {
    let errs = []
    if (this.deleteError) {
      errs.push(`${this.deleteError}`)
    }
    return errs.join('\n\n') || null
  }


  @observable cancelSending = false
  @observable cancelError = null
  @action cancelTask = async () => {
    this.cancelSending = true
    this.saveSending = true
    let error
    try {
      let response = await this.props.taskFetcher.actionSave()
      error = response && response.error
    } catch (e) {
      console.error(e.stack)
      error = e
    }
    runInAction(() => {
      this.saveSending = false
      if (this.props.taskFetcher.diff) {
        if (!error) error = {message: ''}
        error.message = [error.message, 'Не все поля сохранились!'].filter(v => v).join('\n')
      }
      if (error) {
        this.saveError = error.message
        this.cancelError = this.saveTooltip
        setTimeout(() => {
          ReactTooltip.show(ReactDOM.findDOMNode(this.refs[`cancelTooltipButton`]))
          setTimeout(() => {
            ReactTooltip.hide(ReactDOM.findDOMNode(this.refs[`cancelTooltipButton`]))
          }, 4 * 1000)
        }, 1)
      }
    })
    if (!error) {
      var response
      try {
        response = await this.props.taskFetcher.actionCancel()
      } catch (e) {
        response = {error: e}
      }
      if (this.props.taskViewStore.task.taskStatus !== 'UNCHECKED') {
        if (!response.error) response.error = {message: 'Произошла внутренняя ошибка!'}
      }
      if (response && response.error) {
        runInAction(() => {
          this.cancelError = response.error.message || 'Произошла внутренняя ошибка!'
          setTimeout(() => {
            ReactTooltip.show(ReactDOM.findDOMNode(this.refs[`cancelTooltipButton`]))
            setTimeout(() => {
              ReactTooltip.hide(ReactDOM.findDOMNode(this.refs[`cancelTooltipButton`]))
            }, 4 * 1000)
          }, 1)
        })
      }
    }
    runInAction(() => {
      this.cancelSending = false
    })
  }

  @computed get cancelTooltip () {
    let errs = []
    if (this.cancelError) {
      errs.push(`${this.cancelError}`)
    }
    return errs.join('\n\n') || null
  }

  @observable invalidSending = false
  @observable invalidError = null
  @action invalidTask = async () => {
    this.invalidSending = true
    this.saveSending = true
    this.props.taskViewStore.task.offer.verificationStatus = 'INVALID'
    let error
    try {
      let response = await this.props.taskFetcher.actionSave()
      error = response && response.error
    } catch (e) {
      console.error(e.stack)
      error = e
    }
    runInAction(() => {
      this.saveSending = false
      if (this.props.taskFetcher.diff) {
        if (!error) error = {message: ''}
        error.message = [error.message, 'Не все поля сохранились!'].filter(v => v).join('\n')
      }
      if (error) {
        this.saveError = error.message
        this.invalidError = this.saveTooltip
        setTimeout(() => {
          ReactTooltip.show(ReactDOM.findDOMNode(this.refs[`invalidTooltipButton`]))
          setTimeout(() => {
            ReactTooltip.hide(ReactDOM.findDOMNode(this.refs[`invalidTooltipButton`]))
          }, 4 * 1000)
        }, 1)
      }
    })
    if (!error) {
      var response
      try {
        response = await this.props.taskFetcher.actionInvalid()
      } catch (e) {
        response = {error: e}
      }
      if (this.props.taskViewStore.task.taskStatus !== 'CHECKED') {
        if (!response.error) response.error = {message: 'Произошла внутренняя ошибка!'}
      }
      if (response && response.error) {
        runInAction(() => {
          this.invalidError = response.error.message || 'Произошла внутренняя ошибка!'
          setTimeout(() => {
            ReactTooltip.show(ReactDOM.findDOMNode(this.refs[`invalidTooltipButton`]))
            setTimeout(() => {
              ReactTooltip.hide(ReactDOM.findDOMNode(this.refs[`invalidTooltipButton`]))
            }, 4 * 1000)
          }, 1)
        })
      }
    }
    runInAction(() => {
      this.invalidSending = false
    })
  }
  @computed.struct get usersSelectOptions () {
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

    let userSelectOptions = Object.entries(users).map(a => a.reverse())
    userSelectOptions = userSelectOptions.map(([value, label]) => ({value, label}))
    if (!this.props.taskViewStore.task.userId) {
      userSelectOptions.unshift({
        value : null,
        label : ``,
      })
    } else {
      let found = userSelectOptions.find(a => a.value === this.props.taskViewStore.task.userId)
      if (!found) {
        userSelectOptions.push({
          value : this.props.taskViewStore.task.userId,
          label : `#${this.props.taskViewStore.task.userId}`,
        })
      }
    }
    return userSelectOptions
  }
  @computed get invalidTooltip () {
    let errs = null
    if (this.invalidError) {
      errs = `${this.invalidError}`
    }
    return errs || 'Закрыть задачу, так как объявление невалидно'
  }

  @observable cannotCheckSending = false
  @observable cannotCheckError = null
  @action cannotCheckTask = async () => {
    this.cannotCheckSending = true
    this.saveSending = true
    this.props.taskViewStore.task.offer.verificationStatus = 'CANNOTCHECK'
    let error
    try {
      let response = await this.props.taskFetcher.actionSave()
      error = response && response.error
    } catch (e) {
      console.error(e.stack)
      error = e
    }
    runInAction(() => {
      this.saveSending = false
      if (this.props.taskFetcher.diff) {
        if (!error) error = {message: ''}
        error.message = [error.message, 'Не все поля сохранились!'].filter(v => v).join('\n')
      }
      if (error) {
        this.saveError = error.message
        this.cannotCheckError = this.saveTooltip
        setTimeout(() => {
          ReactTooltip.show(ReactDOM.findDOMNode(this.refs[`cannotCheckTooltipButton`]))
          setTimeout(() => {
            ReactTooltip.hide(ReactDOM.findDOMNode(this.refs[`cannotCheckTooltipButton`]))
          }, 4 * 1000)
        }, 1)
      }
    })
    if (!error) {
      var response
      try {
        response = await this.props.taskFetcher.actionCannotCheck()
      } catch (e) {
        response = {error: e}
      }
      if (this.props.taskViewStore.task.taskStatus !== 'CHECKED') {
        if (!response.error) response.error = {message: 'Произошла внутренняя ошибка!'}
      }
      if (response && response.error) {
        runInAction(() => {
          this.cannotCheckError = response.error.message || 'Произошла внутренняя ошибка!'
          setTimeout(() => {
            ReactTooltip.show(ReactDOM.findDOMNode(this.refs[`cannotCheckTooltipButton`]))
            setTimeout(() => {
              ReactTooltip.hide(ReactDOM.findDOMNode(this.refs[`cannotCheckTooltipButton`]))
            }, 4 * 1000)
          }, 1)
        })
      }
    }
    runInAction(() => {
      this.cannotCheckSending = false
    })
  }
  @computed get cannotCheckTooltip () {
    let errs = null
    if (this.cannotCheckError) {
      errs = `${this.cannotCheckError}`
    }
    return errs || 'Закрыть задачу, потому что невозможно проверить объявление'
  }


  @computed get isTaskNew () {
    return String(this.props.taskViewStore.task.id).match(/^new-.+/) && true || false
  }

  componentDidMount () {
    this.disposers.push((() => {
      let timer = setInterval(action(() => {
        this.nowTime = new Date().getTime()
      }), 1000)
      return clearTimeout.bind(null, timer)
    })());
    ['save', 'done', 'delete', 'reset', 'cancel', 'toWork', 'invalid', 'cannotCheck'].forEach(key => {
      this.disposers.push(autorun(() => {
        if (!this[`${key}Tooltip`] || !this.refs[`${key}Tooltip`]) return
        if (this.refs[`${key}Tooltip`].state.show) {
          setTimeout(() => {
            if (!this.refs[`${key}TooltipButton`]) return
            let dom = ReactDOM.findDOMNode(this.refs[`${key}TooltipButton`])
            if (!dom) return
            ReactTooltip.hide(dom)
            ReactTooltip.show(dom)
          }, 1)
        }
      }))
    })
  }

  componentWillUnmount () {
    this.disposers.forEach(disposer => { disposer() })
    this.disposers = []
  }

  render () {
    if (!this.props.taskFetcher.loaded || this.props.taskFetcher.loadingError) {
      return (
        <div className={s.root}>
          <div className={s.centerBlock}>
            {(this.props.taskFetcher.loadingError &&
              <div className={s.taskErrorMessage}>{this.props.taskFetcher.loadingError}</div>
            ) || <MDSpinner size={45} />}
          </div>
        </div>
      )
    }

    let tabs = [[], [], []]

    Object.keys(this.props.taskViewStore.fields).map(key => ({
      key,
      field: this.props.taskViewStore.fields[key] || this.props.taskViewStore.otherFields[key],
    })).filter(({field}) => !field.hide).forEach(({key, field}) => {
      let tab = field.tab || 0
      tabs[tab].push(
        <TaskField
          key={key}
          shouldHighlightFieldErrors={this.shouldHighlightFieldErrors}
          fieldName={key}
          errorsStore={this.props.taskViewStore.doneErrorsByField}
          fieldStore={this.props.taskViewStore.fields}
          valueStore={this.props.taskViewStore.task} />
      )
    })

    return (
      <div className={s.root}>
        <div className={s.actionsBlock}>
          <div className={s.titleBlock}>
            <Mask
              placeholder='Заголовок объявления'
              className={s.title}
              store={this.props.taskViewStore.task.offer}
              field={'title'}
              />
            <a className={s.titleLink} target='_blank' href={this.props.taskViewStore.task.offer.url}>
              {this.props.taskViewStore.task.offer.url}
            </a>
          </div>
          <div className={s.actionsButtons}>
            <div className={s.actionsButtonsTop}>
              {this.props.taskViewStore.task.taskStatus !== 'UNCHECKED' && (
                this.props.taskViewStore.task.taskStatus !== 'CHECKED' ||
                this.props.userStore.permissions.get('TELEPHONIST_FULL_ACCESS')
              ) && !this.isTaskNew &&  [
                this.cancelTooltip && (
                  <ReactTooltip
                    offset={{
                      left: 165,
                    }}
                    id='cancelTooltip'
                    place='bottom'
                    type='dark'
                    key='1'
                    ref='cancelTooltip'
                    effect='solid'
                    >
                    <div className={s.tooltip}>
                      {this.cancelTooltip}
                    </div>
                  </ReactTooltip>
                ),
                <div
                  key='2'
                  className={s.actionButton}
                  ref='cancelTooltipButton'
                  data-tip data-for='cancelTooltip'>
                  <button
                    className='btn btn-sm btn-default'
                    disabled={this.cancelSending}
                    onClick={this.cancelTask}
                    >
                    Вернуть в непроверенные
                  </button>
                  {this.cancelSending &&
                    <div className={s.buttonSpinner}><MDSpinner size={20} /></div>
                  }
                </div>
              ]}
              {this.props.taskViewStore.task.manuallyCreated === true && [
                this.deleteTooltip && (
                  <ReactTooltip
                    offset={{
                      left: 165,
                    }}
                    id='deleteTooltip'
                    place='bottom'
                    type='dark'
                    key='1'
                    ref='deleteTooltip'
                    effect='solid'
                    >
                    <div className={s.tooltip}>
                      {this.deleteTooltip}
                    </div>
                  </ReactTooltip>
                ),
                <div
                  key='2'
                  className={s.actionButton}
                  ref='deleteTooltipButton'
                  data-tip data-for='deleteTooltip'>
                  <button
                    disabled={this.deleteSending}
                    onClick={this.deleteTask}
                    className='btn btn-sm btn-danger'>
                    Удалить объект
                    <i className='fa fa-trash-o' aria-hidden='true' />
                  </button>
                  {this.deleteSending &&
                    <div className={s.buttonSpinner}><MDSpinner size={20} /></div>
                  }
                </div>
              ]}
              {!String(this.props.taskViewStore.task.id).match(/^new/) && [
                <ReactTooltip
                  offset={{
                    left: 165,
                  }}
                  id='resetTooltip'
                  place='bottom'
                  type='dark'
                  ref='resetTooltip'
                  key='1'
                  effect='solid'>
                  <div className={s.tooltip}>
                    {this.resetTooltip}
                  </div>
                </ReactTooltip>,
                <div
                  className={s.actionButton}
                  ref='resetTooltipButton'
                  key='2'
                  data-tip data-for='resetTooltip'>
                  <button
                    disabled={!this.props.taskFetcher.diff || this.saveSending}
                    className='btn btn-sm btn-warning'
                    onClick={this.resetTask}>
                    Сбросить
                    <i className='fa fa-undo' aria-hidden='true' />
                  </button>
                </div>
              ]}
              <ReactTooltip
                offset={{
                  left: 165,
                }}
                id='saveTooltip'
                place='bottom'
                type='dark'
                ref='saveTooltip'
                effect='solid'>
                <div className={s.tooltip}>
                  {this.saveTooltip}
                </div>
              </ReactTooltip>
              <div
                className={s.actionButton}
                ref='saveTooltipButton'
                data-tip data-for='saveTooltip'>
                <button
                  className='btn btn-sm btn-primary'
                  disabled={!this.props.taskFetcher.diff || this.saveSending}
                  onClick={this.saveTask}
                  >
                  {String(this.props.taskViewStore.task.id).match(/^new-deleted/)
                    ? 'Отменить удаление' : String(this.props.taskViewStore.task.id).match(/^new/)
                    ? 'Создать новый объект' : 'Сохранить'
                  }
                  <i className='fa fa-floppy-o' aria-hidden='true' />
                </button>
                {this.saveSending &&
                  <div className={s.buttonSpinner}><MDSpinner size={20} /></div>
                }
              </div>
              {this.props.taskViewStore.task.taskStatus === 'IN_PROGRESS' && !this.isTaskNew && [
                this.doneTooltip && (
                  <ReactTooltip
                    offset={{
                      left: 165,
                    }}
                    id='doneTooltip'
                    place='bottom'
                    type='dark'
                    key='1'
                    ref='doneTooltip'
                    effect='solid'
                    >
                    <div className={s.tooltip}>
                      {this.doneTooltip}
                    </div>
                  </ReactTooltip>
                ),
                <div
                  key='2'
                  className={s.actionButton}
                  ref='doneTooltipButton'
                  onMouseEnter={this.onDoneHover}
                  data-tip data-for='doneTooltip'>
                  <button
                    className='btn btn-sm btn-success'
                    disabled={this.props.taskViewStore.doneErrors.length > 0 || this.doneSending}
                    onClick={this.doneTask}
                    >
                    Завершить проверку
                    <i className='fa fa-check' aria-hidden='true' />
                  </button>
                  {this.doneSending &&
                    <div className={s.buttonSpinner}><MDSpinner size={20} /></div>
                  }
                </div>
              ]}
              {this.props.taskViewStore.task.taskStatus !== 'IN_PROGRESS' && (
                this.props.taskViewStore.task.taskStatus !== 'CHECKED' ||
                this.props.userStore.permissions.get('TELEPHONIST_FULL_ACCESS')
              ) && !this.isTaskNew && [
                this.toWorkTooltip && (
                  <ReactTooltip
                    offset={{
                      left: 165,
                    }}
                    id='toWorkTooltip'
                    place='bottom'
                    type='dark'
                    key='1'
                    ref='toWorkTooltip'
                    effect='solid'
                    >
                    <div className={s.tooltip}>
                      {this.toWorkTooltip}
                    </div>
                  </ReactTooltip>
                ),
                <div
                  key='2'
                  className={s.actionButton}
                  ref='toWorkTooltipButton'
                  data-tip data-for='toWorkTooltip'>
                  <button
                    className='btn btn-sm btn-default'
                    disabled={this.toWorkSending}
                    onClick={this.toWorkTask}
                    >
                    Вернуть в работу
                  </button>
                  {this.toWorkSending &&
                    <div className={s.buttonSpinner}><MDSpinner size={20} /></div>
                  }
                </div>
              ]}
            </div>
            <div className={s.actionsButtonsBottom}>
              {this.props.userStore.permissions.get('TELEPHONIST_FULL_ACCESS') && !this.isTaskNew && (
                <div className={s.userId}>
                  <div className={s.userIdLabel}>Оператор:</div>
                  <div className={s.userIdSelect}>
                    <Select
                      size='small'
                      store={this.props.taskViewStore.task}
                      field='userId'
                      style={{
                        maxWidth: 170,
                      }}
                      options={this.usersSelectOptions}
                      />
                  </div>
                </div>
              )}
              {!this.props.taskViewStore.task.manuallyCreated &&
                this.props.taskViewStore.task.taskStatus === 'IN_PROGRESS' &&
                !this.isTaskNew && [
                  this.invalidTooltip && (
                    <ReactTooltip
                      offset={{
                        left: 165,
                      }}
                      id='invalidTooltip'
                      place='bottom'
                      type='dark'
                      key='1'
                      ref='invalidTooltip'
                      effect='solid'
                      >
                      <div className={s.tooltip}>
                        {this.invalidTooltip}
                      </div>
                    </ReactTooltip>
                  ),
                  <div
                    key='2'
                    className={s.actionButton}
                    ref='invalidTooltipButton'
                    data-tip data-for='invalidTooltip'>
                    <button
                      className='btn btn-xs btn-default'
                      disabled={this.invalidSending}
                      onClick={this.invalidTask}
                      >
                      Закрыть как невалидное
                    </button>
                    {this.invalidSending &&
                      <div className={s.buttonSpinner}><MDSpinner size={20} /></div>
                    }
                  </div>
                ]}
              {!this.props.taskViewStore.task.manuallyCreated &&
                this.props.taskViewStore.task.taskStatus === 'IN_PROGRESS' &&
                !this.isTaskNew && [
                  this.cannotCheckTooltip && (
                    <ReactTooltip
                      offset={{
                        left: 165,
                      }}
                      id='cannotCheckTooltip'
                      place='bottom'
                      type='dark'
                      key='1'
                      ref='cannotCheckTooltip'
                      effect='solid'
                      >
                      <div className={s.tooltip}>
                        {this.cannotCheckTooltip}
                      </div>
                    </ReactTooltip>
                  ),
                  <div
                    key='2'
                    className={s.actionButton}
                    ref='cannotCheckTooltipButton'
                    data-tip data-for='cannotCheckTooltip'>
                    <button
                      className='btn btn-xs btn-default'
                      disabled={this.cannotCheckSending}
                      onClick={this.cannotCheckTask}
                      >
                      Невозможно проверить
                    </button>
                    {this.cannotCheckSending &&
                      <div className={s.buttonSpinner}><MDSpinner size={20} /></div>
                    }
                  </div>
                ]}
              {this.props.taskViewStore.task.manuallyCreated && (
                <div title='Объявление созданное оператором' className={s.manuallyCreated}>Новое</div>
              )}
              {(
                <div
                  title='Верификация объявления'
                  className={s.verificationStatus}
                  style={{
                    color: statusMap[this.props.taskViewStore.task.offer.verificationStatus].color
                  }}
                >
                  {statusMap[this.props.taskViewStore.task.offer.verificationStatus].title}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={s.mainBlock}>
          <div className={s.leftBlock}>
            <div className={s.commentBlock}>
              <strong>Комментарий оператора</strong>
              <Mask
                className={s.commentText}
                store={this.props.taskViewStore.task}
                field={'comments'}
                textarea
                />
            </div>
            <div className={s.mapBlock}>
              <div className={s.addressBlock}>
                <Autocomplete
                  className={s.addressBlockInput}
                  store={this.props.taskViewStore.task.offer}
                  field='rawAddress'
                  autocomplete={TextToAddress}
                />
                <input
                  placeholder='Широта'
                  spellCheck={false}
                  readOnly
                  className={'form-control '}
                  value={
                    this.props.taskViewStore.task.offer.location &&
                    this.props.taskViewStore.task.offer.location.length &&
                    this.props.taskViewStore.task.offer.location[0] || ''}
                  />
                <input
                  placeholder='Долгота'
                  spellCheck={false}
                  className={'form-control '}
                  readOnly
                  value={
                    this.props.taskViewStore.task.offer.location &&
                    this.props.taskViewStore.task.offer.location.length &&
                    this.props.taskViewStore.task.offer.location[1] || ''}
                  />
              </div>
              <YMapLocation
                className={s.map}
                locationStore={this.props.taskViewStore.task.offer}
                locationField='location'
                boundsStore={this.props.taskViewStore}
                boundsField='bounds'
                />
            </div>
            <div className={s.descriptionBlock}>
              <strong>Текст объявления</strong>
              <Mask
                className={s.descriptionText}
                store={this.props.taskViewStore.task.offer}
                field={'info'}
                textarea
                />
            </div>
            <div className={s.photosBlock}>
              <div className={s.photos}>
                <Uploader store={this.props.taskViewStore.task} field={'offer.photoUrls'} />
              </div>
            </div>
          </div>
          <div className={s.rightBlock}>
            <div className={s.fieldsBlock}>
              <Tabs
                onSelect={this.onSelect}
                activeKey={this.props.history.props.get('tab')}
                defaultActiveKey='0'
                animation={false}
                bsStyle='tabs nav-tabs-google'
                className={s.tabs}>
                <Tab eventKey='0' title='Общее'>
                  <div className={s.fieldsTable}>{tabs[0]}</div>
                </Tab>
                <Tab eventKey='1' title='Местоположение'>
                  <div className={s.fieldsTable}>{tabs[1]}</div>
                </Tab>
                <Tab eventKey='2' title='Физические характеристики'>
                  <div className={s.fieldsTable}>{tabs[2]}</div>
                </Tab>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
