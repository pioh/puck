import React, {Component, PropTypes} from 'react'
import {observer, inject} from 'mobx-react'

import {OffersStore} from 'store/Telephonist/OffersStore'
import {OffersFilterStoreDefault} from 'store/Telephonist/OffersFilterStore'
import {OffersFetcher} from 'side/fetchers/Telephonist'
import Offers from 'components/Telephonist/Offers'
import OffersFilter from 'components/Telephonist/OffersFilter'

import s from './OffersContainer.sass'


export default
@inject('history')
@observer
class OffersContainer extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  offersStore = OffersStore({filterStore: OffersFilterStoreDefault})
  offersFetcher = new OffersFetcher({offersStore: this.offersStore, history: this.props.history})

  componentWillUnmount () {
    this.offersFetcher.destroy()
  }

  render () {
    return (
      <div className={s.root}>
        <OffersFilter offersFetcher={this.offersFetcher} filter={this.offersStore.filterStore} />
        <Offers offersFetcher={this.offersFetcher} offersStore={this.offersStore} />
      </div>
    )
  }
}
