<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import CityList from '@/components/List/CityList.vue'
import { useCityStore } from '@/store/city'

const cityStore = useCityStore()
const cityItems = computed(() => cityStore.cities)
const loading = computed(() => cityStore.loading)
const error = computed(() => cityStore.error)
const keyword = ref('')
const newCityName = ref('')
const editingCityName = ref('')
const editingNewCityName = ref('')
const deletingCityName = ref('')
const selectedDeleteCities = ref<string[]>([])
const deleteTagCities = ref<string[]>([])
const batchConfirmVisible = ref(false)
const batchDeleteSummary = ref('')
const singleDeletingName = ref('')

const cityNameOptions = computed(() =>
  cityItems.value.map((item) => ({
    label: item.cityName,
    value: item.cityName,
  })),
)

const handleSearch = async () => {
  await cityStore.fetchCities(keyword.value)
}

const handleCreate = async () => {
  const success = await cityStore.createCityByName(newCityName.value)
  if (success) {
    newCityName.value = ''
  }
}

const handleRename = async () => {
  const success = await cityStore.renameCity(editingCityName.value, editingNewCityName.value)
  if (success) {
    editingCityName.value = ''
    editingNewCityName.value = ''
  }
}

const handleDelete = async () => {
  const success = await cityStore.deleteCityByName(deletingCityName.value)
  if (success) {
    selectedDeleteCities.value = selectedDeleteCities.value.filter((name) => name !== deletingCityName.value)
    deleteTagCities.value = deleteTagCities.value.filter((name) => name !== deletingCityName.value)
    deletingCityName.value = ''
    batchDeleteSummary.value = '单项删除完成'
  }
}

const syncDeleteTags = () => {
  deleteTagCities.value = [...selectedDeleteCities.value]
  deletingCityName.value = selectedDeleteCities.value[selectedDeleteCities.value.length - 1] ?? ''
}

const setCitySelected = (cityName: string, checked: boolean) => {
  if (checked) {
    if (!selectedDeleteCities.value.includes(cityName)) {
      selectedDeleteCities.value = [...selectedDeleteCities.value, cityName]
    }
    syncDeleteTags()
    return
  }

  selectedDeleteCities.value = selectedDeleteCities.value.filter((name) => name !== cityName)
  syncDeleteTags()
}

const toggleCitySelection = (cityName: string) => {
  setCitySelected(cityName, !selectedDeleteCities.value.includes(cityName))
}

const onDeleteCheckboxChange = (cityName: string, event: Event) => {
  const checked = (event.target as HTMLInputElement).checked
  setCitySelected(cityName, checked)
}

const removeDeleteTag = (cityName: string) => {
  setCitySelected(cityName, false)
}

const addDeleteTagFromSelect = () => {
  if (!deletingCityName.value) return
  setCitySelected(deletingCityName.value, true)
}

const handleSingleDelete = async (cityName: string) => {
  singleDeletingName.value = cityName
  const success = await cityStore.deleteCityByName(cityName)
  if (success) {
    selectedDeleteCities.value = selectedDeleteCities.value.filter((name) => name !== cityName)
    syncDeleteTags()
    batchDeleteSummary.value = `已删除 ${cityName}`
  }
  singleDeletingName.value = ''
}

const openBatchDeleteConfirm = () => {
  if (selectedDeleteCities.value.length === 0) return
  batchConfirmVisible.value = true
}

const handleBatchDelete = async () => {
  const targets = [...selectedDeleteCities.value]
  if (targets.length === 0) return

  batchConfirmVisible.value = false
  const successCities: string[] = []
  const failedCities: string[] = []

  for (const cityName of targets) {
    const success = await cityStore.deleteCityByName(cityName)
    if (success) {
      successCities.push(cityName)
    } else {
      failedCities.push(cityName)
    }
  }

  selectedDeleteCities.value = selectedDeleteCities.value.filter((name) => !successCities.includes(name))
  syncDeleteTags()

  if (failedCities.length === 0) {
    batchDeleteSummary.value = `批量删除完成，共删除 ${successCities.length} 项`
    return
  }

  batchDeleteSummary.value =
    failedCities.length > 0
      ? `已删除 ${successCities.length} 项，失败项：${failedCities.join('、')}`
      : '批量删除未成功'
}

watch(editingCityName, (selectedName) => {
  if (!selectedName) return
  editingNewCityName.value = selectedName
})

watch(
  cityItems,
  (items) => {
    const cityNameSet = new Set(items.map((item) => item.cityName))
    selectedDeleteCities.value = selectedDeleteCities.value.filter((name) => cityNameSet.has(name))
    syncDeleteTags()
    if (deletingCityName.value && !cityNameSet.has(deletingCityName.value)) {
      deletingCityName.value = ''
    }
  },
  { deep: true },
)

