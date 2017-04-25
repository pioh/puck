import {observable, toJS, computed} from 'mobx'
import {createFactory, getSnapshot, applySnapshot, clone} from 'mobx-state-tree'
import _get from 'lodash/get'

import {omitNull} from 'lib/Omit'
import {FromServerOffer, ToServerOffer, OfferStore, OfferStoreDefault} from './OfferStore'
import {fromISO, toISO} from 'lib/ISO'
import * as enums from './const/enums'
import _pick from 'lodash/pick'


export const FromServerTask = task => {
  task = {
    ...task,
    offer       : FromServerOffer(task.realty),
    createdTime : fromISO(task.createdTime),
    lastUpdate  : fromISO(task.lastUpdate),
  }
  delete task.realty
  task.offer.hid = task.hid || task.offer.hid

  return _pick(task, Object.keys(TaskStore()))
}
export const ToServerTask = task => {
  task = {
    ...task,
    realty      : ToServerOffer(task.offer),
    createdTime : toISO(task.createdTime),
    lastUpdate  : toISO(task.lastUpdate),
  }
  if (String(task.id).match(/^new-/)) delete task.id
  delete task.offer
  return omitNull(task)
}

export const TaskStoreDefault = {
  offer: OfferStoreDefault
}

export const TaskStore = createFactory({
  id              : null,
  hid             : null,
  index           : null,
  offer           : OfferStore,
  manuallyCreated : null,
  taskStatus      : null,
  createdTime     : null,
  lastUpdate      : null,
  comments        : null,
  userId          : null,
})
global.TaskStore = TaskStore
global.FromServerTask = FromServerTask
let RealtyTypeCommercial = {}
enums.TelephonistRealtyTypeAllowed.forEach(t => {
  RealtyTypeCommercial[t] = enums.RealtyType[t]
})
export class TaskViewStore {
  task = null
  constructor (task) {
    this.task = clone(task)
  }

  @computed get json () {
    return {
      fields : toJS(this.fields),
      bounds : toJS(this.bounds),
      task   : getSnapshot(this.task),
    }
  }
  set json (o = {}) {
    this.fields = o.fields
    this.bounds = o.bounds
    applySnapshot(this.task, o.task)
  }

  @observable bounds

