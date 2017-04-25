import React, {PropTypes, Component} from 'react'
import {observable, runInAction, autorun, action, computed} from 'mobx'
import {
  observer,
} from 'mobx-react'
import classNames from 'classnames'

import {loadApi} from './Api'

import s from './YMapLocation.sass'


export default
@observer
class YMapLocation extends Component {
  static propTypes = {
    className     : PropTypes.string,
    locationStore : PropTypes.object,
    locationField : PropTypes.string,
    boundsStore   : PropTypes.object,
    boundsField   : PropTypes.string,
  }

  mapState = {
    bounds    : [[0, -100], [80, -150]],
    behaviors : ['default', 'scrollZoom'],
    controls  : [],
  }

  mapOptions = {
    minZoom                : 5,
    adjustZoomOnTypeChange : true,
    restrictMapArea        : [[0, -100], [80, -150]],
    autoFitToViewport      : 'always',
  }

  @observable ready = false
  map = null
  disposers = []

  componentDidMount () {
    this.init().catch(e => console.error(e.stack))
  }

  componentWillUnmount () {
    this.disposers.forEach(disposer => disposer())
    this.disposers = []
  }

  async init () {
    await loadApi()
    runInAction(() => {
      this.ready = true
    })
  }

  componentDidUpdate () {
    if (this.map || !this.refs.map) return
    this.map = new window.ymaps.Map(this.refs.map, {
      ...this.mapState,
      bounds: this.props.boundsStore[this.props.boundsField] || this.mapState.bounds,
    }, this.mapOptions)

    let location =
      this.props.locationStore[this.props.locationField] &&
      this.props.locationStore[this.props.locationField].length &&
      this.props.locationStore[this.props.locationField] ||
      [0, 0]

    this.placemark = new window.ymaps.Placemark(location, {}, {
      draggable: true,
    })
    this.placemark.events.add('drag', action(e => {
      this.props.locationStore[this.props.locationField] = this.placemark.geometry.getCoordinates()
    }))

    this.map.geoObjects.add(this.placemark)

    this.disposers.push(autorun(this.applyBounds))
    this.disposers.push(autorun(this.movePlacemark))
  }
  @computed.struct get bounds () {
    if (!this.props.boundsStore[this.props.boundsField]) return
    return this.props.boundsStore[this.props.boundsField]
  }
  applyBounds = () => {
    if (!this.bounds) return
    this.map.setBounds(this.bounds)
  }

  movePlacemark = () => {
    if (!(this.props.locationStore[this.props.locationField] &&
      this.props.locationStore[this.props.locationField].length)
    ) return
    this.placemark.geometry.setCoordinates(this.props.locationStore[this.props.locationField])
  }

  render () {
    if (!this.ready) return null
    return <div ref='map' className={classNames(s.root, this.props.className)} />
  }
}
