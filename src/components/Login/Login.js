import React, {Component, PropTypes} from 'react'
import classNames from 'classnames'
import {observable, action, runInAction, computed} from 'mobx'
import {inject, observer} from 'mobx-react'

import s from './Login.sass'


export default
@inject('history', 'userFetcher', 'userStore')
@observer
class LoginContainer extends Component {
  static propTypes = {
    history     : PropTypes.object.isRequired,
    userFetcher : PropTypes.object.isRequired,
    userStore   : PropTypes.object.isRequired,
  }
  @observable errorMessage = null
  @observable loading = false

  @action ajaxLogin = async () => {
    this.loading = true
    let {error} = await this.props.userFetcher.login({
      username : this.refs.username.value,
      password : this.refs.password.value,
    })

    if (!error && this.keyPressed) {
      this.forceSubmit = true
      this.refs.form && this.refs.form.submit()
    } else if (!error) {
      await this.props.userFetcher.fetchUser()
      if (this.props.history.pathname === '/login') {
        runInAction(() => {
          this.props.history.pathname = '/'
        })
      }
    }
    runInAction(() => {
      this.errorMessage = error && error.message || null
      this.loading = false
    })
  }

  onSubmit = e => {
    if (!this.forceSubmit) e.preventDefault()
    this.ajaxLogin().catch(e => console.error(e && e.stack || e))
  }
  onKeyDown = e => {
    this.keyPressed = true
  }
  @computed get notFullAccess () {
    return this.props.userStore.loggedIn && this.props.history.pathname !== '/login'
  }
  render () {
    let {history} = this.props

    return (
      <form
        ref='form'
        onSubmit={this.onSubmit}
        name='login'
        method='POST'
        action={['', this.props.history.basename, 'rest/redirect'].map(a => a.replace(/(^\/|\/$)/g, '')).join('/')}
        className={classNames(s.root, 'input-group')}>
        <h3 className={s.header}>SRG</h3>
        {this.notFullAccess ? (
          <div className={s.error}>
            Недостаточно прав для просмотра данной страницы.<br />
            Попробуйте войти под другим пользователем.<br />
          </div>
        ) : null}
        <input name='TO_REDIRECT_PARAM' value={
          history.url
            .replace(new RegExp(`^.*/${history.basename}`), '')
            .replace(`/login`, '/')
        } hidden readOnly />
        <div className={s.row}>
          <input
            ref='username'
            name='username'
            className='form-control'
            type='text'
            placeholder='Логин'
            onKeyDown={this.onKeyDown}
            autoFocus
          />
        </div>
        <div className={s.row}>
          <input
            ref='password'
            name='password'
            type='password'
            className='form-control'
            placeholder='Пароль'
            onKeyDown={this.onKeyDown}
          />
        </div>
        <div className={s.row}>
          <button disabled={this.loading} className='btn btn-primary'>Войти</button>
        </div>
        {this.errorMessage ? (
          <div className={s.error}>
            {this.errorMessage}
          </div>
        ) : null}
      </form>
    )
  }
}
