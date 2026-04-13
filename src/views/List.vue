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
const selectedDeleteCities = ref<string[]>([])
const deleteTagCities = ref<string[]>([])
const deleteFilterKeyword = ref('')
const batchConfirmVisible = ref(false)
const batchDeleteSummary = ref('')
const singleDeletingName = ref('')

const cityNameOptions = computed(() =>
  cityItems.value.map((item) => ({
    label: item.cityName,
    value: item.cityName,
  })),
)

const filteredDeleteCities = computed(() => {
  const normalizedKeyword = deleteFilterKeyword.value.trim().toLocaleLowerCase()
  if (!normalizedKeyword) {
    return cityItems.value
  }
  return cityItems.value.filter((item) => item.cityName.toLocaleLowerCase().includes(normalizedKeyword))
})

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
  const success = await cityStore.setDefaultCityByName(editingCityName.value)
  if (success) {
    editingCityName.value = ''
    batchDeleteSummary.value = '默认城市已更新'
  }
}

const syncDeleteTags = () => {
  deleteTagCities.value = [...selectedDeleteCities.value]
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

watch(
  cityItems,
  (items) => {
    const cityNameSet = new Set(items.map((item) => item.cityName))
    selectedDeleteCities.value = selectedDeleteCities.value.filter((name) => cityNameSet.has(name))
    syncDeleteTags()
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
      <section class="city-manage-panel">
        <div class="city-manage-head">
          <p class="city-manage-kicker">CITY CONTROL HUB</p>
          <h2>城市管理中枢</h2>
          <p class="city-manage-desc">检索、接入、默认置顶与删除队列统一在同一控制台中完成。</p>
        </div>
        <div class="city-manage-grid">
          <article class="manage-card search-manage-card manage-card--balanced manage-card--neon">
            <div class="manage-card-head">
              <p class="manage-title">城市搜索</p>
              <p class="manage-caption">实时检索入口</p>
            </div>
            <div class="manage-card-body">
              <el-input
                v-model="keyword"
                class="manage-input search-input"
                placeholder="输入城市名称，按回车搜索"
                clearable
                @keydown.enter="handleSearch"
              />
              <p class="manage-subtext">支持实时检索，回车可快速触发搜索</p>
            </div>
            <el-button class="cyber-action-btn" type="primary" :loading="loading" @click="handleSearch">搜索</el-button>
          </article>
          <article class="manage-card manage-card--balanced manage-card--neon">
            <div class="manage-card-head">
              <p class="manage-title">新增城市</p>
              <p class="manage-caption">扩展城市列表</p>
            </div>
            <div class="manage-card-body">
              <el-input
                v-model="newCityName"
                class="manage-input"
                placeholder="输入要新增的城市名称"
                clearable
                @keydown.enter="handleCreate"
              />
              <p class="manage-subtext">将新城市接入当前城市面板，保持列表持续扩充。</p>
            </div>
            <el-button class="cyber-action-btn" :loading="loading" @click="handleCreate">新增</el-button>
          </article>
          <article class="manage-card manage-card--balanced manage-card--neon">
            <div class="manage-card-head">
              <p class="manage-title">修改默认城市</p>
              <p class="manage-caption">调整主城市锚点</p>
            </div>
            <div class="manage-card-body">
              <el-select
                v-model="editingCityName"
                class="manage-select"
                popper-class="cyber-select-popper"
                placeholder="选择要设为默认的城市"
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
              <p class="manage-subtext default-city-tip">将所选城市置顶为默认城市（列表第一项）</p>
            </div>
            <el-button class="cyber-action-btn" :loading="loading" @click="handleRename">设为默认</el-button>
          </article>
          <article class="manage-card delete-manage-card manage-card--hero manage-card--neon">
            <div class="manage-card-head manage-card-head--danger">
              <p class="manage-title">删除城市</p>
              <p class="manage-caption">危险操作控制区</p>
            </div>
            <div class="manage-card-body manage-card-body--hero">
              <div class="delete-stage">
                <div class="delete-stage-label">
                  <span class="delete-stage-code">QUEUE://DELETE</span>
                  <span class="delete-stage-count">{{ deleteTagCities.length }} 项待处理</span>
                </div>
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
              </div>
              <div class="delete-stage">
                <div class="delete-stage-label">
                  <span class="delete-stage-code">POOL://CITY_LIST</span>
                  <span class="delete-stage-count">{{ filteredDeleteCities.length }} 项可筛选</span>
                </div>
                <el-input
                  v-model="deleteFilterKeyword"
                  class="manage-input"
                  placeholder="筛选删除列表（仅过滤显示）"
                  clearable
                />
                <div class="delete-city-list">
                  <article
                    v-for="item in filteredDeleteCities"
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
                  <p v-if="filteredDeleteCities.length === 0" class="delete-empty-text">当前筛选条件下无城市</p>
                </div>
              </div>
            </div>
            <div class="delete-action-row">
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
      <el-dialog
        v-model="batchConfirmVisible"
        class="delete-confirm-dialog"
        :show-close="false"
        align-center
      >
        <template #header>
          <div class="dcd-header">
            <div class="dcd-sys-bar">
              <span class="dcd-pulse-dot" aria-hidden="true" />
              <span class="dcd-sys-path">SYS://CITY_MANAGER/DELETE</span>
              <span class="dcd-sys-count">[ {{ selectedDeleteCities.length }} TARGETS ]</span>
            </div>
            <h3 class="dcd-title">批量删除确认</h3>
          </div>
        </template>

        <div class="dcd-body">
          <span class="dcd-scanline" aria-hidden="true" />
          <div class="dcd-warn-strip">
            <span class="dcd-warn-icon" aria-hidden="true">⚠</span>
            <span class="dcd-warn-text">以下城市数据将被永久删除，操作不可撤销</span>
          </div>
          <div class="dcd-city-grid">
            <span
              v-for="cityName in selectedDeleteCities"
              :key="cityName"
              class="dcd-city-chip"
            >
              <span class="dcd-chip-marker" aria-hidden="true" />
              {{ cityName }}
            </span>
          </div>
          <p class="dcd-confirm-text">
            确认批量删除以上
            <strong class="dcd-confirm-count">{{ selectedDeleteCities.length }}</strong>
            个城市？失败项将自动跳过。
          </p>
        </div>

        <template #footer>
          <div class="dcd-footer">
            <button class="dcd-btn dcd-btn--cancel" type="button" @click="batchConfirmVisible = false">
              取消
            </button>
            <button
              class="dcd-btn dcd-btn--danger"
              type="button"
              :disabled="loading"
              @click="handleBatchDelete"
            >
              <span v-if="loading" class="dcd-spinner" aria-hidden="true" />
              {{ loading ? '执行中…' : '确认删除' }}
            </button>
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

.search-input :deep(.el-input__wrapper) {
  background: rgba(5, 20, 45, 0.6);
  box-shadow: inset 0 0 0 1px rgba(117, 241, 255, 0.24);
}

.city-manage-panel {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  margin-top: 18px;
  border: 1px solid rgba(117, 241, 255, 0.2);
  background:
    radial-gradient(circle at top left, rgba(117, 241, 255, 0.08), transparent 32%),
    linear-gradient(145deg, rgba(255, 82, 205, 0.05), rgba(0, 214, 255, 0.04)),
    rgba(3, 16, 40, 0.54);
  box-shadow:
    inset 0 1px 0 rgba(180, 252, 255, 0.08),
    inset 0 0 16px rgba(117, 241, 255, 0.1);
  border-radius: 18px;
  padding: 18px;
  transition: box-shadow var(--cyber-ease), border-color var(--cyber-ease);
}

.city-manage-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 1px solid rgba(255, 82, 205, 0.16);
  box-shadow:
    0 0 18px rgba(255, 82, 205, 0.12),
    0 0 28px rgba(255, 82, 205, 0.08);
  pointer-events: none;
  z-index: -1;
}

.city-manage-panel:hover {
  border-color: rgba(117, 241, 255, 0.32);
  box-shadow:
    inset 0 1px 0 rgba(180, 252, 255, 0.1),
    inset 0 0 18px rgba(117, 241, 255, 0.14),
    0 0 20px rgba(255, 82, 205, 0.12);
}

.city-manage-head {
  display: grid;
  gap: 6px;
  margin-bottom: 14px;
}

.city-manage-kicker {
  margin: 0;
  color: rgba(117, 241, 255, 0.58);
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.city-manage-desc {
  margin: 0;
  max-width: 560px;
  color: rgba(195, 240, 255, 0.68);
  font-size: 13px;
  line-height: 1.5;
}

.city-manage-panel h2 {
  margin: 0;
  color: var(--cyber-cyan);
  font-size: 18px;
  letter-spacing: 0.08em;
  text-shadow: 0 0 10px rgba(117, 241, 255, 0.34);
}

.city-manage-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: 1.35fr 0.9fr 0.9fr;
  align-items: stretch;
}

.manage-card {
  position: relative;
  border: 1px solid rgba(117, 241, 255, 0.2);
  background: rgba(4, 16, 39, 0.58);
  border-radius: 16px;
  padding: 16px;
  display: grid;
  gap: 14px;
  overflow: hidden;
  transition: transform var(--cyber-ease), border-color var(--cyber-ease), box-shadow var(--cyber-ease);
}

.manage-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(117, 241, 255, 0.08), transparent 28%),
    linear-gradient(90deg, transparent, rgba(117, 241, 255, 0.06), transparent);
  opacity: 0.74;
  pointer-events: none;
}

