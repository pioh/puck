import {createFactory, arrayOf} from 'mobx-state-tree'
import _pick from 'lodash/pick'

import {fromISO, toISO} from 'lib/ISO'
import {omitNull} from 'lib/Omit'
export const OfferStoreDefault = {}


export const FromServerOffer = (o = {}) => {
  o = {
    ...o,
    rawAddress       : o.rawAddress || o.fullAddress,
    published        : fromISO(o.published),
    lastUpdate       : fromISO(o.lastUpdate),
    lastSourceUpdate : fromISO(o.lastSourceUpdate),
    markNoticed      : fromISO(o.markNoticed),
    photoUrls        : o.photoUrls ? o.photoUrls.sort() : o.photoUrls,
  }
  return _pick(o, Object.keys(OfferStore()))
}

export const ToServerOffer = o => {
  return omitNull({
    ...o,
    fullAddress      : o.fullAddress || o.rawAddress,
    published        : toISO(o.published),
    lastUpdate       : toISO(o.lastUpdate),
    lastSourceUpdate : toISO(o.lastSourceUpdate),
    markNoticed      : toISO(o.markNoticed),
  })
}

export const GeoData = createFactory({
  id          : null,
  streetId    : null,
  houseNumber : null,
  latDegrees  : null,
  lonDegrees  : null,
  response    : null,
  lastUpdate  : null,
  status      : null,
})

