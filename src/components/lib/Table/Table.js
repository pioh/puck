import React, {Component, PropTypes} from 'react'
import classNames from 'classnames'
import {action, computed, observable, observe} from 'mobx'
import {observer, inject} from 'mobx-react'
import _get from 'lodash/get'
import Link from 'side/Link'
import Pagination from 'react-bootstrap/es/Pagination'
import MDSpinner from 'react-md-spinner'
import shortid from 'shortid'
import ReactTooltip from 'react-tooltip'

import ContainerQuery from 'react-container-query'

import s from './Table.sass'


function TdField (fields, node) {
  return fields[node.td.key]
}
function TdStyle (node, field) {
  return {
    flex     : node.noWidth ? node.width : undefined,
    minWidth : node.width,
    ...field.style,
  }
}
function TdClassName (field, row, node) {
  let className = [s.td, field.className]
  if (row.__header) {
    className.push(
      field.classNameHeader,
      row.__header && field.sortable && s.sortable,
      row.__header && field.sortable && row.__filter.sortBy === node.td.key && s.sort,
      row.__header && field.sortable && row.__filter.sortBy === node.td.key && (!row.__filter.reverse) &&  s.reverse,
    )
  } else {
    className.push(field.classNameValue)
  }
  return classNames(...className)
}

@observer
class Td extends Component {
  static propTypes = {
    node   : PropTypes.object.isRequired,
    row    : PropTypes.object.isRequired,
    fields : PropTypes.object.isRequired,
    link   : PropTypes.object,
  }
  @action onSort = () => {
    if (this.props.row.__filter.sortBy === this.props.node.td.key) {
      this.props.row.__filter.reverse = !this.props.row.__filter.reverse
    } else {
      this.props.row.__filter.sortBy = this.props.node.td.key
      this.props.row.__filter.reverse = false
    }
  }
  @computed get field () {
    return TdField(this.props.fields, this.props.node)
  }
  @computed get className () {
    return TdClassName(this.field, this.props.row, this.props.node)
  }
  @computed get classNameI () {
    return 'fa fa-sort-' + (
      this.props.row.__header &&
      this.field.sortable &&
      this.props.row.__filter.sortBy === this.props.node.td.key &&
      (!this.props.row.__filter.reverse) ? 'desc' : 'asc')
  }
  render () {
    if (this.props.link && this.props.fields[this.props.node.td.key].noLink !== true)  {
      return (
        <Link
          {...this.props.link}
          className={this.className}
          style={TdStyle(this.props.node, this.field)}
          onClick={this.props.row.__header && this.field.sortable && this.onSort}
        >
          {_get(this.props.row, this.props.node.td.key)}
          {this.props.row.__header && this.field.sortable
          ? <i className={this.classNameI} aria-hidden='true' />
          : null}
        </Link>
      )
    } else {
      return (
        <div
          className={this.className}
          style={TdStyle(this.props.node, this.field)}
          onClick={this.props.row.__header && this.field.sortable && this.onSort}
        >
          {_get(this.props.row, this.props.node.td.key)}
          {this.props.row.__header && this.field.sortable
          ? <i className={this.classNameI} aria-hidden='true' />
          : null}
        </div>
      )
    }
  }
}

function TgStyle (group) {
  return {
    flex     : group.noWidth ? group.width : undefined,
    minWidth : group.width,
  }
}
function TgClassName (level) {
  return classNames(s.tg, s[`tg${level}`])
}

function Tg (group, row, fields, level, link) {
  return (
    <div className={TgClassName(level)} style={TgStyle(group)}>
      {group.tg.groups.map((node, i) =>
        <Node node={node} row={row} fields={fields} level={level + 1} key={i} link={link} />
      )}
    </div>
  )
}

@observer
class Node extends Component {
  static propTypes = {
    node   : PropTypes.object.isRequired,
    row    : PropTypes.object.isRequired,
    fields : PropTypes.object.isRequired,
    level  : PropTypes.number,
    link   : PropTypes.object,
  }
  static defaultProps = {
    level: 0,
  }
  render () {
    if (this.props.node.tg) {
      return Tg(this.props.node, this.props.row, this.props.fields, this.props.level, this.props.link)
    }
    return <Td node={this.props.node} row={this.props.row} fields={this.props.fields} link={this.props.link} />
  }
}

@observer
class TableRow extends Component {
  static propTypes = {
    groups         : PropTypes.object.isRequired,
    row            : PropTypes.object.isRequired,
    fields         : PropTypes.object.isRequired,
    localIndicator : PropTypes.string,
    onClick        : PropTypes.func,
    scheme         : PropTypes.object.isRequired,
    toLink         : PropTypes.func,
    tooltip        : PropTypes.func,
  }

