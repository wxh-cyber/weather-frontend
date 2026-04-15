import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import List from '@/views/cities/List.vue'
import CityList from '@/components/city-list/CityList.vue'
import { useCityStore } from '@/store/city'
import { deleteCity, getCityList } from '@/service/city'

vi.mock('@/service/city', () => ({
  getCityList: vi.fn(),
  createCity: vi.fn(),
  updateCity: vi.fn(),
  deleteCity: vi.fn(),
}))

const mockedGetCityList = vi.mocked(getCityList)
const mockedDeleteCity = vi.mocked(deleteCity)

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
  props: ['modelValue', 'modalClass', 'appendToBody'],
  emits: ['update:modelValue'],
  template: `
    <div
      v-if="modelValue"
      class="el-dialog-stub"
      :data-modal-class="modalClass"
      :data-append-to-body="appendToBody ? 'true' : 'false'"
      v-bind="$attrs"
    >
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
    mockedDeleteCity.mockReset()
    mockedGetCityList.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [
        { cityName: '武汉市', weatherText: '晴', temperature: '26°C' },
        { cityName: '上海市', weatherText: '多云', temperature: '22°C' },
      ],
    })
  })

  const mountList = async (options?: { stubCityList?: boolean }) => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(List, {
      global: {
        plugins: [pinia],
        stubs: {
          CityList: options?.stubCityList === false ? false : true,
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

  it('refreshes city list from backend on mount even when pinia already has cached cities', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const cityStore = useCityStore(pinia)
    cityStore.setCities([{ cityName: '旧缓存城市', weatherText: '阴', temperature: '18°C' }])

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

    expect(mockedGetCityList).toHaveBeenCalledWith('')
    expect(cityStore.cities).toEqual([
      { cityName: '武汉市', weatherText: '晴', temperature: '26°C' },
      { cityName: '上海市', weatherText: '多云', temperature: '22°C' },
    ])
    expect(wrapper.text()).not.toContain('旧缓存城市')
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

  it('selects all cities from the full city list through the select-all button', async () => {
    const wrapper = await mountList()
    const selectAllButton = wrapper.findAll('button').find((button) => button.text() === '全选')

    await selectAllButton?.trigger('click')

    expect(wrapper.findAll('.delete-tag-chip')).toHaveLength(2)
    expect(wrapper.text()).toContain('2 项待处理')
    const checkedInputs = wrapper.findAll('.cyber-checkbox').filter((input) => (input.element as HTMLInputElement).checked)
    expect(checkedInputs).toHaveLength(2)
  })

  it('shows empty fallback when city list is empty', async () => {
    mockedGetCityList.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [],
    })

    const wrapper = await mountList({ stubCityList: false })

    expect(wrapper.findAll('.delete-city-row')).toHaveLength(0)
    expect(wrapper.find('[data-delete-city-empty="true"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('当前城市列表中还没有城市！')
    expect(wrapper.find('[data-city-list-empty="true"]').exists()).toBe(true)
    expect(wrapper.findComponent(CityList).text()).toContain('当前城市列表中还没有城市！')
    expect(wrapper.findAllComponents({ name: 'CityListItem' })).toHaveLength(0)
  })

  it('keeps filter-empty copy when cities exist but no filter result matches', async () => {
    const wrapper = await mountList()
    const filterInput = wrapper.find('input[placeholder="筛选删除列表（仅过滤显示）"]')

    await filterInput.setValue('杭州')

    expect(wrapper.findAll('.delete-city-row')).toHaveLength(0)
    expect(wrapper.text()).toContain('当前筛选条件下无城市')
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

    const selectAllButton = wrapper.findAll('button').find((button) => button.text() === '全选')
    await selectAllButton?.trigger('click')

    const batchBtn = wrapper.findAll('button').find((button) => button.text() === '批量删除')
    await batchBtn?.trigger('click')
    expect(wrapper.text()).toContain('批量删除确认')
    expect(wrapper.text()).toContain('武汉市')
    expect(wrapper.text()).toContain('上海市')
    const dialog = wrapper.find('.el-dialog-stub')
    expect(dialog.exists()).toBe(true)
    expect(dialog.classes()).toContain('delete-confirm-dialog')
    expect(dialog.attributes('data-modal-class')).toBe('delete-confirm-overlay')
    expect(dialog.attributes('data-append-to-body')).not.toBeUndefined()
    expect(dialog.attributes('align-center')).not.toBeUndefined()

    const confirmBtn = wrapper.findAll('button').find((button) => button.text() === '确认删除')
    await confirmBtn?.trigger('click')
    await flushPromises()

    expect(deleteSpy).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('失败项：上海市')
  })

  it('does not report failed items when sequential batch deletes all succeed after store refreshes', async () => {
    const wrapper = await mountList()
    mockedDeleteCity
      .mockResolvedValueOnce({
        code: 0,
        message: '删除成功',
        data: [{ cityName: '上海市', weatherText: '多云', temperature: '22°C' }],
      })
      .mockResolvedValueOnce({
        code: 0,
        message: '删除成功',
        data: [],
      })

    const selectAllButton = wrapper.findAll('button').find((button) => button.text() === '全选')
    await selectAllButton?.trigger('click')

    const batchBtn = wrapper.findAll('button').find((button) => button.text() === '批量删除')
    await batchBtn?.trigger('click')

    const confirmBtn = wrapper.findAll('button').find((button) => button.text() === '确认删除')
    await confirmBtn?.trigger('click')
    await flushPromises()

    expect(mockedDeleteCity).toHaveBeenNthCalledWith(1, '武汉市')
    expect(mockedDeleteCity).toHaveBeenNthCalledWith(2, '上海市')
    expect(wrapper.text()).toContain('批量删除完成，共删除 2 项')
    expect(wrapper.text()).not.toContain('失败项：')
  })

  it('does not open batch delete confirm dialog when city list is empty', async () => {
    mockedGetCityList.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [],
    })

    const wrapper = await mountList({ stubCityList: false })
    const selectAllButton = wrapper.findAll('button').find((button) => button.text() === '全选')
    const batchBtn = wrapper.findAll('button').find((button) => button.text() === '批量删除')

    expect(selectAllButton?.attributes('disabled')).not.toBeUndefined()
    expect(batchBtn?.attributes('disabled')).not.toBeUndefined()
    await batchBtn?.trigger('click')
    await flushPromises()

    expect(wrapper.find('.el-dialog-stub').exists()).toBe(false)
  })

  it('renders error text when store has error', async () => {
    const wrapper = await mountList()
    const cityStore = useCityStore()
    cityStore.setError('测试错误')
    await flushPromises()

    expect(wrapper.text()).toContain('测试错误')
  })
})
