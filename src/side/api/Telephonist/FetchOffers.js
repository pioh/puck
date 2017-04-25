import {TelephonistRealtyTypeAllowed} from 'store/Telephonist/const/enums'

import {FromServerOffer} from 'store/Telephonist/OfferStore'
import {omitNull} from 'lib/Omit'
import {toISOFromTo} from 'lib/ISO'


export const ToServerFilter = filter => {
  filter = {
    ...filter,
    sortBy     : filter.sortBy ? [filter.sortBy] : null,
    realtyType : filter.realtyType && filter.realtyType.length
      ? filter.realtyType
      : TelephonistRealtyTypeAllowed,
    date      : toISOFromTo(filter.published),
    published : undefined,
    offset    : Math.floor(filter.offset / filter.limit),
    fields    : ['hid', 'rawAddress', 'total', 'realtyType', 'price', 'published', 'markNoticed', 'lastSourceUpdate'],
  }
  return omitNull(filter)
}

export default async function FetchOffers ({history, filter}) {
  let request = {filter: ToServerFilter(filter)}
  let url = `/${history.basename}/rest/telephonist/realties/filter?q=${encodeURIComponent(JSON.stringify(request))}`

  let response = await fetch(url, {
    credentials: 'same-origin',
  })
  if (!response.ok) {
    console.error(`faield fetch ${url}`)
    return {
      error: {
        message: 'Произошла внутренняя ошибка',
      }
    }
  }
  let response2 = response.clone()
  try {
    response = await response.json()
  } catch (e) {
    let error = e
    try {
      let text = (await response2.text()).match(/<pre>(.*)/)[1]
      if (text) error = new Error(text)
    } catch (e2) {
    }
    throw error
  }
  response.taskStatus = response.taskStatus || {}
  response.offersCount = Math.min(response.offersPages * filter.limit, response.offersCount)
  response.offers = response.offers.map((o, i) => {
    o = FromServerOffer(o)
    o.index = filter.offset + i + 1
    return o
  })

  return response
}