.manage-card--balanced {
  min-height: 244px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
}

.manage-card--balanced .cyber-action-btn {
  margin-top: auto;
  width: 100%;
}

.manage-card-body {
  display: grid;
  gap: 12px;
}

.manage-card-body--hero {
  gap: 14px;
}

.manage-card-head {
  display: grid;
  gap: 4px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(117, 241, 255, 0.14);
}

.manage-card-head--danger {
  border-bottom-color: rgba(255, 82, 205, 0.18);
}

.manage-title {
  margin: 0;
  color: rgba(220, 249, 255, 0.9);
  font-size: 14px;
  min-height: 24px;
  display: flex;
  align-items: center;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.manage-caption {
  margin: 0;
  color: rgba(117, 241, 255, 0.56);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.manage-card--neon {
  border-color: rgba(117, 241, 255, 0.46);
  background:
    linear-gradient(140deg, rgba(0, 214, 255, 0.07), rgba(255, 0, 153, 0.04)),
    rgba(4, 16, 39, 0.76);
  box-shadow:
    inset 0 1px 0 rgba(180, 252, 255, 0.1),
    inset 0 0 16px rgba(117, 241, 255, 0.08),
    0 0 16px rgba(117, 241, 255, 0.12);
}

.manage-card--neon:hover {
  transform: translateY(-2px);
  border-color: rgba(117, 241, 255, 0.72);
  box-shadow:
    inset 0 1px 0 rgba(190, 253, 255, 0.14),
    inset 0 0 18px rgba(117, 241, 255, 0.12),
    0 0 20px rgba(117, 241, 255, 0.18);
}

.manage-card--neon .manage-title {
  color: var(--cyber-cyan);
  text-shadow:
    0 0 10px rgba(117, 241, 255, 0.46),
    0 0 16px rgba(255, 82, 205, 0.16);
}

.search-manage-card {
  grid-column: span 1;
}

.search-manage-card .manage-card-body {
  gap: 14px;
}

.delete-manage-card {
  grid-column: 1 / -1;
  grid-template-columns: 1fr;
}

.delete-manage-card .manage-title {
  color: #ffd6ef;
  text-shadow:
    0 0 10px rgba(255, 82, 205, 0.34),
    0 0 18px rgba(117, 241, 255, 0.14);
}

.manage-subtext {
  margin: 0;
  min-height: 38px;
  display: flex;
  align-items: center;
  color: rgba(160, 230, 247, 0.76);
  font-size: 12px;
  line-height: 1.55;
}

.default-city-tip {
  letter-spacing: 0.02em;
}

.manage-input :deep(.el-input__wrapper),
.manage-select :deep(.el-select__wrapper) {
  min-height: 44px;
  border-radius: 12px;
  background: rgba(5, 20, 45, 0.72);
  box-shadow:
    inset 0 1px 0 rgba(180, 252, 255, 0.08),
    inset 0 0 0 1px rgba(117, 241, 255, 0.2);
}

.manage-input :deep(.el-input__wrapper:hover),
.manage-select :deep(.el-select__wrapper:hover) {
  box-shadow:
    inset 0 1px 0 rgba(190, 253, 255, 0.1),
    inset 0 0 0 1px rgba(117, 241, 255, 0.34);
}

.manage-input :deep(.el-input__wrapper.is-focus),
.manage-select :deep(.el-select__wrapper.is-focused) {
  box-shadow:
    inset 0 1px 0 rgba(190, 253, 255, 0.12),
    inset 0 0 0 1px rgba(117, 241, 255, 0.42),
    0 0 10px rgba(117, 241, 255, 0.18);
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
  min-height: 42px;
  border: 1px solid rgba(117, 241, 255, 0.64);
  border-radius: 12px;
  padding: 0 18px !important;
  background:
    linear-gradient(180deg, rgba(117, 241, 255, 0.12), transparent 36%),
    linear-gradient(135deg, rgba(0, 214, 255, 0.18), rgba(255, 0, 153, 0.12));
  color: var(--cyber-cyan);
  box-shadow:
    inset 0 1px 0 rgba(180, 252, 255, 0.16),
    inset 0 0 12px rgba(117, 241, 255, 0.22),
    0 0 10px rgba(117, 241, 255, 0.14);
  font-weight: 600;
  letter-spacing: 0.08em;
  transition: transform var(--cyber-ease), filter var(--cyber-ease), box-shadow var(--cyber-ease), border-color var(--cyber-ease);
}

.cyber-action-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
  box-shadow:
    inset 0 1px 0 rgba(190, 253, 255, 0.18),
    inset 0 0 16px rgba(117, 241, 255, 0.32),
    0 0 14px rgba(117, 241, 255, 0.18);
}

.cyber-action-btn:active {
  transform: translateY(0) scale(0.995);
}

.cyber-action-btn :deep(span) {
  color: var(--cyber-text);
}

.cyber-danger-btn {
  border-color: rgba(255, 82, 205, 0.56);
  background:
    linear-gradient(180deg, rgba(255, 160, 224, 0.08), transparent 40%),
    linear-gradient(135deg, rgba(255, 82, 205, 0.18), rgba(0, 145, 255, 0.12));
}

.delete-stage {
  display: grid;
  gap: 10px;
}

.delete-stage-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 20px;
}

