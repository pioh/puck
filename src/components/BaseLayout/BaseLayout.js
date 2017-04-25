import React, {Component} from 'react'
import PropTypes from 'prop-types'
import 'todc-bootstrap/dist/css/bootstrap.css'
import 'todc-bootstrap/dist/css/todc-bootstrap.css'
import 'react-bootstrap-multiselect/css/bootstrap-multiselect.css'
import Helmet from 'react-helmet'
import {inject, observer} from 'mobx-react'

import Header from 'components/Header'
import 'styles/core'

import s from './BaseLayout.sass'

if (__DEV__) {
  var MobxDevTools = require('mobx-react-devtools').default
}

export default
@inject('history')
@observer
class BaseLayout extends Component {
  static propTypes = {
    history  : PropTypes.object.isRequired,
    children : PropTypes.node,
  }
  render () {
    return (
      <div className={s.root}>
        {MobxDevTools ? <MobxDevTools position={{
          bottom : 0,
          left   : 0,
        }} /> : null}
        <Helmet title={this.props.history.title} />
        <Header />
        <div className={s.content}>
          {this.props.children}
        </div>
      </div>
    )
  }
}
