import React, {Component, PropTypes} from 'react'
import {autorun, runInAction} from 'mobx'
import {observer, inject} from 'mobx-react'

import {AllTasksContainer, TasksContainer, OffersContainer, TaskContainer} from 'containers/Telephonist'
import {BaseLayout, Login} from 'components'
import {Stats} from 'components/Telephonist'
import {Error404, Error403} from 'components/Errors'
import {RouterStore} from 'store'

const Components = {
  BaseLayout,
  Login,
  AllTasksContainer,
  Error404,
  Error403,
  OffersContainer,
  TasksContainer,
  TaskContainer,
  Stats,
}


@inject('history', 'userStore')
@observer
class Router extends Component {
  static propTypes = {
    history   : PropTypes.object.isRequired,
    userStore : PropTypes.object.isRequired,
  }

  routerStore = RouterStore({}, {
    historyStore : this.props.history,
    userStore    : this.props.userStore,
  })
  disposers = []

  constructor (props) {
    super(props)
    this.disposers.push(autorun(this.redirector))
    this.disposers.push(autorun(this.titler))
  }
  componentWillUnmount () {
    this.disposers.forEach(disposer => disposer())
    this.disposers = []
  }

  redirector = () => {
    if (!this.routerStore.redirect) return
    this.props.history.replace(this.routerStore.redirect)
  }
  titler = () => {
    if (!this.routerStore.layout.title) return
    if (this.props.history.title === this.routerStore.layout.title) return
    runInAction('setTitle', () => {
      this.props.history.title = this.routerStore.layout.title
    })
  }

  renderLevel (o) {
    let children = Object.keys(o).filter(key => key.match(/^[A-Z]\w*/)).map(key => {
      if (!Components[key]) throw new Error(`unknown component ${key} in <Router />`)
      return React.createElement(Components[key], {
        children: this.renderLevel(o[key]),
        key,
        ...o[key].props,
      })
    })
    return children.length > 1 ? children : children[0] || null
  }

  render () {
    return this.renderLevel(this.routerStore.layout)
  }
}

export default Router
