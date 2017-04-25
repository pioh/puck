import {createFactory, arrayOf, mapOf} from 'mobx-state-tree'

import {OfferStore} from './OfferStore'
import {OffersFilterStore} from './OffersFilterStore'


export const OffersStore = createFactory({
  offers       : arrayOf(OfferStore),
  taskStatus   : mapOf(),
  count        : 0,
  filterStore  : OffersFilterStore,
  filterString : null,
  fetchError   : null,

  get isLoading () {
    if (this.fetchError) return false
    if (this.filterStore.string === this.filterString) return false
    if (
      !this.filterStore.location ||
      !this.filterStore.location.length
    ) return false
    return true
  },
})
