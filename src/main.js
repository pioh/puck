import 'babel-polyfill'
import 'bluebird'
import React from 'react'
import ReactDOM from 'react-dom'

import Root from './containers/Root'


const MOUNT_NODE = document.getElementById('root')

const render = () => {
  ReactDOM.render(<Root />, MOUNT_NODE)
}

render()
