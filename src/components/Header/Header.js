import React, {Component, PropTypes} from 'react'
import {observable, action} from 'mobx'
import {observer, inject} from 'mobx-react'
import Link from 'side/Link'
import classNames from 'classnames'
import shortid from 'shortid'

import s from './Header.sass'

const links = {
  '/tasks': {
    title       : 'Мои задачи',
    permissions : ['TELEPHONIST_FULL_ACCESS', 'TELEPHONIST_BASIC_ACCESS'],
  },
  '/all-tasks': {
    title       : 'Все задачи',
    permissions : ['TELEPHONIST_FULL_ACCESS'],
  },
  '/stats': {
    title       : 'Статистика',
    permissions : ['TELEPHONIST_FULL_ACCESS', 'TELEPHONIST_BASIC_ACCESS'],
  },
  '/offers': {
    title       : 'Реестр объявлений',
    permissions : ['TELEPHONIST_FULL_ACCESS', 'TELEPHONIST_BASIC_ACCESS'],
  },
}


export default
@inject('userStore', 'userFetcher')
@observer
class Header extends Component {
  static propTypes = {
    userStore   : PropTypes.object.isRequired,
    userFetcher : PropTypes.object.isRequired,
  }
  @observable newTaskId = shortid.generate()
  loggedIn () {
    let {userStore} = this.props
    return (
      <div className={s.right_group}>
        <div className={classNames(s.text, s.userName)}>
          {`${userStore.firstName} ${userStore.lastName}`}
        </div>
        <div onClick={this.logout} className={classNames(s.button, s.glyph)}>
          <i title='Выйти' className='fa fa-sign-out' aria-hidden='true' />
        </div>
      </div>
    )
  }
  loggedOut () {
    return (
      <div className={s.right_group}>
        <div className={classNames(s.button, s.glyph)}>
          <i title='Войти' className='fa fa-sign-in' aria-hidden='true' />
        </div>
      </div>
    )
  }
  logout = async () => {
    await this.props.userFetcher.logout()
    await this.props.userFetcher.fetchUser()
  }
  check = permissions =>
    (!permissions || !permissions.length) || (
      permissions.find(p => this.props.userStore.permissions.get(p)) !== undefined
    )

  render () {
    return (
      <div className={s.root}>
        <Link className={s.logo} isActive={false} pathname='/tasks'>Телефонист</Link>
        {Object.entries(links).map(([link, {title, permissions}]) =>
          this.check(permissions) && (
            <Link className={s.link} activeClassName={s.active} key={link} pathname={link}>{title}</Link>
          )
        )}
        {this.check(['TELEPHONIST_FULL_ACCESS', 'TELEPHONIST_BASIC_ACCESS']) &&
          <Link
            title='Создать новое объявление'
            className={s.link}
            pathname={'/task'}
            onClick={action(() => {
              this.newTaskId = shortid.generate()
            })}
            args={{
              taskID: `new-${this.newTaskId}`,
            }}>
            <i className='fa fa-plus' aria-hidden='true' />
          </Link>
        }
        {this.props.userStore.loggedIn ? this.loggedIn() : this.loggedOut()}
      </div>
    )
  }
}
