export type CityBackgroundVariant = 'day' | 'dusk' | 'night'

export type CityBackgroundEntry = Partial<Record<CityBackgroundVariant, string>>

const rawCityImages = import.meta.glob('../../assets/cities/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const variantLabelMap: Record<string, CityBackgroundVariant> = {
  昼: 'day',
  昏: 'dusk',
  夜: 'night',
}

export const parseCityBackgroundAssetPath = (path: string) => {
  const match = path.match(/\/([^/]+)（(昼|昏|夜)）\.(png|jpe?g|webp)$/i)
  if (!match) {
    return null
  }

  const cityName = match[1]
  const variantLabel = match[2]
  if (!cityName || !variantLabel) {
    return null
  }

  const variant = variantLabelMap[variantLabel]
  if (!variant) {
    return null
  }

  return {
    cityName,
    variant,
  }
}

export const buildCityBackgroundMap = (images: Record<string, string>) =>
  Object.entries(images).reduce<Record<string, CityBackgroundEntry>>((acc, [path, url]) => {
    const parsed = parseCityBackgroundAssetPath(path)
    if (!parsed) {
      return acc
    }

    if (!acc[parsed.cityName]) {
      acc[parsed.cityName] = {}
    }
    const cityEntry = acc[parsed.cityName]
    if (!cityEntry) {
      return acc
    }

    cityEntry[parsed.variant] = url
    return acc
  }, {})

const backgroundMap = buildCityBackgroundMap(rawCityImages)

export const getCityBackgroundVariant = (date = new Date()): CityBackgroundVariant => {
  const minutes = date.getHours() * 60 + date.getMinutes()

  if (minutes >= 5 * 60 && minutes < 7 * 60) {
    return 'dusk'
  }

  if (minutes >= 7 * 60 && minutes < 18 * 60) {
    return 'day'
  }

  if (minutes >= 18 * 60 && minutes < 20 * 60) {
    return 'dusk'
  }

  return 'night'
}

export const getCityBackgroundEntry = (cityName: string) => backgroundMap[cityName.trim()] ?? null

export const resolveCityBackground = (cityName: string, date = new Date()) => {
  const entry = getCityBackgroundEntry(cityName)
  if (!entry) {
    return ''
  }

  const variant = getCityBackgroundVariant(date)
  return entry[variant] ?? ''
}