.delete-stage-code,
.delete-stage-count {
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.delete-stage-code {
  color: rgba(117, 241, 255, 0.58);
}

.delete-stage-count {
  color: rgba(255, 180, 225, 0.66);
}

.delete-tags-box {
  min-height: 54px;
  border: 1px solid rgba(117, 241, 255, 0.2);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(117, 241, 255, 0.06), transparent 44%),
    rgba(5, 20, 45, 0.42);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
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
  background:
    linear-gradient(180deg, rgba(117, 241, 255, 0.08), transparent 42%),
    rgba(3, 30, 64, 0.72);
  color: var(--cyber-cyan);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
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
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(117, 241, 255, 0.05), transparent 38%),
    rgba(5, 20, 45, 0.4);
  min-height: 210px;
  max-height: 260px;
  overflow: auto;
  padding: 8px;
  display: grid;
  gap: 8px;
}

.delete-city-row {
  border: 1px solid rgba(117, 241, 255, 0.16);
  border-radius: 12px;
  background:
    linear-gradient(180deg, rgba(117, 241, 255, 0.04), transparent 40%),
    rgba(4, 16, 38, 0.72);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px;
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
    inset 0 0 10px rgba(117, 241, 255, 0.18),
    0 0 12px rgba(117, 241, 255, 0.18),
    0 0 16px rgba(255, 82, 205, 0.12);
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
  letter-spacing: 0.03em;
}