  @observable fields = {
    'offer.realtyType': {
      title    : 'Тип объекта',
      type     : 'select',
      enum     : RealtyTypeCommercial,
      required : true,
    },
    // 'offer.marketType': {
    //   title    : 'Тип сделки',
    //   type     : 'select',
    //   enum     : enums.MarketType,
    //   required : true,
    // },
    'offer.contractType': {
      title    : 'Тип договора',
      type     : 'select',
      enum     : enums.ContractType,
      required : true,
    },
    'offer.url': {
      title    : 'Источник информации (Ссылка)',
      required : true,
    },
    'offer.lastSourceUpdate': {
      title    : 'Дата обновления',
      type     : 'date',
      required : true,
    },
    'offer.published': {
      title    : 'Дата размещения',
      type     : 'date',
      required : true,
    },
    'offer.contactDetails': {
      title    : 'Контактные данные',
      required : true,
    },
    'offer.transferableOwnershipRights': {
      title    : 'Передаваемые имущественные права',
      type     : 'select',
      enum     : enums.TransferableOwnershipRights,
      required : true,
    },
    'offer.encumberancesAndLimitations': {
      title    : 'Наличие ограничений и обременений',
      type     : 'select',
      enum     : enums.EncumberancesAndLimitations,
      required : true,
    },
    'offer.priceType': {
      title    : 'Тип цены',
      type     : 'select',
      enum     : enums.PriceType,
      required : true,
    },
    'offer.price': {
      title    : 'Цена (с НДС), руб.',
      required : true,
      props    : {
        type: 'int',
      },
      hide: computed(() => this.task.offer.marketType !== 'SALE'),
    },
    'offer.pricePerMeter': {
      title: computed(() => this.task.offer.marketType === 'SALE'
        ? 'Цена за м.кв. (с НДС), руб.' : 'Ставка за м.кв. в год (с НДС), руб.'
      ),
      required : true,
      props    : {
        type: 'int',
      },
      hide: computed(() => this.task.offer.marketType === null),
    },
    'offer.utilitiesCosts': {
      title    : 'Размер коммунальных расходов за м.кв. в год, руб.',
      required : true,
      props    : {
        type: 'int',
      },
      hide: computed(() => this.task.offer.marketType !== 'RENT'),
    },
    'offer.operatingCosts': {
      title    : 'Размер эксплуатационных расходов за м.кв. в год, руб.',
      required : true,
      props    : {
        type: 'int',
      },
      hide: computed(() => this.task.offer.marketType !== 'RENT'),
    },
    'offer.currencyPrice': {
      title    : computed(() => `Цена в валюте (с НДС), ${enums.Currency[this.task.offer.currency]}`),
      required : true,
      props    : {
        type     : 'int',
        disabled : true,
      },
      hide: computed(() => !(
        this.task.offer.marketType === 'SALE' &&
        this.task.offer.currencyPrice &&
        this.task.offer.currency &&
        this.task.offer.currency !== 'RUB'
      )),
    },
    'offer.currencyPricePerMeter': {
      title: computed(() => this.task.offer.marketType === 'SALE'
        ? `Цена за м.кв. (с НДС), ${enums.Currency[this.task.offer.currency]}`
        : `Ставка за м.кв. в год (с НДС), ${enums.Currency[this.task.offer.currency]}`
      ),
      required : true,
      props    : {
        type     : 'int',
        disabled : true,
      },

      hide: computed(() => !(
        this.task.offer.marketType === 'SALE' &&
        this.task.offer.currencyPrice &&
        this.task.offer.currency &&
        this.task.offer.currency !== 'RUB'
      )),
    },
    'offer.currency': {
      title    : 'Валюта цены в исходном объявлении',
      type     : 'select',
      enum     : enums.Currency,
      required : true,
      hide     : computed(() => !(
        this.task.offer.marketType === 'SALE' &&
        this.task.offer.currencyPrice &&
        this.task.offer.currency &&
        this.task.offer.currency !== 'RUB'
      )),
    },
    'offer.currentUsage': {
      title : 'Текущее использование',
      tab   : 0,
      props : {
        textarea: true,
      },
    },
    'offer.allowedDiscount': {
      title : 'Размер скидки на торг, %',
      tab   : 0,
      props : {
        type: 'percent',
      },
      required: true,
    },

    'offer.highwayNearby': {
      title    : 'Расположение вблизи центральных магистралей',
      tab      : 1,
      type     : 'select',
      renum    : enums.YesNo,
      required : true,
      hide     : computed(() => this.task.offer.realtyType !== 'WAREHOUSE_COMMERCIAL'),
    },
    'offer.fencedArea': {
      title : 'Расположение на огороженной территории',
      tab   : 1,
      type  : 'select',
      renum : enums.YesNo,
      hide  : computed(() =>
        ['WAREHOUSE_COMMERCIAL', 'OFFICE_COMMERCIAL'].indexOf(this.task.offer.realtyType) < 0
      ),
    },
    'offer.line': {
      title : 'Линия домов, на которой расположено здание',
      tab   : 1,
      type  : 'select',
      renum : enums.LineNumber,
      hide  : computed(() =>
        ['TRADE_COMMERCIAL', 'OFFICE_COMMERCIAL', 'FREE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) < 0
      ),
    },
    'offer.mainEntranceBuildingsLine': {
      title    : 'Линия домов, с которой осуществляется вход в помещение',
      tab      : 1,
      type     : 'select',
      renum    : enums.LineNumber,
      required : true,
      hide     : computed(() =>
        ['TRADE_COMMERCIAL', 'OFFICE_COMMERCIAL', 'FREE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) < 0
      ),
    },
    'offer.surroundingAreaUsageType': {
      title : 'Типичное использование окружающей застройки',
      tab   : 1,
      type  : 'select',
      enum  : enums.AreaUsageType,
      hide  : computed(() =>
        ['TRADE_COMMERCIAL', 'OFFICE_COMMERCIAL', 'FREE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) < 0
      ),
    },
    'offer.trafficIntencity': {
      title    : 'Пешеходный/Автомобильны трафик',
      tab      : 1,
      type     : 'select',
      enum     : enums.FlowIntencity,
      required : computed(() =>
        ['TRADE_COMMERCIAL', 'FREE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) >= 0
      ),
      hide: computed(() =>
        ['TRADE_COMMERCIAL', 'OFFICE_COMMERCIAL', 'FREE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) < 0
      ),
    },
    'offer.tradeCorridor': {
      title    : 'Принадлежность к торговому коридору',
      tab      : 1,
      type     : 'select',
      renum    : enums.YesNo,
      required : true,
      hide     : computed(() =>
        ['TRADE_COMMERCIAL', 'FREE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) < 0
      ),
    },
    'offer.buildingType': {
      title    : 'Тип здания',
      tab      : 2,
      type     : 'select',
      enum     : enums.BuildingType,
      required : true,
    },
    'offer.buildingClass': {
      title    : 'Класс здания',
      tab      : 2,
      type     : 'select',
      enum     : enums.BuildingClass,
      required : computed(() =>
        ['OFFICE_COMMERCIAL', 'WAREHOUSE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) >= 0
      ),
    },
    'offer.cosmeticCondition': {
      title    : 'Физическое состояние здания',
      tab      : 2,
      type     : 'select',
      enum     : enums.RepairState2,
      required : true,
    },
    'offer.built': {
      title : 'Год постройки здания',
      tab   : 2,
      props : {
        type: 'number',
      },
    },
    'offer.plannedCompletionDate': {
      title    : 'Срок сдачи (для объектов незавершенного строительства)',
      tab      : 2,
      required : computed(() =>
        this.task.offer.transferableOwnershipRights === 'CLAIM_RIGHTS' &&
        !this.task.offer.built
      ),
    },
    'offer.constructionCompletionStage': {
      title : 'Степень готовности (для объектов незавершенного строительства), %',
      tab   : 2,
      props : {
        type   : 'percent',
        format : 'string',
      },
      required: computed(() =>
        this.task.offer.transferableOwnershipRights === 'CLAIM_RIGHTS' &&
        !this.task.offer.built
      ),
    },
    'offer.walls': {
      title : 'Материал стен',
      tab   : 2,
      type  : 'select',
      enum  : enums.BaikalLegacyWalls,
    },
    'offer.floorConstructionMaterial': {
      title : 'Материал перекрытий',
      tab   : 2,
      type  : 'select',
      enum  : enums.FloorConstructionMaterial,
    },
    'offer.storeys': {
      title : 'Этажность здания',
      tab   : 2,
      props : {
        type: 'number',
      },
    },
    'offer.floor': {
      title : 'Этаж расположения',
      tab   : 2,
      props : {
        type: 'number',
      },
      required: true,
    },
    'offer.undergroundSpace': {
      title : 'В том числе: подвал, кв.м.',
      tab   : 2,
      props : {
        type: 'meter',
      },
      required: computed(() =>
        !this.task.offer.undergroundSpace &&
        !this.task.offer.basementSpace &&
        !this.task.offer.groundFloorSpace &&
        !this.task.offer.aboveGroundFloorSpace
      ),
    },
    'offer.basementSpace': {
      title : 'В том числе: цоколь, кв.м.',
      tab   : 2,
      props : {
        type: 'meter',
      },
      required: computed(() =>
        !this.task.offer.undergroundSpace &&
        !this.task.offer.basementSpace &&
        !this.task.offer.groundFloorSpace &&
        !this.task.offer.aboveGroundFloorSpace
      ),
    },
    'offer.groundFloorSpace': {
      title : 'В том числе: первый этаж, кв.м.',
      tab   : 2,
      props : {
        type: 'meter',
      },
      required: computed(() =>
        !this.task.offer.undergroundSpace &&
        !this.task.offer.basementSpace &&
        !this.task.offer.groundFloorSpace &&
        !this.task.offer.aboveGroundFloorSpace
      ),
    },
    'offer.aboveGroundFloorSpace': {
      title : 'В том числе: выше первого этажа, кв.м.',
      tab   : 2,
      props : {
        type: 'meter',
      },
      required: computed(() =>
        !this.task.offer.undergroundSpace &&
        !this.task.offer.basementSpace &&
        !this.task.offer.groundFloorSpace &&
        !this.task.offer.aboveGroundFloorSpace
      ),
    },
    'offer.repairs': {
      title    : 'Состояние отделки',
      tab      : 2,
      type     : 'select',
      enum     : enums.RepairState,
      required : true,
    },
    'offer.separateEntrance': {
      title    : 'Наличие отдельного входа',
      tab      : 2,
      type     : 'select',
      renum    : enums.Exists,
      required : true,
    },
    'offer.eurotruckLoadingDock': {
      title    : 'Наличие подъезда еврофуры',
      tab      : 2,
      type     : 'select',
      renum    : enums.Exists,
      required : true,
      hide     : computed(() =>
        ['WAREHOUSE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) < 0
      ),
    },
    'offer.railroadAccess': {
      title    : 'Наличие железнодорожной ветки',
      tab      : 2,
      type     : 'select',
      renum    : enums.Exists,
      required : true,
      hide     : computed(() =>
        ['WAREHOUSE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) < 0
      ),
    },
    'offer.cargoMovers': {
      title    : 'Наличие грузоподъемных механизмов',
      tab      : 2,
      type     : 'select',
      renum    : enums.Exists,
      required : true,
      hide     : computed(() =>
        ['WAREHOUSE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) < 0
      ),
    },
    'offer.usableCeilingHeight': {
      title : 'Рабочая высота потолка, м',
      tab   : 2,
      props : {
        type: 'meter',
      },
      required : true,
      hide     : computed(() =>
        ['WAREHOUSE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) < 0
      ),
    },
    'offer.flooring': {
      title    : 'Покрытие пола',
      tab      : 2,
      type     : 'select',
      enum     : enums.Flooring,
      required : true,
      hide     : computed(() =>
        ['WAREHOUSE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) < 0
      ),
    },
    'offer.ceilingHeight': {
      title : 'Высота потолка, м',
      tab   : 2,
      props : {
        type: 'meter',
      },
      hide: computed(() =>
        ['OFFICE_COMMERCIAL', 'TRADE_COMMERCIAL', 'FREE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) < 0
      ),
    },
    'offer.windows': {
      title    : 'Наличие окон',
      tab      : 2,
      type     : 'select',
      renum    : enums.Exists,
      required : true,
      hide     : computed(() =>
        ['OFFICE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) < 0
      ),
    },
    'offer.shopWindow': {
      title    : 'Наличие витринных окон',
      tab      : 2,
      type     : 'select',
      renum    : enums.Exists,
      required : true,
      hide     : computed(() =>
        ['TRADE_COMMERCIAL', 'FREE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) < 0
      ),
    },
    'offer.officeZoningType': {
      title : 'Планировка',
      tab   : 2,
      type  : 'select',
      enum  : enums.OfficeZoningType,
      hide  : computed(() =>
        ['OFFICE_COMMERCIAL', 'TRADE_COMMERCIAL', 'FREE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) < 0
      ),
    },
    'offer.rooms': {
      title : 'Количество комнат',
      tab   : 2,
      props : {
        type: 'number',
      },
    },
    'offer.total': {
      title : 'Общая площадь, кв.м.',
      tab   : 2,
      props : {
        type: 'meter',
      },
      required: true,
    },
    'offer.leasableSpace': {
      title : 'Арендопригодная (Полезная) площадь, кв.м.',
      tab   : 2,
      props : {
        type: 'meter',
      },
      required: true,
    },
    'offer.officeSpace': {
      title : 'Офисные помещения, кв.м.',
      tab   : 2,
      props : {
        type: 'meter',
      },
      required: computed(() =>
        !this.task.offer.officeSpace &&
        !this.task.offer.shopSpace &&
        !this.task.offer.storageSpace &&
        !this.task.offer.publicAndUtilitySpace &&
        !this.task.offer.nonHeatedStorageSpace &&
        !this.task.offer.heatedStorageSpace &&
        !this.task.offer.freezerStorageSpace
      ),
    },
    'offer.shopSpace': {
      title : 'Торговые помещения, кв.м.',
      tab   : 2,
      props : {
        type: 'meter',
      },
      required: computed(() =>
        !this.task.offer.officeSpace &&
        !this.task.offer.shopSpace &&
        !this.task.offer.storageSpace &&
        !this.task.offer.publicAndUtilitySpace &&
        !this.task.offer.nonHeatedStorageSpace &&
        !this.task.offer.heatedStorageSpace &&
        !this.task.offer.freezerStorageSpace
      ),
    },
    'offer.storageSpace': {
      title : 'Производственно-Складские помещения, кв.м.',
      tab   : 2,
      props : {
        type: 'meter',
      },
      required: computed(() =>
        !this.task.offer.officeSpace &&
        !this.task.offer.shopSpace &&
        !this.task.offer.storageSpace &&
        !this.task.offer.publicAndUtilitySpace &&
        !this.task.offer.nonHeatedStorageSpace &&
        !this.task.offer.heatedStorageSpace &&
        !this.task.offer.freezerStorageSpace
      ),
      hide: computed(() =>
        ['OFFICE_COMMERCIAL', 'TRADE_COMMERCIAL', 'FREE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) < 0
      ),
    },
    'offer.publicAndUtilitySpace': {
      title : 'Помещения общего пользования и инженерного назначения, кв.м.',
      tab   : 2,
      props : {
        type: 'meter',
      },
      required: computed(() =>
        !this.task.offer.officeSpace &&
        !this.task.offer.shopSpace &&
        !this.task.offer.storageSpace &&
        !this.task.offer.publicAndUtilitySpace &&
        !this.task.offer.nonHeatedStorageSpace &&
        !this.task.offer.heatedStorageSpace &&
        !this.task.offer.freezerStorageSpace
      ),
    },
    'offer.nonHeatedStorageSpace': {
      title : 'Неотапливаемые производственно-складские помещения, кв.м.',
      tab   : 2,
      props : {
        type: 'meter',
      },
      required: computed(() =>
        !this.task.offer.officeSpace &&
        !this.task.offer.shopSpace &&
        !this.task.offer.storageSpace &&
        !this.task.offer.publicAndUtilitySpace &&
        !this.task.offer.nonHeatedStorageSpace &&
        !this.task.offer.heatedStorageSpace &&
        !this.task.offer.freezerStorageSpace
      ),
      hide: computed(() =>
        ['WAREHOUSE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) < 0
      ),
    },
    'offer.heatedStorageSpace': {
      title : 'Отапливаемые производственно-складские помещения, кв.м.',
      tab   : 2,
      props : {
        type: 'meter',
      },
      required: computed(() =>
        !this.task.offer.officeSpace &&
        !this.task.offer.shopSpace &&
        !this.task.offer.storageSpace &&
        !this.task.offer.publicAndUtilitySpace &&
        !this.task.offer.nonHeatedStorageSpace &&
        !this.task.offer.heatedStorageSpace &&
        !this.task.offer.freezerStorageSpace
      ),
      hide: computed(() =>
        ['WAREHOUSE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) < 0
      ),
    },
    'offer.freezerStorageSpace': {
      title : 'Холодильные (низкотемпературные) помещения, кв.м.',
      tab   : 2,
      props : {
        type: 'meter',
      },
      required: computed(() =>
        !this.task.offer.officeSpace &&
        !this.task.offer.shopSpace &&
        !this.task.offer.storageSpace &&
        !this.task.offer.publicAndUtilitySpace &&
        !this.task.offer.nonHeatedStorageSpace &&
        !this.task.offer.heatedStorageSpace &&
        !this.task.offer.freezerStorageSpace
      ),
      hide: computed(() =>
        ['WAREHOUSE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) < 0
      ),
    },
    'offer.electricity': {
      title    : 'Электроснабжение',
      tab      : 2,
      type     : 'select',
      renum    : enums.Exists,
      required : true,
    },
    'offer.kvtElectricity': {
      title : 'Выделенная мощность КВт.',
      tab   : 2,
      props : {
        type: 'int',
      },
      hide: computed(() =>
        ['WAREHOUSE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) < 0
      ),
    },
    'offer.waterSupply': {
      title    : 'Водоснабжение',
      tab      : 2,
      type     : 'select',
      renum    : enums.Exists,
      required : true,
    },
    'offer.heating': {
      title    : 'Теплоснабжение',
      tab      : 2,
      type     : 'select',
      renum    : enums.Exists,
      required : true,
    },
    'offer.sewerage': {
      title    : 'Канализация',
      tab      : 2,
      type     : 'select',
      renum    : enums.Exists,
      required : true,
    },
    'offer.airConditioning': {
      title    : 'Кондиционирование',
      tab      : 2,
      type     : 'select',
      renum    : enums.Exists,
      required : true,
    },
    'offer.parking': {
      title    : 'Парковка',
      tab      : 2,
      type     : 'select',
      renum    : enums.Exists,
      required : computed(() =>
        ['OFFICE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) >= 0
      ),
    },
    'offer.controlSystem': {
      title : 'Пропускная система',
      tab   : 2,
      type  : 'select',
      renum : enums.ExistsString,
      hide  : computed(() =>
        ['OFFICE_COMMERCIAL', 'WAREHOUSE_COMMERCIAL']
          .indexOf(this.task.offer.realtyType) < 0
      ),
    },
    'offer.security': {
      title : 'Охрана',
      tab   : 2,
      type  : 'select',
      renum : enums.Exists,
    },
    'offer.phoneLine': {
      title : 'Телефония',
      tab   : 2,
      type  : 'select',
      renum : enums.ExistsString,
    },
    'offer.internet': {
      title : 'Интернет',
      tab   : 2,
      type  : 'select',
      props : {
        upper: true,
      },
      renum: enums.ExistsString,
    },
    'offer.extraAssets': {
      title : 'Наличие движимого имущества, не связанного с недвижимостью',
      tab   : 2,
      type  : 'select',
      props : {
        upper: true,
      },
      renum: enums.Exists,
    },
  }

  @observable otherFields = {
    'offer.geoData': {
      title: 'Положение на карте',
    },
    'offer.rawAddress': {
      title: 'Полный адрес',
    },
    'offer.title': {
      title    : 'Заголовок',
      required : true,
    },
    'comments': {
      title: 'Комментарий',
    },
    'offer.info': {
      title    : 'Текст объявления',
      required : true,
    },
    'offer.photoUrls': {
      title: 'Фотографии и документы',
    },
    'offer.verificationStatus': {
      title: 'Статус проверки',
    },
    'userId': {
      title: 'Оператор',
    },
  }

  @computed.struct get doneErrorsByField () {
    let errors = {}
    this.doneErrors.forEach(e => {
      if (e.path && e.type === 'FIELD_ERROR') {
        errors[e.path] = errors[e.path] || []
        errors[e.path].push(e)
      }
    })
    return errors
  }

  @computed.struct get requiredFields () {
    let ret = [...Object.keys(this.fields), ...Object.keys(this.otherFields)]
      .filter(path => {
        return (
          !(this.fields[path] || this.otherFields[path]).hide &&
          (this.fields[path] || this.otherFields[path]).required &&
          (_get(this.task, path) === undefined || _get(this.task, path) === null)
        )
      })
    if (!this.task.offer.rawAddress) ret.push('offer.rawAddress')
    if (
      !this.task.offer.geoData ||
      !this.task.offer.geoData.latDegrees ||
      !this.task.offer.geoData.lonDegrees
    ) ret.push('offer.geoData')
    return ret
  }

  @computed.struct get doneErrors () {
    let errors = []
    let requiredFields = []
    if (['INVALID', 'CANNOTCHECK'].indexOf(this.task.offer.verificationStatus) < 0) {
      requiredFields = this.requiredFields
        .map(path => ({
          type      : 'FIELD_ERROR',
          message   : 'Необходимо заполнить поле',
          tab       : (this.fields[path] || this.otherFields[path]).tab,
          fieldName : (this.fields[path] || this.otherFields[path]).title || path,
          path,
        }))
    }
    errors.push(...requiredFields)
    let rootErrors = []
    if (requiredFields.length) {
      rootErrors.push(
        'Не все поля заполнены:\n' +
        requiredFields.map(({fieldName, tab}) =>
          ` * ${tab ? `(${tab + 1}) ` : ''}${fieldName}`).join('\n'))
    }
    if (rootErrors.length) {
      errors.push({
        type    : 'DOCUMENT_ERROR',
        message : rootErrors.join('\n\n'),
      })
    }
    return errors
  }
}
