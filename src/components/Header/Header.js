import React, {Component} from 'react'
import {observer} from 'mobx-react'
import Link from 'side/Link'

import s from './Header.sass'

const links = {
}


export default
@observer
class Header extends Component {
  render () {
    return (
      <div className={s.root}>
        <Link className={s.logo} isActive={false} pathname='/puck'>Puck</Link>
        {Object.entries(links).map(([link, {title}]) =>
          <Link className={s.link} activeClassName={s.active} key={link} pathname={link}>{title}</Link>
        )}
      </div>
    )
  }
}
