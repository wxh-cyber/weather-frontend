import sunnyIcon from '@/assets/icons/weather/sunny.svg'
import cloudyIcon from '@/assets/icons/weather/cloudy.svg'
import partlyCloudyIcon from '@/assets/icons/weather/partly-cloudy.svg'
import rainIcon from '@/assets/icons/weather/rain.svg'
import snowIcon from '@/assets/icons/weather/snow.svg'
import nightCloudyIcon from '@/assets/icons/weather/night-cloudy.svg'
import unknownIcon from '@/assets/icons/weather/unknown.svg'

export type WeatherIconKey =
  | 'sunny'
  | 'cloudy'
  | 'partly-cloudy'
  | 'rainy'
  | 'snowy'
  | 'night-cloudy'
  | 'unknown'

type WeatherIconMeta = {
  src: string
  alt: string
}

const weatherIconMap: Record<WeatherIconKey, WeatherIconMeta> = {
  sunny: { src: sunnyIcon, alt: '晴天图标' },
  cloudy: { src: cloudyIcon, alt: '多云图标' },
  'partly-cloudy': { src: partlyCloudyIcon, alt: '晴间多云图标' },
  rainy: { src: rainIcon, alt: '雨天图标' },
  snowy: { src: snowIcon, alt: '雪天图标' },
  'night-cloudy': { src: nightCloudyIcon, alt: '夜间多云图标' },
  unknown: { src: unknownIcon, alt: '未知天气图标' },
}

export const getWeatherIcon = (key: WeatherIconKey): WeatherIconMeta => {
  return weatherIconMap[key] ?? weatherIconMap.unknown
}
