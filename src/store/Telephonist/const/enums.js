
export const RealtyType = {
  RESALE               : 'Вторичное жилье',
  NEWBUILDING          : 'Новостройка',
  OFFICE_COMMERCIAL    : 'Офисное помещение',
  TRADE_COMMERCIAL     : 'Торговое помещение',
  WAREHOUSE_COMMERCIAL : 'Производственно-складское',
  FREE_COMMERCIAL      : 'Свободного назначения',
  BUILDING_COMMERCIAL  : 'Здание',
  LAND_COMMERCIAL      : 'Земельный участок',
  OTHER_COMMERCIAL     : 'Другое',
  LAND                 : 'Участок',
  HOUSE                : 'Дом',
  DACHA                : 'Дача',
  TOWNHOUSE            : 'Таунхаус',
  CHALET               : 'Коттедж',
}

export const TelephonistRealtyTypeAllowed = [
  'OFFICE_COMMERCIAL',
  'TRADE_COMMERCIAL',
  'WAREHOUSE_COMMERCIAL',
  'FREE_COMMERCIAL'
]

export const MarketType = {
  SALE : 'Продажа',
  RENT : 'Аренда',
}

export const Sources = {
  cianCommercial     : 'ЦИАН',
  domofondCommercial : 'Домофонд',
  // arendator          : 'Арендатор',
}

export const VerificationStatus = {
  UNVERIFIED  : 'Непроверенные',
  IN_PROGRESS : 'В работе',
  VERIFIED    : 'Проверенные',
}

// Передаваемые имущественные права
export const TransferableOwnershipRights = {
  OWNERSHIP    : 'Право собственности',
  CLAIM_RIGHTS : 'Право требования',
}

// Типичное использование окружающей застройки
export const AreaUsageType = {
  MIXED       : 'Район смешанной застройки',
  RESIDENTIAL : 'Спальный район',
  INDUSTRIAL  : 'Промышленная зона',
}

// Материал стен
export const BaikalLegacyWalls = {
  panel           : 'Панель',
  kirpich         : 'Кирпич',
  wooden          : 'Дерево',
  monolith        : 'Монолит',
  block           : 'Блок',
  monolithKirpich : 'Монолит-кирпич',
  sandwichPanels  : 'Сэндвич панели',
}

// Тип здания
export const BuildingType = {
  RESIDENTIAL         : 'Жилой дом',
  NON_RESIDENTIAL     : 'Нежилое здание',
  BUSINESS_CENTER     : 'Бизнес центр',
  TRADE_CENTER        : 'Торговый центр',
  TRADE_OFFICE_CENTER : 'Торгово-офисный центр',
  STORAGE_COMPLEX     : 'Профессионально-складские комплексы',
}

// Тип договора
export const ContractType = {
  SALE        : 'Продажа',
  PERMISSION  : 'Переуступка прав аренды',
  DIRECT_RENT : 'Аренда',
  SUB_RENT    : 'Субаренда',
  OTHER       : 'Партнерство (совместная аренда)',
}

// Состояние отделки
export const RepairState = {
  EXCELLENT      : 'Отличное',
  GOOD           : 'Хорошее',
  NEEDS_COSMETIC : 'Удовлетворительное',
  NEEDS_CAPITAL  : 'Неудовлетворительное',
}
// NEEDS_CAPITAL('неудовлетворительное'),
// +NEEDS_COSMETIC('удовлетворительное'),
// +GOOD('хорошее')
// [NEEDS_COSMETIC, GOOD, EXCELLENT, NEEDS_CAPITAL]
// Состояние отделки
export const RepairState2 = {
  GOOD           : 'Хорошее',
  NEEDS_COSMETIC : 'Удовлетворительное',
  NEEDS_CAPITAL  : 'Неудовлетворительное',
}

// Валюта цены
export const Currency = {
  RUB : '₽',
  USD : '$',
  EUR : '€',
}

// Наличие ограничений и обременений
export const EncumberancesAndLimitations = {
  NONE      : 'Отсутствуют',
  MORTGAGE  : 'Ипотека',
  LEASEHOLD : 'Договор аренды',
  SERVITUDE : 'Сервитут',
}

// // Тип входа
// export const EntryType = {
//   BY_PASS  : 'По пропуску',
//   FREE     : 'Свободный вход',
//   SEPARATE : 'Отдельный вход',
// }

// Матреал перекрытий
export const FloorConstructionMaterial = {
  REINFORCED_CONCRETE : 'Железобетонные',
  WOOD                : 'Деревянные',
}

// Покрытие пола
export const Flooring = {
  ASPHALT_OR_CONCRETE_TILE       : 'Асфальт или бетонная плитка',
  PLAIN_CONCRETE                 : 'Бетон без покрытия',
  CONCRETE_WITH_ANTIDUST_COATING : 'Бетонный пол с антипылевым покрытием',
}

// Пешеходный/автомобильны трафик
export const FlowIntencity = {
  HIGH     : 'Высокий трафик',
  MODERATE : 'Низкий трафик',
  LOW      : 'Средний трафик',
}

// Планировка
export const OfficeZoningType = {
  ROOMS       : 'Кабинетная',
  OPEN_SPACE  : 'Открытая планировка',
  TRADE_FLOOR : 'Наличие торгового зала',
}

// Происхождение цены
export const PriceType = {
  OFFER : 'Предложение',
  DEAL  : 'Сделка',
}

export const ControlSystem = {
  'есть'               : 'Есть',
  'нет'                : 'Нет',
  'пропускная система' : 'Пропускная система',
  'свободный'          : 'Свободный',
}

export const YesNo = {
  'Да'  : true,
  'Нет' : false,
}

export const Exists = {
  'Есть' : true,
  'Нет'  : false,
}

export const ExistsString = {
  'Есть' : 'true',
  'Нет'  : 'false',
}

export const LineNumber = {
  'Первая' : 1,
  'Вторая' : 2,
}

export const BuildingClass = {
  A      : 'A',
  APLUS  : 'A+',
  B      : 'B',
  BPLUS  : 'B+',
  BMINUS : 'B-',
  C      : 'C',
  CPLUS  : 'C+',
  D      : 'D',
  DPLUS  : 'D+',
}

export const RealtyVerificationStatus = {
  VALID       : 'Дополнено',
  INVALID     : 'Объявление невалидно',
  CANNOTCHECK : 'Есть проблемы с валидацией',
}
