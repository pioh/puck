import React, {Component} from 'react'
import {useStrict} from 'mobx'
import {Provider as MobxProvider} from 'mobx-react'

import History from 'side/History'
import {UserStore} from 'store'
import {UserFetcher} from 'side/fetchers'
import Router from 'containers/Router'

useStrict(true)
window.useStrict = useStrict

export default
class RootContainer extends Component {
  history = new History()
  userStore = UserStore({
    permissions: {
      LOADING: true,
    },
  }, {historyStore: this.history})
  userFetcher = new UserFetcher({userStore: this.userStore, history: this.history})

  render () {
    return (
      <MobxProvider
        history={this.history}
        userStore={this.userStore}
        userFetcher={this.userFetcher}>
        <Router />
      </MobxProvider>
    )
  }
}