.cyber-row-delete {
  min-height: 32px;
  padding: 0 12px !important;
  font-size: 12px;
}

.delete-action-row {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}

.delete-empty-text {
  margin: 8px 0;
  text-align: center;
  font-size: 12px;
  color: var(--cyber-text-muted);
}

.batch-delete-summary {
  margin: 0;
  color: var(--cyber-cyan);
  font-size: 12px;
  text-shadow: 0 0 8px rgba(117, 241, 255, 0.3);
}

/* ── Dialog shell (global — el-dialog is teleported to body) ── */
:global(.el-overlay-dialog:has(.el-dialog.delete-confirm-dialog)) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 16px !important;
  background: transparent !important;
}

:global(.el-overlay-dialog:has(.el-dialog.delete-confirm-dialog) .el-dialog__wrapper) {
  background: transparent !important;
  box-shadow: none !important;
}

:global(.el-overlay-dialog .el-dialog.delete-confirm-dialog) {
  margin: auto !important;
}

:global(.el-dialog.delete-confirm-dialog) {
  --delete-dialog-bg: rgba(2, 10, 24, 0.98);
  --el-dialog-bg-color: var(--delete-dialog-bg);
  --el-bg-color: var(--delete-dialog-bg);
  --el-fill-color-blank: var(--delete-dialog-bg);
  --el-fill-color: var(--delete-dialog-bg);
  margin: 0 !important;
  padding: 0 !important;
  width: min(480px, calc(100vw - 32px)) !important;
  border: 1px solid rgba(117, 241, 255, 0.45) !important;
  border-radius: 16px !important;
  max-height: calc(100vh - 32px) !important;
  background-color: var(--delete-dialog-bg) !important;
  background:
    radial-gradient(ellipse at 10% 0%, rgba(117, 241, 255, 0.07) 0%, transparent 50%),
    radial-gradient(ellipse at 90% 100%, rgba(255, 82, 205, 0.07) 0%, transparent 50%),
    var(--delete-dialog-bg) !important;
  box-shadow:
    inset 0 1px 0 rgba(117, 241, 255, 0.2),
    0 0 30px rgba(117, 241, 255, 0.18),
    0 0 60px rgba(0, 145, 255, 0.12),
    0 24px 48px rgba(0, 0, 0, 0.6) !important;
  overflow: hidden !important;
}