export const OfferStore = createFactory({
  get location () {
    return this.geoData && this.geoData.latDegrees && this.geoData.lonDegrees
      ? [this.geoData.latDegrees, this.geoData.lonDegrees]
      : null
  },
  set location (arr) {
    this.geoData = {
      ...this.geoData,
      latDegrees : arr && arr[1] && arr[0] || null,
      lonDegrees : arr && arr[0] && arr[1] || null,
    }
  },
  get marketType () {
    if (!this.contractType) return null
    return (
      ['SALE', 'LEASEHOLD_RIGHTS_SALE']
        .indexOf(this.contractType) >= 0
      ? 'SALE' : 'RENT')
  },
  set marketType (newVal) {},
  geoData    : GeoData,
  // тип здания - офисные помещения, торговые, свободного назначения и складские
  realtyType : null,

  // hadoop id
  hid: null,

  // Источник информации
  url: null,
  // Дата обновления (техническая дата обновления данных в наших базах)

  lastUpdate: null,
  // Дата обновления (обновление данных в источнике - обьявления на сайте и т.п.)

  lastSourceUpdate            : null,
  verificationStatus          : null,
  // Дата размещения (дата первой публикации)
  published                   : null,
  // Контактные данные
  contactDetails              : null,
  // Текст обьявления
  info                        : null,
  // Передаваемые имущественные права
  transferableOwnershipRights : null,
  // Тип договора
  contractType                : null,
  // Наличие ограничений и обременений
  encumberancesAndLimitations : null,
  // Происхождение цены (сделка или предложение)
  priceType                   : null,
  // цена продажи целиком с ндс
  price                       : null,
  // цена продажи целиком в исходной валюте
  currencyPrice               : null,
  // цена продажи или аренды за метр
  pricePerMeter               : null,
  // цена продажи или аренды за метр в исходной валюте
  currencyPricePerMeter       : null,
  // коммунальные расходы, в год
  utilitiesCosts              : null,
  // коммунальные расходы, в год в исходной валюте
  utilitiesCostsOrig          : null,
  // эксплуатационные расходы, в год
  operatingCosts              : null,
  // эксплуатационные расходы, в год в исходной валюте
  operatingCostsOrig          : null,
  // валюта, в которой выражены цены в исходном обьявлении
  currency                    : null,

  // идентификатор региона
  regionOblastId       : null,
  // идентификатор города
  cityId               : null,
  // административный округ
  administrativeRegion : null,
  // район
  district             : null,
  // микрорайон
  subDistrict          : null,
  // идентификатор улицы
  streetId             : null,
  //  дом, строение, корпус, владение
  houseNumber          : null,
  // полный адрес (как в источнике)
  rawAddress           : null,
  // полный адрес (уточненный оператором)
  fullAddress          : null,
  // Расположение вблизи (центральных) магистралей
  highwayNearby        : null,
  // Расположение на огороженной территории (наличие ограждений территории)
  fencedArea           : null,

  // Линия домов, на которой расположено здание
  line                      : null,
  buildingsLine             : null, // TODO
  // Линия домов, с которой осуществляется вход в помещение
  mainEntranceBuildingsLine : null,
  // Типичное использование окружающей застройки
  surroundingAreaUsageType  : null,
  // Пешеходный/автомобильный трафик (его интенсивность)
  trafficIntencity          : null,
  // Принадлежность к торговому коридору
  tradeCorridor             : null,
  // Тип здания (жилой-нежилое-бизнесЦентр-торговыйЦентр-торговоОфисныйЦентр
  buildingType              : null,
  // класс здания (A-B-C-D etc), в котором находится помещение
  buildingClass             : null,
  // Физическое состояние здания (капремонт)
  cosmeticCondition         : null,
  // Год постройки здания

  built: null,

  // Срок сдачи (для обьектов незавершенного строительства)
  plannedCompletion           : null, // depricated
  plannedCompletionDate       : null,
  // Степень готовности (для обьектов незавершенного строительства)
  constructionCompletionStage : null,
  // Материал стен
  walls                       : null,
  // Материал перекрытий
  floorConstructionMaterial   : null,
  // Этажность здания
  storeys                     : null,
  // Этаж расположения
  floor                       : null,
  // Подвал, кв.м
  undergroundSpace            : null,
  // Цоколь, кв.м
  basementSpace               : null,
  // Первый этаж, кв.м
  groundFloorSpace            : null,
  // Площади выше первого этажа, кв.м
  aboveGroundFloorSpace       : null,
  // Состояние отделки
  repairs                     : null,
  // Наличие отдельного входа
  separateEntrance            : null,
  // Наличие подъезда для еврофуры (в названии поля - наличие порта разгрузки еврофуры в здании)
  eurotruckLoadingDock        : null,
  // Наличие железнодорожной ветки
  railroadAccess              : null,
  // Наличие грузоподьемных механизмов
  cargoMovers                 : null,
  // Рабочая высота потолка
  usableCeilingHeight         : null,
  // Покрытие пола
  flooring                    : null,
  // Высота потолка
  ceilingHeight               : null,
  // Наличие окон
  windows                     : null,
  // Наличие витринных окон
  shopWindow                  : null,
  // Планировка офиса
  officeZoningType            : null,
  // Количество комнат
  rooms                       : null,
  // Общая площадь кв.м
  total                       : null,
  // Арендопригодная (Полезная) площадь
  leasableSpace               : null,
  // Офисные помещения, кв.м
  officeSpace                 : null,
  // Торговые помещения, кв.м
  shopSpace                   : null,
  // Производственно-складские помещения, кв.м
  storageSpace                : null,
  // Помещения общего пользования и инженерного назначения, кв.м
  publicAndUtilitySpace       : null,
  // неотапливаемые производственно-складские помещения, кв.м
  nonHeatedStorageSpace       : null,
  // отапливаемые производственно-складские помещения, кв.м
  heatedStorageSpace          : null,
  // холодильные (низкотемпературные) помещения, кв.м
  freezerStorageSpace         : null,
  // Электроснабжение, выделенная мощность если есть
  electricity                 : null,
  // Водоснабжение и водоотведение
  waterSupply                 : null,
  // Теплоснабжение
  heating                     : null,
  // Канализация
  sewerage                    : null,
  // Кондиционирование
  airConditioning             : null,
  // Парковка
  parking                     : null,
  // Пропускная система
  controlSystem               : null,
  // Охрана
  security                    : null,
  // Телефония
  phoneLine                   : null,
  // Интернет
  internet                    : null,
  // Наличие движимого имущества, не связанного с недвижимостью
  extraAssets                 : null,
  // Текущее использование
  currentUsage                : null,
  // Размер скидки (процент)
  allowedDiscount             : null,
  // Дополнительные комментарии к обьявлению/результаты телефонных переговоров
  additionalComments          : null,
  // Наличие мебели
  furniture                   : null,

  // Поля байкала, не фигурирующие в анкете
  // Тип сделки (продажа/аренда)
  // Планировка
  plan        : null,
  // Идентификатор
  id          : null,
  // Заголовок обьявления на сайте
  title       : null,
  // тип входа
  entryType   : null, // depricated
  // Дата, когда обьявление было замечено на сайте последний раз
  markNoticed : null,
  // Идентификатор района
  dictrictId  : null,
  // Ссылки на фотографии обьявления
  photoUrls   : arrayOf(),

  index          : null,
  waterWaste     : null,
  kvtElectricity : null,
})

let offerKeys  = Object.keys(OfferStore())
offerKeys.forEach(key => {
  offerKeys[key] = true
})

// export const OmitOffer = offer => {
//   delete offer.marketType
//   for (let key in offer) {
//     if (!offerKeys[key]) {
//       delete offer[key]
//       console.error(`extra key '${key}' in offer`)
//     }
//   }
// }
