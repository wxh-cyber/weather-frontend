import { describe, expect, it, vi } from 'vitest'
import { deleteUserCities } from './city'
import http from './http'

vi.mock('./http', () => ({
  default: {
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedHttp = http as unknown as {
  post: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

describe('city service', () => {
  it('deleteUserCities should use post batch-delete instead of delete body', async () => {
    mockedHttp.post.mockResolvedValue({
      code: 0,
      message: '删除成功',
      data: [],
      failedCityIds: [],
    })

    await deleteUserCities(['city-1', 'city-2'])

    expect(mockedHttp.post).toHaveBeenCalledWith('/user/cities/batch-delete', {
      cityIds: ['city-1', 'city-2'],
    })
    expect(mockedHttp.delete).not.toHaveBeenCalled()
  })
})