:global(.el-dialog.delete-confirm-dialog .el-dialog__header) {
  margin: 0 !important;
  padding: 0 !important;
  border-bottom: 1px solid rgba(117, 241, 255, 0.18) !important;
  background: var(--delete-dialog-bg) !important;
}

:global(.el-dialog.delete-confirm-dialog .el-dialog__body) {
  padding: 0 !important;
  background: var(--delete-dialog-bg) !important;
}

:global(.el-dialog.delete-confirm-dialog .el-dialog__footer) {
  padding: 0 !important;
  border-top: 1px solid rgba(117, 241, 255, 0.14) !important;
  background: var(--delete-dialog-bg) !important;
}

/* ── Header ─────────────────────────────────────────────── */
.dcd-header {
  padding: 14px 20px 16px;
}

.dcd-sys-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.dcd-pulse-dot {
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--cyber-cyan);
  box-shadow:
    0 0 6px var(--cyber-cyan),
    0 0 12px rgba(117, 241, 255, 0.5);
  animation: dcd-pulse 1.6s ease-in-out infinite;
}

@keyframes dcd-pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 6px var(--cyber-cyan), 0 0 12px rgba(117, 241, 255, 0.5);
  }
  50% {
    opacity: 0.45;
    box-shadow: 0 0 3px var(--cyber-cyan), 0 0 5px rgba(117, 241, 255, 0.25);
  }
}

.dcd-sys-path {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: rgba(117, 241, 255, 0.5);
  letter-spacing: 0.06em;
}

.dcd-sys-count {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: rgba(255, 82, 205, 0.65);
  letter-spacing: 0.05em;
}

.dcd-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--cyber-cyan);
  text-shadow:
    0 0 10px rgba(117, 241, 255, 0.55),
    0 0 22px rgba(117, 241, 255, 0.22);
}

/* ── Body ───────────────────────────────────────────────── */
.dcd-body {
  position: relative;
  padding: 16px 20px 20px;
  max-height: calc(100vh - 250px);
  overflow: auto;
}

.dcd-scanline {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 3px,
    rgba(117, 241, 255, 0.022) 3px,
    rgba(117, 241, 255, 0.022) 4px
  );
}

.dcd-warn-strip {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  margin-bottom: 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 180, 50, 0.28);
  background: rgba(255, 140, 0, 0.06);
}

.dcd-warn-icon {
  font-size: 15px;
  color: #ffb432;
  flex-shrink: 0;
  filter: drop-shadow(0 0 4px rgba(255, 180, 50, 0.6));
}

.dcd-warn-text {
  font-size: 13px;
  color: rgba(255, 200, 100, 0.82);
  line-height: 1.4;
}

