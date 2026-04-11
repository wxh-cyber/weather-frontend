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
    '<input :value="modelValue" v-bind="$attrs" @input="$emit(\'update:modelValue\', $event.target.value)" />',
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
    '<select :value="modelValue" v-bind="$attrs" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
}

const ElOptionStub = {
  props: ['label', 'value'],
  template: '<option :value="value">{{ label }}</option>',
}

const ElDialogStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: `
    <div v-if="modelValue" class="el-dialog-stub" v-bind="$attrs">
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
    expect(wrapper.text()).toContain('城市搜索')
    expect(wrapper.findAll('.cyber-action-btn').length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('新增城市')
    expect(wrapper.text()).toContain('修改默认城市')
    expect(wrapper.text()).toContain('删除城市')
    expect(wrapper.findAll('.manage-select').length).toBe(1)
    expect(wrapper.find('input[placeholder="输入新的城市名称"]').exists()).toBe(false)
  })

  it('triggers create and set default actions from manage panel', async () => {
    const wrapper = await mountList()
    const cityStore = useCityStore()
    const createSpy = vi.spyOn(cityStore, 'createCityByName').mockResolvedValue(true)
    const setDefaultSpy = vi.spyOn(cityStore, 'setDefaultCityByName').mockResolvedValue(true)

    const createInput = wrapper.find('input[placeholder="输入要新增的城市名称"]')
    await createInput.setValue('深圳市')
    const defaultSelect = wrapper.findAll('select')[0]
    await defaultSelect?.setValue('上海市')
    const buttons = wrapper.findAll('button')
    await buttons.find((item) => item.text() === '新增')?.trigger('click')
    await buttons.find((item) => item.text() === '设为默认')?.trigger('click')

    expect(createSpy).toHaveBeenCalledWith('深圳市')
    expect(setDefaultSpy).toHaveBeenCalledWith('上海市')
  })

  it('syncs checkbox selection to tag chips and allows chip removal', async () => {
    const wrapper = await mountList()
    const rows = wrapper.findAll('.delete-city-row')
    expect(rows.length).toBeGreaterThan(0)

    await rows[0]!.trigger('click')
    expect(wrapper.text()).toContain('武汉市')
    expect(wrapper.findAll('.delete-tag-chip').length).toBe(1)

    await wrapper.find('.delete-tag-chip').trigger('click')
    expect(wrapper.findAll('.delete-tag-chip').length).toBe(0)
  })

  it('filters delete city list by keyword input', async () => {
    const wrapper = await mountList()
    const filterInput = wrapper.find('input[placeholder="筛选删除列表（仅过滤显示）"]')

    await filterInput.setValue('武汉')

    const deleteNames = wrapper.findAll('.delete-city-row .delete-city-name').map((node) => node.text())
    expect(deleteNames).toEqual(['武汉市'])
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
    expect(rows.length).toBeGreaterThanOrEqual(2)
    await rows[0]!.trigger('click')
    await rows[1]!.trigger('click')

    const batchBtn = wrapper.findAll('button').find((button) => button.text() === '批量删除')
    await batchBtn?.trigger('click')
    expect(wrapper.text()).toContain('批量删除确认')
    const dialog = wrapper.find('.el-dialog-stub')
    expect(dialog.exists()).toBe(true)
    expect(dialog.classes()).toContain('delete-confirm-dialog')
    expect(dialog.attributes('align-center')).not.toBeUndefined()

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
