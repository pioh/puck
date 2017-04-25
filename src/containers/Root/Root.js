import React, {Component} from 'react'
import {useStrict} from 'mobx'
import {Provider as MobxProvider} from 'mobx-react'

import History from 'side/History'
import Router from 'containers/Router'

useStrict(true)
window.useStrict = useStrict

export default
class RootContainer extends Component {
  history = new History()

  render () {
    return (
      <MobxProvider
        history={this.history}
      >
        <Router />
      </MobxProvider>
    )
  }
}
