import {
  observable,
  autorun,
  action,
  runInAction,
} from 'mobx'
import {getSnapshot, applySnapshot} from 'mobx-state-tree'

import {FetchOffers} from 'side/api/Telephonist'
import {FetchRealtyTyWork} from 'side/api/Telephonist/FetchRealtyTyWork'


export class OffersFetcher {
  disposers = []
  offersStore = null
  history = null

  @observable loadingFilterString = null
  @observable failedCount         = 0
  @observable failedFilterString  = null
  @observable maxFails            = 3

  constructor ({offersStore, history}) {
    this.history = history
    this.offersStore = offersStore
    this.init()
  }
  async init () {
    await Promise.delay(1)
    this.disposers.push(autorun(this.checkOffersToFetch))
  }
  destroy () {
    this.disposers.forEach(disposer => { disposer() })
    this.disposers = []
  }

  checkOffersToFetch = () => {
    if (
      !this.offersStore.filterStore.location ||
      !this.offersStore.filterStore.location.length
    ) return
    if (this.offersStore.filterString === this.offersStore.filterStore.string) return
    if (this.loadingFilterString === this.offersStore.filterStore.string) return
    if (this.failedCount >= this.maxFails &&
        this.offersStore.filterStore.string === this.failedFilterString) return
    this.fetchOffers(this.offersStore.filterStore)
  }

  @action fetchOffers (filterStore) {
    this.loadingFilterString = filterStore.string
    let filterString = filterStore.string
    if (filterStore.string !== this.failedFilterString) {
      this.failedFilterString = null
      this.failedCount = 0
      this.offersStore.fetchError = null
    }
    FetchOffers({
      history : this.history,
      filter  : getSnapshot(filterStore),
    }).then(({offers, offersCount, taskStatus, error}) => {
      if (error) return this.receiveFail({error, filterString})
      this.receiveOffers({offers, offersCount, taskStatus, filterString})
    }).catch(error => {
      this.receiveFail({error, filterString})
    })
  }

  @action receiveOffers ({offers, offersCount, taskStatus, filterString}) {
    if (this.loadingFilterString !== filterString) return
    try {
      applySnapshot(this.offersStore.offers, offers)
      applySnapshot(this.offersStore.taskStatus, taskStatus)
    } catch (e) {
      this.receiveFail({error: e, filterString})
      return
    }
    this.loadingFilterString = null
    this.offersStore.filterString = filterString
    this.offersStore.count = offersCount
  }

  @action receiveFail ({error, filterString}) {
    console.error(error && error.stack || error)
    if (this.loadingFilterString !== filterString) return
    this.loadingFilterString = null
    this.failedFilterString = filterString
    this.failedCount++
    this.offersStore.fetchError = 'Произошла внутренняя ошибка\n' + (error && error.message || '')
  }

  async toWork (hid) {
    let response = await FetchRealtyTyWork({history: this.history, hid})
    if (response.error) return response

    runInAction(() => {
      this.offersStore.taskStatus.set(hid, 'IN_PROGRESS')
    })

    return {}
  }
}

