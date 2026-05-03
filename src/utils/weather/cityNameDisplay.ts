import type { CityItem } from '@/store/city'

const SPECIAL_ALIAS_CANONICAL_NAMES = {
  虎门: '东莞市',
  虎门镇: '东莞市',
  松山湖: '东莞市',
  松山湖园区: '东莞市',
  长安: '东莞市',
  长安镇: '东莞市',
  常平: '东莞市',
  常平镇: '东莞市',
  厚街: '东莞市',
  厚街镇: '东莞市',
  东莞: '东莞市',
  东莞市: '东莞市',
} as const

const CITY_LEVEL_CANONICAL_NAMES = new Set([
  '北京',
  '上海',
  '天津',
  '重庆',
  '广州',
  '武汉',
  '南昌',
  '成都',
  '长沙',
])

const SPECIAL_ADMINISTRATIVE_REGION_NAMES = {
  香港: '香港特别行政区',
  香港特别行政区: '香港特别行政区',
  澳门: '澳门特别行政区',
  澳门特别行政区: '澳门特别行政区',
} as const

const EXISTING_ADMINISTRATIVE_SUFFIXES = [
  '特别行政区',
  '自治区',
  '自治州',
  '自治县',
  '自治旗',
  '地区',
  '开发区',
  '高新区',
  '风景区',
  '管理区',
  '园区',
  '工业园',
  '新区',
  '社区',
  '街道',
  '苏木',
  '嘎查',
  '乡',
  '镇',
  '市',
  '区',
  '县',
  '旗',
  '盟',
] as const

const DISTRICT_LEVEL_SUFFIX_RULES = [
  { pattern: /[东西南北中]湖$/, suffix: '区' },
  { pattern: /[东西南北中]城$/, suffix: '区' },
  { pattern: /[东西南北中]乡$/, suffix: '区' },
  { pattern: /[东西南北中]关$/, suffix: '区' },
  { pattern: /[东西南北中]港$/, suffix: '区' },
  { pattern: /[东西南北中]山$/, suffix: '区' },
  { pattern: /[东西南北中]川$/, suffix: '区' },
  { pattern: /山$/, suffix: '区' },
  { pattern: /湖$/, suffix: '区' },
  { pattern: /湾$/, suffix: '区' },
  { pattern: /口$/, suffix: '区' },
  { pattern: /门$/, suffix: '区' },
  { pattern: /江$/, suffix: '区' },
  { pattern: /河$/, suffix: '区' },
  { pattern: /沙市$/, suffix: '区' },
  { pattern: /洪山$/, suffix: '区' },
] as const

export const normalizeCityInput = (value: string) => value.trim().replace(/\s+/g, '')

const hasAdministrativeSuffix = (value: string) =>
  EXISTING_ADMINISTRATIVE_SUFFIXES.some((suffix) => value.endsWith(suffix))

const resolveSpecialAliasCanonicalName = (value: string) =>
  SPECIAL_ALIAS_CANONICAL_NAMES[value as keyof typeof SPECIAL_ALIAS_CANONICAL_NAMES]

const appendAdministrativeSuffix = (value: string) => {
  const specialAdministrativeRegionName =
    SPECIAL_ADMINISTRATIVE_REGION_NAMES[value as keyof typeof SPECIAL_ADMINISTRATIVE_REGION_NAMES]
  if (specialAdministrativeRegionName) {
    return specialAdministrativeRegionName
  }

  const matchedDistrictRule = DISTRICT_LEVEL_SUFFIX_RULES.find((rule) => rule.pattern.test(value))
  if (matchedDistrictRule) {
    return `${value}${matchedDistrictRule.suffix}`
  }

  if (!value || hasAdministrativeSuffix(value)) {
    return value
  }

  if (CITY_LEVEL_CANONICAL_NAMES.has(value)) {
    return `${value}市`
  }

  return value
}

export const resolveCanonicalCityName = (value: string) => {
  const normalizedValue = normalizeCityInput(value)
  if (!normalizedValue) {
    return ''
  }

  const specialAliasCanonicalName = resolveSpecialAliasCanonicalName(normalizedValue)
  if (specialAliasCanonicalName) {
    return specialAliasCanonicalName
  }

  return appendAdministrativeSuffix(normalizedValue)
}

export const resolveDisplayCityName = (value: string) => resolveCanonicalCityName(value)

export const isEquivalentCityName = (left: string, right: string) =>
  resolveCanonicalCityName(left).toLocaleLowerCase()
  === resolveCanonicalCityName(right).toLocaleLowerCase()

export const mapCityItemToDisplay = <T extends Pick<CityItem, 'cityName'>>(item: T) => ({
  ...item,
  displayCityName: resolveDisplayCityName(item.cityName),
})
