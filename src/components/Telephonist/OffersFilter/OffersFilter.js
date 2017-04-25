import React, {Component, PropTypes} from 'react'
import {observer, inject} from 'mobx-react'
import {autorunAsync, action, runInAction} from 'mobx'
import {getSnapshot, applySnapshot, onPatch, applyPatch} from 'mobx-state-tree'
import ReactTooltip from 'react-tooltip'

import {TextToAddress, AddressToBounds} from 'side/api/Yandex'
import {
  Autocomplete,
  Multiselect,
  FromTo,
} from 'components/lib'
import {OffersFilterViewStore} from 'store/Telephonist/OffersFilterStore'


import s from './OffersFilter.sass'


export default
@inject('userStore')
@observer
class OffersFilter extends Component {
  static propTypes = {
    filter        : PropTypes.object.isRequired,
    userStore     : PropTypes.object.isRequired,
    offersFetcher : PropTypes.object.isRequired,
  }

  filterView = new OffersFilterViewStore(this.props.filter)

  disposers = []
  @action componentWillMount () {
    try {
      let {filter, rawAddress} = JSON.parse(window.localStorage.getItem('offersFilterViewStore'))
      if (filter) {
        applySnapshot(this.filterView.filter, filter)
        this.filterView.rawAddress = rawAddress
        this.apply()
      }
    } catch (e) {}
  }
  componentDidMount () {
    this.disposers.push(autorunAsync(this.requestBoundsByAddress, 500))
    onPatch(this.props.filter, patch => {
      applyPatch(this.filterView.filter, patch)
      window.localStorage.setItem(
        'offersFilterViewStore',
        JSON.stringify({
          filter     : getSnapshot(this.filterView.filter),
          rawAddress : this.filterView.rawAddress,
        })
      )
    })
  }
  componentWillUnmount () {
    this.disposers.forEach(disposer => disposer())
    this.disposers = []
  }

  requestBoundsByAddress = async () => {
    if (!this.filterView.rawAddress) {
      runInAction(() => { this.filterView.filter.location = [] })
      return
    }
    let bounds = await AddressToBounds(this.filterView.rawAddress)
    runInAction(() => {
      this.filterView.filter.location = [{box: bounds}]
    })
  }
  apply = () => {
    applySnapshot(this.props.filter, getSnapshot(this.filterView.filter))
  }
  render () {
    return (
      <div className={s.root}>
        <div className={s.row}>
          <div className={s.field}>
            <div className={s.fieldLabel}>
              Адрес
              <span className={s.required}>*</span>
            </div>
            <div className={s.fieldInput}>
              <Autocomplete store={this.filterView} field='rawAddress' autocomplete={TextToAddress} />
            </div>
          </div>
          <div className={s.field}>
            <div className={s.fieldLabel}>Тип объекта</div>
            <div className={s.fieldInput}>
              <Multiselect
                store={this.filterView.filter}
                field='realtyType'
                options={this.filterView.realtyTypeOptions}
                />
            </div>
          </div>
          <ReactTooltip
            id='dateTip'
            place='bottom'
            type='dark'
            effect='float'
            >
            <div className={s.tooltip}>
              Объявление будет показано если в выбранный диапазон
              попадёт хотя бы одна дата самого объявления из диапазона "Публикация - Замечено"
            </div>
          </ReactTooltip>
          <div className={s.field} data-tip data-for='dateTip'>
            <div className={s.fieldLabel}>Дата объявления</div>
            <div className={s.fieldInput}>
              <FromTo
                from={{
                  store : this.filterView.filter.published,
                  field : 'from',
                }}
                to={{
                  store : this.filterView.filter.published,
                  field : 'to',
                }}
                type='date'
                />
            </div>
          </div>
          <div className={s.field}>
            <div className={s.fieldLabel}>Тип сделки</div>
            <div className={s.fieldInput}>
              <Multiselect
                store={this.filterView.filter}
                field='marketType'
                options={this.filterView.marketTypeOptions}
                />
            </div>
          </div>
          <div className={s.field}>
            <div className={s.fieldLabel}>Источник</div>
            <div className={s.fieldInput}>
              <Multiselect
                store={this.filterView.filter}
                field='sources'
                options={this.filterView.sourcesOptions}
                />
            </div>
          </div>
          <button
            disabled={
              this.props.offersFetcher.loadingFilterString !== null ||
              this.props.filter.string === this.filterView.filter.string ||
              !this.filterView.rawAddress
            }
            className={`btn btn-primary ${s.buttonApply}`}
            onClick={this.apply}>
            Применить
          </button>
        </div>
        <div className={s.row} />
      </div>
    )
  }
}