onMounted(async () => {
  await cityStore.ensureCitiesLoaded()
})
</script>

<template>
  <main class="list-page">
    <div class="cyber-grid-layer" />
    <section class="city-card">
      <h1>我的城市</h1>
      <p>左侧为城市名称，右侧实时展示天气与温度。</p>
      <div class="search-bar">
        <el-input
          v-model="keyword"
          class="search-input"
          placeholder="输入城市名称，按回车搜索"
          clearable
          @keydown.enter="handleSearch"
        />
        <el-button class="cyber-action-btn" type="primary" :loading="loading" @click="handleSearch">
          搜索
        </el-button>
      </div>
      <section class="city-manage-panel">
        <h2>城市管理中枢</h2>
        <div class="city-manage-grid">
          <article class="manage-card">
            <p class="manage-title">新增城市</p>
            <el-input
              v-model="newCityName"
              class="manage-input"
              placeholder="输入要新增的城市名称"
              clearable
              @keydown.enter="handleCreate"
            />
            <el-button class="cyber-action-btn" :loading="loading" @click="handleCreate">新增</el-button>
          </article>
          <article class="manage-card">
            <p class="manage-title">修改城市</p>
            <el-select
              v-model="editingCityName"
              class="manage-select"
              popper-class="cyber-select-popper"
              placeholder="选择待修改城市"
              filterable
              clearable
            >
              <el-option
                v-for="option in cityNameOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            <el-input
              v-model="editingNewCityName"
              class="manage-input"
              placeholder="输入新的城市名称"
              clearable
              @keydown.enter="handleRename"
            />
            <el-button class="cyber-action-btn" :loading="loading" @click="handleRename">更新</el-button>
          </article>
          <article class="manage-card">
            <p class="manage-title">删除城市</p>
            <div class="delete-tags-box">
              <p v-if="deleteTagCities.length === 0" class="delete-tags-empty">请选择下方城市加入删除队列</p>
              <button
                v-for="cityName in deleteTagCities"
                :key="cityName"
                type="button"
                class="delete-tag-chip"
                @click="removeDeleteTag(cityName)"
              >
                <span class="delete-tag-chip__name">{{ cityName }}</span>
                <span class="delete-tag-chip__close">×</span>
              </button>
            </div>
            <el-select
              v-model="deletingCityName"
              class="manage-select"
              popper-class="cyber-select-popper"
              placeholder="从下拉框加入删除队列"
              filterable
              clearable
            >
              <el-option
                v-for="option in cityNameOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            <el-button class="cyber-action-btn" :loading="loading" @click="addDeleteTagFromSelect">加入队列</el-button>
            <div class="delete-city-list">
              <article
                v-for="item in cityItems"
                :key="item.cityName"
                class="delete-city-row"
                :class="{ 'is-selected': selectedDeleteCities.includes(item.cityName) }"
                @click="toggleCitySelection(item.cityName)"
              >
                <label class="delete-city-checkbox-wrap" @click.stop>
                  <input
                    class="cyber-checkbox"
                    type="checkbox"
                    :checked="selectedDeleteCities.includes(item.cityName)"
                    @change="onDeleteCheckboxChange(item.cityName, $event)"
                  />
                  <span class="delete-city-name">{{ item.cityName }}</span>
                </label>
                <el-button
                  class="cyber-action-btn cyber-danger-btn cyber-row-delete"
                  :loading="loading && singleDeletingName === item.cityName"
                  @click.stop="handleSingleDelete(item.cityName)"
                >
                  单独删除
                </el-button>
              </article>
            </div>
            <div class="delete-action-row">
              <el-button class="cyber-action-btn cyber-danger-btn" :loading="loading" @click="handleDelete">
                按选框删除
              </el-button>
              <el-button
                class="cyber-action-btn cyber-danger-btn"
                :disabled="selectedDeleteCities.length === 0"
                :loading="loading"
                @click="openBatchDeleteConfirm"
              >
                批量删除
              </el-button>
            </div>
            <p v-if="batchDeleteSummary" class="batch-delete-summary">
              {{ batchDeleteSummary }}
            </p>
          </article>
        </div>
      </section>
      <el-dialog v-model="batchConfirmVisible" class="delete-confirm-dialog" width="460px" :show-close="false">
        <template #header>
          <h3 class="delete-dialog-title">批量删除确认</h3>
        </template>
        <p class="delete-dialog-text">即将删除以下城市：</p>
        <div class="delete-dialog-list">
          <span v-for="cityName in selectedDeleteCities" :key="cityName" class="delete-dialog-city">
            {{ cityName }}
          </span>
        </div>
        <p class="delete-dialog-tip">失败项将自动跳过，不影响其他项删除。</p>
        <template #footer>
          <div class="delete-dialog-footer">
            <el-button class="cyber-action-btn" @click="batchConfirmVisible = false">取消</el-button>
            <el-button class="cyber-action-btn cyber-danger-btn" :loading="loading" @click="handleBatchDelete">
              确认删除
            </el-button>
          </div>
        </template>
      </el-dialog>
      <p v-if="error" class="error-text">{{ error }}</p>
      <CityList :items="cityItems" />
    </section>
  </main>