.dcd-city-grid {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 44px;
  max-height: 150px;
  overflow-y: auto;
  padding: 10px;
  margin-bottom: 14px;
  border-radius: 10px;
  border: 1px solid rgba(117, 241, 255, 0.18);
  background: rgba(4, 18, 42, 0.6);
}

.dcd-city-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(117, 241, 255, 0.38);
  background: rgba(3, 28, 60, 0.8);
  color: var(--cyber-cyan);
  font-size: 13px;
  letter-spacing: 0.03em;
  text-shadow: 0 0 8px rgba(117, 241, 255, 0.32);
  box-shadow:
    inset 0 0 8px rgba(117, 241, 255, 0.07),
    0 0 7px rgba(117, 241, 255, 0.08);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.dcd-city-chip:hover {
  border-color: rgba(117, 241, 255, 0.65);
  box-shadow:
    inset 0 0 10px rgba(117, 241, 255, 0.14),
    0 0 12px rgba(117, 241, 255, 0.18);
}

.dcd-chip-marker {
  flex-shrink: 0;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--cyber-cyan);
  box-shadow: 0 0 5px rgba(117, 241, 255, 0.8);
}

.dcd-confirm-text {
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: 13px;
  color: var(--cyber-text-muted);
  line-height: 1.6;
}

.dcd-confirm-count {
  font-style: normal;
  font-weight: 700;
  font-size: 15px;
  color: var(--cyber-cyan);
  text-shadow: 0 0 8px rgba(117, 241, 255, 0.5);
}

/* ── Footer ─────────────────────────────────────────────── */
.dcd-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
}

.dcd-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 22px;
  height: 40px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.04em;
  cursor: pointer;
  border: 1px solid;
  transition: transform 0.2s, filter 0.2s, box-shadow 0.2s;
}

.dcd-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.12);
}

.dcd-btn:active {
  transform: translateY(0);
}

.dcd-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  filter: none;
}

.dcd-btn--cancel {
  border-color: rgba(117, 241, 255, 0.32);
  background: rgba(4, 18, 42, 0.7);
  color: var(--cyber-text-muted);
  box-shadow: inset 0 0 8px rgba(117, 241, 255, 0.05);
}

.dcd-btn--cancel:hover {
  border-color: rgba(117, 241, 255, 0.58);
  color: var(--cyber-text);
  box-shadow:
    inset 0 0 10px rgba(117, 241, 255, 0.1),
    0 0 10px rgba(117, 241, 255, 0.1);
}

.dcd-btn--danger {
  border-color: rgba(255, 82, 205, 0.52);
  background: linear-gradient(135deg, rgba(255, 82, 205, 0.2), rgba(180, 0, 100, 0.16));
  color: #ffaee8;
  box-shadow:
    inset 0 0 10px rgba(255, 82, 205, 0.12),
    0 0 10px rgba(255, 82, 205, 0.12);
}

.dcd-btn--danger:hover {
  border-color: rgba(255, 82, 205, 0.8);
  box-shadow:
    inset 0 0 14px rgba(255, 82, 205, 0.22),
    0 0 16px rgba(255, 82, 205, 0.22);
}

.dcd-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 82, 205, 0.3);
  border-top-color: #ff52cd;
  border-radius: 50%;
  animation: dcd-spin 0.7s linear infinite;
}

@keyframes dcd-spin {
  to { transform: rotate(360deg); }
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

  .city-manage-panel {
    padding: 14px;
  }

  .city-manage-head {
    margin-bottom: 12px;
  }

  .city-manage-grid {
    grid-template-columns: 1fr;
  }

  .manage-card--balanced {
    min-height: auto;
  }

  .manage-card {
    padding: 14px;
  }

  .delete-stage-label {
    align-items: flex-start;
    flex-direction: column;
  }

  .delete-manage-card {
    grid-column: 1 / -1;
  }

  .delete-action-row {
    justify-content: stretch;
  }

  .delete-action-row .cyber-action-btn {
    width: 100%;
  }

  :global(.el-overlay-dialog:has(.el-dialog.delete-confirm-dialog)) {
    padding: 12px !important;
  }

  :global(.el-dialog.delete-confirm-dialog) {
    width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 24px) !important;
  }

  .dcd-footer {
    flex-direction: column-reverse;
  }

  .dcd-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
