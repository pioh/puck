import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {observer, inject} from 'mobx-react'

import Puck from 'components/Puck'

import s from './PuckContainer.sass'


export default
@inject('history')
@observer
class PuckContainer extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  componentWillUnmount () {
    this.offersFetcher.destroy()
  }

  render () {
    return (
      <div className={s.root}>
        <Puck />
      </div>
    )
  }
}