</template>

<style scoped>
.list-page {
  position: relative;
  min-height: calc(100vh - var(--app-nav-height));
  padding: 26px 16px 34px;
  background:
    radial-gradient(circle at 15% 12%, rgba(0, 255, 255, 0.18), transparent 38%),
    radial-gradient(circle at 82% 88%, rgba(255, 0, 153, 0.14), transparent 46%),
    linear-gradient(180deg, #051028 0%, #020816 100%);
}

.city-card {
  position: relative;
  z-index: 1;
  width: min(980px, 100%);
  margin: 0 auto;
  border-radius: 16px;
  border: 1px solid var(--cyber-glass-border);
  background: var(--cyber-glass-bg);
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.1),
    var(--cyber-glow-md);
  backdrop-filter: blur(6px);
  padding: 24px;
}

.city-card h1 {
  margin: 0;
  color: var(--cyber-cyan);
  text-shadow: 0 0 10px rgba(117, 241, 255, 0.48);
}

.city-card p {
  margin-top: 10px;
  color: var(--cyber-text-muted);
}

.search-bar {
  margin-top: 14px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.search-input :deep(.el-input__wrapper) {
  background: rgba(5, 20, 45, 0.6);
  box-shadow: inset 0 0 0 1px rgba(117, 241, 255, 0.24);
}

.city-manage-panel {
  margin-top: 16px;
  border: 1px solid rgba(117, 241, 255, 0.24);
  background: rgba(3, 16, 40, 0.5);
  box-shadow: inset 0 0 12px rgba(117, 241, 255, 0.15);
  border-radius: 14px;
  padding: 14px;
}

.city-manage-panel h2 {
  margin: 0;
  color: var(--cyber-cyan);
  font-size: 16px;
  text-shadow: 0 0 10px rgba(117, 241, 255, 0.34);
}

.city-manage-grid {
  margin-top: 12px;
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.manage-card {
  border: 1px solid rgba(117, 241, 255, 0.2);
  background: rgba(4, 16, 39, 0.58);
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 8px;
}

.manage-title {
  margin: 0;
  color: var(--cyber-text-muted);
  font-size: 13px;
}

.manage-input :deep(.el-input__wrapper),
.manage-select :deep(.el-select__wrapper) {
  background: rgba(5, 20, 45, 0.65);
  box-shadow: inset 0 0 0 1px rgba(117, 241, 255, 0.24);
}

.manage-select :deep(.el-select__wrapper.is-focused) {
  box-shadow:
    inset 0 0 0 1px rgba(117, 241, 255, 0.42),
    0 0 10px rgba(117, 241, 255, 0.25);
}

:deep(.cyber-select-popper.el-popper) {
  border: 1px solid rgba(117, 241, 255, 0.46);
  background: rgba(2, 14, 34, 0.95);
  box-shadow:
    inset 0 0 14px rgba(117, 241, 255, 0.18),
    0 0 16px rgba(117, 241, 255, 0.2);
}

:deep(.cyber-select-popper .el-select-dropdown__item) {
  color: var(--cyber-text-muted);
}

:deep(.cyber-select-popper .el-select-dropdown__item.is-hovering),
:deep(.cyber-select-popper .el-select-dropdown__item:hover) {
  background: rgba(0, 145, 255, 0.18);
  color: var(--cyber-text);
}

:deep(.cyber-select-popper .el-select-dropdown__item.is-selected) {
  color: var(--cyber-cyan);
  text-shadow: 0 0 8px rgba(117, 241, 255, 0.45);
}

.cyber-action-btn {
  min-height: 40px;
  border: 1px solid rgba(117, 241, 255, 0.64);
  border-radius: 10px;
  padding: 0 18px !important;
  background: linear-gradient(135deg, rgba(0, 214, 255, 0.2), rgba(255, 0, 153, 0.16));
  color: var(--cyber-cyan);
  box-shadow:
    inset 0 0 12px rgba(117, 241, 255, 0.32),
    0 0 10px rgba(117, 241, 255, 0.18);
  transition: transform var(--cyber-ease), filter var(--cyber-ease), box-shadow var(--cyber-ease);
}

.cyber-action-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
  box-shadow:
    inset 0 0 14px rgba(117, 241, 255, 0.45),
    0 0 14px rgba(117, 241, 255, 0.24);
}

.cyber-action-btn:active {
  transform: translateY(0);
}

.cyber-action-btn :deep(span) {
  color: var(--cyber-text);
}

.cyber-danger-btn {
  border-color: rgba(255, 82, 205, 0.56);
  background: linear-gradient(135deg, rgba(255, 82, 205, 0.2), rgba(0, 145, 255, 0.14));
}

.delete-tags-box {
  min-height: 44px;
  border: 1px solid rgba(117, 241, 255, 0.2);
  border-radius: 10px;
  background: rgba(5, 20, 45, 0.38);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
}

.delete-tags-empty {
  margin: 0;
  color: var(--cyber-text-muted);
  font-size: 12px;
  opacity: 0.9;
}

.delete-tag-chip {
  border: 1px solid rgba(117, 241, 255, 0.38);
  border-radius: 999px;
  background: rgba(3, 30, 64, 0.64);
  color: var(--cyber-cyan);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  font-size: 12px;
  transition: border-color var(--cyber-ease), box-shadow var(--cyber-ease), transform var(--cyber-ease);
}

.delete-tag-chip:hover {
  border-color: rgba(255, 82, 205, 0.54);
  box-shadow: 0 0 10px rgba(255, 82, 205, 0.28);
  transform: translateY(-1px);
}

.delete-tag-chip__close {
  color: #ff9ad7;
  font-weight: 600;
}

.delete-city-list {
  border: 1px solid rgba(117, 241, 255, 0.2);
  border-radius: 12px;
  background: rgba(5, 20, 45, 0.36);
  max-height: 220px;
  overflow: auto;
  padding: 6px;
  display: grid;
  gap: 6px;
}

.delete-city-row {
  border: 1px solid rgba(117, 241, 255, 0.16);
  border-radius: 10px;
  background: rgba(4, 16, 38, 0.66);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
  transition: border-color var(--cyber-ease), box-shadow var(--cyber-ease), transform var(--cyber-ease);
}

.delete-city-row:hover {
  transform: translateY(-1px);
  border-color: rgba(117, 241, 255, 0.34);
  box-shadow: 0 0 12px rgba(117, 241, 255, 0.2);
}

.delete-city-row.is-selected {
  border-color: rgba(117, 241, 255, 0.52);
  box-shadow:
    inset 0 0 10px rgba(117, 241, 255, 0.2),
    0 0 12px rgba(117, 241, 255, 0.28);
}

.delete-city-checkbox-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--cyber-text);
  flex: 1;
}

