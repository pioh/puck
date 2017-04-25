import React, {Component, PropTypes} from 'react'
import {action, computed} from 'mobx'
import {observer, inject} from 'mobx-react'
import minimatch from 'minimatch'
import classNames from 'classnames'


function isLeftClickEvent (event) {
  return event.button === 0
}

function isModifiedEvent (event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
}

export default
@inject('history')
@observer
class Link extends Component {
  static propTypes = {
    isActive: PropTypes.oneOfType([
      PropTypes.instanceOf(RegExp),
      PropTypes.string,
      PropTypes.bool,
      PropTypes.func,
    ]),
    className       : PropTypes.string,
    activeClassName : PropTypes.string,
    pathname        : PropTypes.string.isRequired,
    args            : PropTypes.object,
    onClick         : PropTypes.func,
    history         : PropTypes.object.isRequired,
  }

  static defaultProps = {
    args: {},
  }

  @action handleClick = (event) => {
    if (this.props.onClick) this.props.onClick(event)

    if (event.defaultPrevented) return

    if (isModifiedEvent(event) || !isLeftClickEvent(event)) return

    event.preventDefault()

    this.props.history.pathname = this.props.pathname

    this.props.history.props.keys().forEach(key => {
      if (!this.props.args[key]) this.props.history.props.delete(key)
    })
    this.props.history.props.merge(this.props.args)
  }
  @computed get selfIsActive () {
    return minimatch(this.props.history.pathname, this.props.pathname)
  }
  get isActive () {
    const {isActive} = this.props

    if (typeof isActive === 'function') {
      return isActive(this.props.history)
    } else if (isActive instanceof RegExp) {
      return isActive.test(this.props.history.pathname)
    } else if (typeof isActive === 'string') {
      return minimatch(this.props.history.pathname, isActive)
    } else if (typeof isActive === 'boolean') {
      return isActive
    } else {
      return this.selfIsActive
    }
  }

  get className () {
    return classNames(
      this.props.className,
      this.isActive && this.props.activeClassName
    )
  }

  get href () {
    return this.props.history.toHref(this.props.pathname, this.props.args)
  }

  render () {
    let props = {...this.props}
    delete props.isActive
    delete props.className
    delete props.activeClassName
    delete props.pathname
    delete props.args
    delete props.onClick
    delete props.history

    return (
      <a
        {...props}
        className={this.className}
        onClick={this.handleClick}
        href={this.href} />
    )
  }
}
