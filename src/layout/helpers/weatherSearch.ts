export type WeatherSearchSubmitHandler = (keyword: string) => Promise<void>

export const weatherSearchSubmitKey = Symbol('weatherSearchSubmit')
