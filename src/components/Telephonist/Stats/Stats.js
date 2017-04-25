import React, {Component, PropTypes} from 'react'
import {observer, inject} from 'mobx-react'
import {observable, toJS, computed} from 'mobx'
import {toISOFromTo} from 'lib/ISO'

import {
  FromTo,
} from 'components/lib'

import s from './Stats.sass'


export default
@inject('history')
@observer
class Stats extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  @observable fromTo = {
    from : null,
    to   : null,
  }

  @computed get link () {
    if (!this.fromTo.from || !this.fromTo.to) return null
    let fromTo = toISOFromTo(toJS(this.fromTo))
    return (
      `/${this.props.history.basename}/rest/telephonist/tasks/stats/asExcel` +
      `?from=${fromTo.from.split('T')[0]}&to=${fromTo.to.split('T')[0]}`
    )
  }

  render () {
    return (
      <div className={s.root}>
        <div className={s.titleRow}>
          <h4>Статистика</h4>
        </div>
        <div className={s.row}>
          <div className={s.field}>
            <div className={s.fieldLabel}>Период</div>
            <div className={s.fieldInput}>
              <FromTo
                from={{
                  store : this.fromTo,
                  field : 'from',
                }}
                to={{
                  store : this.fromTo,
                  field : 'to',
                }}
                type='date'
                />
            </div>
          </div>
          <a
            className={s.downloadLink}
            target='_blank'
            download={'Статистика оператора ' + [this.fromTo.from, this.fromTo.to].join('-') + '.xlsx'}
            href={this.link}
            disabled={!this.link}>
            <button
              disabled={!this.link}
              title={!this.link && 'Введите период' || undefined}
              className={'btn btn-primary ' + s.download}>
              Скачать
              <i className='fa fa-download' aria-hidden='true' />
            </button>
          </a>
        </div>
      </div>
    )
  }
}
