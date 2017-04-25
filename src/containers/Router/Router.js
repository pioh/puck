import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {autorun, runInAction} from 'mobx'
import {observer, inject} from 'mobx-react'

import Puck from 'containers/Puck'
import {BaseLayout} from 'components'
import {Error404, Error403} from 'components/Errors'
import {RouterStore} from 'store'

const Components = {
  BaseLayout,
  Error404,
  Error403,
  Puck,
}


@inject('history')
@observer
class Router extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  routerStore = RouterStore({}, {
    historyStore: this.props.history,
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
