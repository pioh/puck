import React, {Component} from 'react'
import {observer} from 'mobx-react'

import s from './Puck.sass'


export default
@observer
class Puck extends Component {
  render () {
    return (
      <div className={s.root}>
        Puck
      </div>
    )
  }
}