  @observable indicator = null
  constructor (props) {
    super(props)
    this.initIndicator(props)
    this.shortid = shortid.generate()
  }
  componentWillReceiveProps (props) {
    this.initIndicator(props)
  }
  @action initIndicator (props) {
    if (props.localIndicator) {
      this.indicator = window.localStorage.getItem(props.localIndicator) || 1
    }
  }
  @computed get link () {
    return this.props.toLink && this.props.toLink(this.props.row[this.props.scheme.key || 'key']) || null
  }
  @computed get tooltip () {
    return this.props.tooltip && this.props.tooltip(this.props.row[this.props.scheme.key || 'key']) || null
  }
  @action onClick = () => {
    if (this.indicator === 1) {
      this.indicator = 2
      window.localStorage.setItem(this.props.localIndicator, this.indicator)
    }
    this.props.onClick && this.props.onClick(this.props.row[this.props.scheme.key || 'key'])
  }
  @action onClickIndicator = () => {
    this.indicator = this.indicator === 3 ? 2 : 3
    window.localStorage.setItem(this.props.localIndicator, this.indicator)
  }

  render () {
    if (this.link === 1) {
      return (
        <Link
          ref='tooltipTarget'
          data-tip data-for={this.shortid}
          {...this.link}
          className={classNames(s.row, s.body)}
          onClick={this.onClick}>
          {this.tooltip && (
            <ReactTooltip
              id={this.shortid}
              place='bottom'
              type='dark'
              key='1'
              ref='tooltip'
              effect='float'
              delayShow={150}
              >
              <div className={s.tooltip}>
                {this.tooltip}
              </div>
            </ReactTooltip>
          )}
          {this.indicator > 0
            ? <div
              className={classNames(s.indicator, s['indicator' + this.indicator])}
              onClick={this.onClickIndicator}
              />
          : null}
          <Node node={this.props.groups} row={this.props.row} fields={this.props.fields} link={this.link} />
        </Link>
      )
    } else {
      return (
        <div
          ref='tooltipTarget'
          data-tip data-for={this.shortid}
          className={classNames(s.row, s.body)}
          onClick={this.onClick}>
          {this.tooltip && (
            <ReactTooltip
              id={this.shortid}
              place='bottom'
              type='dark'
              key='1'
              ref='tooltip'
              effect='float'
              delayShow={150}
              >
              <div className={s.tooltip}>
                {this.tooltip}
              </div>
            </ReactTooltip>
          )}
          {this.indicator > 0
            ? <div
              className={classNames(s.indicator, s['indicator' + this.indicator])}
              onClick={this.onClickIndicator}
              />
          : null}
          <Node node={this.props.groups} row={this.props.row} fields={this.props.fields}  link={this.link} />
        </div>
      )
    }
  }
}

