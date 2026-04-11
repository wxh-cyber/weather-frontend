import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import List from '@/views/List.vue'
import { useCityStore } from '@/store/city'
import { getCityList } from '@/service/city'

vi.mock('@/service/city', () => ({
  getCityList: vi.fn(),
  createCity: vi.fn(),
  updateCity: vi.fn(),
  deleteCity: vi.fn(),
}))

const mockedGetCityList = vi.mocked(getCityList)

const ElInputStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template:
    '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
}

const ElButtonStub = {
  props: ['loading'],
  emits: ['click'],
  template:
    '<button :class="$attrs.class" :disabled="loading" @click="$emit(\'click\', $event)"><slot /></button>',
}

const ElSelectStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template:
    '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
}

const ElOptionStub = {
  props: ['label', 'value'],
  template: '<option :value="value">{{ label }}</option>',
}

const ElDialogStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: `
    <div v-if="modelValue" class="el-dialog-stub">
      <slot name="header" />
      <slot />
      <slot name="footer" />
    </div>
  `,
}

describe('List view', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mockedGetCityList.mockReset()
    mockedGetCityList.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [
        { cityName: '武汉市', weatherText: '晴', temperature: '26°C' },
        { cityName: '上海市', weatherText: '多云', temperature: '22°C' },
      ],
    })
  })

  const mountList = async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(List, {
      global: {
        plugins: [pinia],
        stubs: {
          CityList: true,
          'el-input': ElInputStub,
          'el-button': ElButtonStub,
          'el-select': ElSelectStub,
          'el-option': ElOptionStub,
          'el-dialog': ElDialogStub,
        },
      },
    })

    await flushPromises()
    return wrapper
  }

  it('renders manage panel and cyber-style action buttons', async () => {
    const wrapper = await mountList()

    expect(wrapper.text()).toContain('城市管理中枢')
    expect(wrapper.findAll('.cyber-action-btn').length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('新增城市')
    expect(wrapper.text()).toContain('修改城市')
    expect(wrapper.text()).toContain('删除城市')
    expect(wrapper.findAll('.manage-select').length).toBeGreaterThan(0)
  })

  it('triggers create and rename actions from manage panel', async () => {
    const wrapper = await mountList()
    const cityStore = useCityStore()
    const createSpy = vi.spyOn(cityStore, 'createCityByName').mockResolvedValue(true)
    const renameSpy = vi.spyOn(cityStore, 'renameCity').mockResolvedValue(true)

    await wrapper.findAll('input')[1]?.setValue('深圳市')
    const buttons = wrapper.findAll('button')
    await buttons.find((item) => item.text() === '新增')?.trigger('click')
    await buttons.find((item) => item.text() === '更新')?.trigger('click')

    expect(createSpy).toHaveBeenCalled()
    expect(renameSpy).toHaveBeenCalled()
  })

  it('syncs checkbox selection to tag chips and allows chip removal', async () => {
    const wrapper = await mountList()
    const rows = wrapper.findAll('.delete-city-row')

    await rows[0].trigger('click')
    expect(wrapper.text()).toContain('武汉市')
    expect(wrapper.findAll('.delete-tag-chip').length).toBe(1)

    await wrapper.find('.delete-tag-chip').trigger('click')
    expect(wrapper.findAll('.delete-tag-chip').length).toBe(0)
  })

  it('triggers single delete from each row button', async () => {
    const wrapper = await mountList()
    const cityStore = useCityStore()
    const deleteSpy = vi.spyOn(cityStore, 'deleteCityByName').mockResolvedValue(true)

    const singleDeleteButton = wrapper.findAll('button').find((button) => button.text() === '单独删除')
    await singleDeleteButton?.trigger('click')

    expect(deleteSpy).toHaveBeenCalledWith('武汉市')
  })

  it('opens batch delete confirm dialog and deletes selected items sequentially', async () => {
    const wrapper = await mountList()
    const cityStore = useCityStore()
    const deleteSpy = vi.spyOn(cityStore, 'deleteCityByName').mockImplementation(async (cityName: string) => {
      return cityName !== '上海市'
    })

    const rows = wrapper.findAll('.delete-city-row')
    await rows[0].trigger('click')
    await rows[1].trigger('click')

    const batchBtn = wrapper.findAll('button').find((button) => button.text() === '批量删除')
    await batchBtn?.trigger('click')
    expect(wrapper.text()).toContain('批量删除确认')

    const confirmBtn = wrapper.findAll('button').find((button) => button.text() === '确认删除')
    await confirmBtn?.trigger('click')
    await flushPromises()

    expect(deleteSpy).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('失败项：上海市')
  })

  it('renders error text when store has error', async () => {
    const wrapper = await mountList()
    const cityStore = useCityStore()
    cityStore.setError('测试错误')
    await flushPromises()

    expect(wrapper.text()).toContain('测试错误')
  })
})
