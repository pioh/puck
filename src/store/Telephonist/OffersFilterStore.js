import {
  createFactory,
  getSnapshot,
  applySnapshot,
  arrayOf,
  clone,
} from 'mobx-state-tree'
import {observable} from 'mobx'

import {
  RealtyType,
  MarketType,
  Sources,
  VerificationStatus,
  TelephonistRealtyTypeAllowed,
} from './const/enums'

export const FromTo = createFactory({
  from : null,
  to   : null,
})

export const Shape = createFactory({
  box: arrayOf(arrayOf()),
})

export const OffersFilterStoreDefault = {
  sortBy    : 'price',
  reverse   : false,
  limit     : 40,
  offset    : 0,
  location  : [],
  published : {
    from : null,
    to   : null,
  },
  realtyType         : [],
  marketType         : [],
  sources            : [],
  verificationStatus : [],
}

export const OffersFilterStore = createFactory({
  sortBy  : 'price',
  reverse : false,
  limit   : 40,
  offset  : 0,

  location           : arrayOf(Shape),
  published          : FromTo,
  realtyType         : arrayOf(),
  marketType         : arrayOf(),
  sources            : arrayOf(),
  verificationStatus : arrayOf(),

  get string () {
    return JSON.stringify(getSnapshot(this))
  },
  set string (filterString) {
    applySnapshot(this, JSON.parse(filterString || OffersFilterStore().string))
  }
})

export class OffersFilterViewStore  {
  filter = null

  @observable rawAddress = ''
  @observable realtyTypeOptions = TelephonistRealtyTypeAllowed.map(key => ({
    value : key,
    label : RealtyType[key],
  }))

  @observable marketTypeOptions = Object.entries(MarketType).map(([value, label]) => ({
    value, label
  }))

  @observable sourcesOptions = Object.entries(Sources).map(([value, label]) => ({
    value, label
  }))

  @observable verificationStatusOptions = Object.entries(VerificationStatus).map(([value, label]) => ({
    value, label
  }))

  constructor (filter) {
    this.filter = clone(filter)
  }
}