export default
@inject('history')
@observer
class Table extends Component {
  static propTypes = {
    scheme : PropTypes.object.isRequired,
    data   : PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.array,
    ]).isRequired,
    className   : PropTypes.string,
    filter      : PropTypes.object,
    onClick     : PropTypes.func,
    toLink      : PropTypes.func,
    tooltip     : PropTypes.func,
    count       : PropTypes.number,
    urlPageKey  : PropTypes.string,
    history     : PropTypes.object,
    loading     : PropTypes.bool,
    error       : PropTypes.node,
    forceScroll : PropTypes.bool,
  }
  static defaultProps = {
    filter     : {},
    count      : 0,
    urlPageKey : 'page',
  }

  disposers = []
  @action componentWillMount () {
    let hi = this.props.history.props.get(this.props.urlPageKey)
    if (hi === undefined) {
      hi = 1
      this.props.history.props.set(this.props.urlPageKey, 1)
    }
    this.pagActivePage = hi
    this.disposers.push(observe(this.props.history.props, this.props.urlPageKey, action((v) => {
      if (!v) v = 1
      this.pagActivePage = v
    })))
    this.disposers.push(observe(this, 'pagActivePage', action((v) => {
      this.props.history.props.set(this.props.urlPageKey, v)
    })))
  }
  componentWillUnmount () {
    this.disposers.forEach(disposer => disposer())
    this.disposers = []
  }

  @observable headerScrollPadding = 0

  @computed get groups () {
    let groups = this.parseGroups(this.props.scheme.groups, this.props.scheme.fields)
    return groups
  }
  @computed get groupsDeep () {
    return this.levelGroups(this.groups)
  }
  @computed get levels () {
    return this.makeLevels(this.groupsDeep)
  }

  @computed get query () {
    let query = {}
    this.levels.forEach((level, i) => {
      query[`level${i}`] = {
        maxWidth: level.minWidth + 15 * 2 + 15, // 2 * padding + scrollbar
      }
    })
    return query
  }

  @computed get headerRow () {
    let header = {
      __header : true,
      __filter : this.props.filter,
    }
    for (let key in this.props.scheme.fields) {
      header[key] = this.props.scheme.fields[key].title
    }
    return header
  }

  parseGroups = (node, fields) => {
    if (typeof node === 'string') {
      node = {
        td: {
          key: node,
        }
      }
    }
    if (typeof node !== 'object' || node === null) return node
    if (!node.tg && node.length !== undefined) {
      node = {
        tg: {
          groups: node,
        }
      }
    }
    if (node.tg) {
      let width = 0
      let noWidth = false
      let minWidth = 0
      let deep = 1
      node = {
        ...node,
        tg: {
          ...node.tg,
          groups: node.tg.groups.map(subNode => this.parseGroups(subNode, fields)),
        }
      }
      node.tg.groups.forEach(subNode => {
        noWidth = noWidth || subNode.noWidth
        width = Math.max(width, subNode.width || subNode.minWidth)
        minWidth = Math.max(minWidth, subNode.minWidth || subNode.width)
        deep = Math.max(subNode.deep + 1, deep)
      })
      node.minWidth = Math.max(node.minWidth || 0, minWidth)
      node.width = Math.max(node.width || 0, width)
      node.deep = deep
      node.noWidth = noWidth
      return node
    }
    if (!node.td) {
      node = {
        td: node,
      }
    }
    if (node.td) {
      if (!node.td.key) {
        let key = node.td.key || Object.keys(node.td)[0]
        node = {
          ...node,
          td: {
            ...node.td,
            key,
          }
        }
        delete node.td[key]
      }
      node.noWidth = node.noWidth || !node.td.width && !node.width && !fields[node.td.key].width
      node.width = node.td.width || node.width || fields[node.td.key].width
      node.minWidth = node.td.minWidth || node.minWidth || fields[node.td.key].minWidth
      node.width = Math.max(node.width || 0, node.minWidth || 0)
      node.minWidth = Math.max(node.width || 0, node.minWidth || 0)
      node.width = node.width || node.minWidth || 25
      node.minWidth = node.minWidth || node.width || 25
      node.deep = 1
    }
    return node
  }
  levelGroups = (node, deep = node.deep) => {
    if (!node.tg && node.deep >= deep) return node
    if (!node.tg) {
      while (node.deep < deep) {
        node = {
          ...node,
          tg: {
            groups: [
              node,
            ]
          },
          deep: node.deep + 1,
        }
        delete node.td
      }
    }
    if (node.tg) {
      node = {...node, tg: {...node.tg}}
      node.tg.groups = node.tg.groups.map(subNode => {
        subNode = this.levelGroups(subNode, deep - 1)
        node.deep = Math.max(node.deep, subNode.deep + 1)
        return subNode
      })
    }
    return node
  }

  makeLevels = (node, levels = [], levelIndex = 0) => {
    if (!node.tg) return levels
    if (!levels[levelIndex]) {
      levels.push({
        minWidth : 0,
        width    : 0,
        nodes    : [],
      })
    }
    let level = levels[levelIndex]
    node.tg.groups.forEach(subNode => {
      level.minWidth += subNode.minWidth
      level.width += subNode.width
      level.nodes.push(subNode)
      if (subNode.tg) {
        this.makeLevels(subNode, levels, levelIndex + 1)
      }
    })
    return levels
  }
  componentDidUpdate () {
    this.onResize()
  }
  @action onResize = () => {
    if (!this.refs.rows) return
    this.headerScrollPadding = this.refs.rows.offsetWidth - this.refs.rows.scrollWidth
  }
  @computed get pagItems () {
    return (
      Math.ceil(this.props.count / this.props.filter.limit) ||
      Math.ceil((this.props.filter.offset + 1) / this.props.filter.limit)
    )
  }
  @computed get pagActivePage () {
    return Math.floor(this.props.filter.offset / this.props.filter.limit) + 1
  }
  set pagActivePage (v) {
    this.props.filter.offset = (v - 1) * this.props.filter.limit
  }
  @action onPagSelect = e => {
    this.pagActivePage = e
  }
  render () {
    return (
      <ContainerQuery onResize={this.onResize} className={classNames(s.root, this.props.className)} query={this.query}>
        <div className={classNames(s.row, s.header)} style={{
          paddingRight: 15 + this.headerScrollPadding,
        }}>
          <Node node={this.groups} row={this.headerRow} fields={this.props.scheme.fields} />
        </div>
        <div ref='rows' className={classNames(s.rows, this.props.forceScroll && s.forceScroll)}>
          {this.props.loading ? (
            <MDSpinner className={s.spinner} size={40} />
          ) : this.props.error ? (
            <div className={s.errorMessage}>{this.props.error}</div>
          ) : (
            this.props.data.map(row =>
              <TableRow
                groups={this.groups}
                row={row}
                onClick={this.props.onClick}
                toLink={this.props.toLink}
                tooltip={this.props.tooltip}
                localIndicator={this.props.scheme.localIndicator
                ?  `tableIndicator.${this.props.scheme.localIndicator}${row[this.props.scheme.key || 'key']}`
                : null}
                fields={this.props.scheme.fields}
                scheme={this.props.scheme}
                key={row[this.props.scheme.key || 'key']}
              />
            )
          )}
        </div>
        {this.pagItems > 1 && (
          <div className={classNames(s.row, s.paginatorRow)}>
            <Pagination
              prev
              next
              first
              last
              ellipsis
              bsClass={'pagination ' + s.paginator}
              boundaryLinks
              items={this.pagItems}
              maxButtons={5}
              activePage={this.pagActivePage}
              onSelect={this.onPagSelect} />
          </div>
        )}
      </ContainerQuery>
    )
  }
}