.cyber-checkbox {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--cyber-cyan);
  filter: drop-shadow(0 0 5px rgba(117, 241, 255, 0.4));
}

.delete-city-name {
  color: var(--cyber-text);
  text-shadow: 0 0 8px rgba(117, 241, 255, 0.18);
}

.cyber-row-delete {
  min-height: 32px;
  padding: 0 10px !important;
  font-size: 12px;
}

.delete-action-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.batch-delete-summary {
  margin: 0;
  color: var(--cyber-cyan);
  font-size: 12px;
  text-shadow: 0 0 8px rgba(117, 241, 255, 0.3);
}

:deep(.delete-confirm-dialog .el-dialog) {
  border: 1px solid rgba(117, 241, 255, 0.48);
  border-radius: 14px;
  background: rgba(4, 14, 34, 0.92);
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.12),
    0 0 18px rgba(117, 241, 255, 0.24);
}

.delete-dialog-title {
  margin: 0;
  color: var(--cyber-cyan);
  font-size: 18px;
}

.delete-dialog-text,
.delete-dialog-tip {
  margin: 0;
  color: var(--cyber-text-muted);
}

.delete-dialog-list {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.delete-dialog-city {
  border: 1px solid rgba(117, 241, 255, 0.34);
  border-radius: 999px;
  padding: 2px 8px;
  color: var(--cyber-cyan);
  background: rgba(3, 24, 56, 0.6);
}

.delete-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.error-text {
  margin-top: 10px;
  color: #ff88b8;
}

@media (max-width: 640px) {
  .list-page {
    min-height: calc(100vh - var(--app-nav-height-mobile));
    padding-top: 20px;
  }

  .search-bar {
    grid-template-columns: 1fr;
  }

  .city-manage-grid {
    grid-template-columns: 1fr;
  }

  .delete-action-row {
    grid-template-columns: 1fr;
  }
}
</style>
