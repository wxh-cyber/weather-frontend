<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getLoginRecords, type LoginRecord } from '@/service/auth'

type ViewState = 'idle' | 'loading' | 'ready' | 'empty' | 'error' | 'unauthorized'

const loading = ref(false)
const error = ref('')
const records = ref<LoginRecord[]>([])
const viewState = ref<ViewState>('idle')

const recordCount = computed(() => records.value.length)
const latestLoginTime = computed(() => {
  const latest = records.value[0]?.loginTime
  return latest ? formatLoginTime(latest) : '暂无记录'
})

const formatLoginTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

const fetchLoginRecords = async () => {
  loading.value = true
  error.value = ''
  viewState.value = 'loading'

  try {
    const res = await getLoginRecords()
    records.value = [...res.data].sort(
      (left, right) => new Date(right.loginTime).getTime() - new Date(left.loginTime).getTime(),
    )
    viewState.value = records.value.length ? 'ready' : 'empty'
  } catch (fetchError) {
    const message = fetchError instanceof Error ? fetchError.message : '加载登录记录失败'
    if (message === 'UNAUTHORIZED') {
      error.value = '登录状态已失效，请重新登录'
      viewState.value = 'unauthorized'
    } else {
      error.value = message
      viewState.value = 'error'
      ElMessage.error(message)
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchLoginRecords()
})
</script>

<template>
  <main class="login-list-page">
    <div class="cyber-grid-layer" />
    <section class="login-list-card">
      <header class="page-header">
        <div>
          <p class="eyebrow">ACCESS LOGS</p>
          <h1>登录列表</h1>
          <p class="description">实时追踪当前账号的登录轨迹，包含时间、地址与终端设备信息。</p>
        </div>
        <div class="stats-panel">
          <article class="stat-chip">
            <span class="stat-label">记录总数</span>
            <strong class="stat-value">{{ recordCount }}</strong>
          </article>
          <article class="stat-chip">
            <span class="stat-label">最近登录</span>
            <strong class="stat-value stat-value-sm">{{ latestLoginTime }}</strong>
          </article>
        </div>
      </header>

      <div v-if="viewState === 'error' || viewState === 'unauthorized'" class="feedback-panel is-error">
        <span>{{ viewState === 'unauthorized' ? '访问受限' : '信号异常' }}</span>
        <p>{{ error }}</p>
        <el-button v-if="viewState !== 'unauthorized'" type="primary" @click="fetchLoginRecords">重新加载</el-button>
      </div>

      <div v-else class="table-shell">
        <div class="table-headline">
          <span class="headline-dot" />
          <p>登录记录矩阵</p>
        </div>

        <div v-loading="loading" class="table-wrap" element-loading-text="正在解码登录记录...">
          <el-empty
            v-if="viewState === 'empty'"
            class="empty-state"
            description="当前账号暂未生成登录记录"
          />
          <el-table
            v-else
            :data="records"
            class="login-table"
            empty-text="暂无登录记录"
          >
            <el-table-column prop="account" label="登录账户" min-width="180" />
            <el-table-column label="登录时间" min-width="200">
              <template #default="{ row }">
                {{ formatLoginTime(row.loginTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="loginAddress" label="登录地址" min-width="180" />
            <el-table-column prop="loginDevice" label="登录设备" min-width="240" />
          </el-table>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-list-page {
  position: relative;
  min-height: calc(100vh - var(--app-nav-height));
  padding: 26px 16px 34px;
  background:
    radial-gradient(circle at 14% 14%, rgba(0, 255, 255, 0.18), transparent 32%),
    radial-gradient(circle at 84% 18%, rgba(255, 82, 205, 0.18), transparent 34%),
    linear-gradient(180deg, #051028 0%, #020816 100%);
}

.login-list-card {
  position: relative;
  z-index: 1;
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 28px;
  border: 1px solid var(--cyber-glass-border);
  background:
    linear-gradient(145deg, rgba(4, 14, 34, 0.82), rgba(3, 12, 29, 0.72)),
    var(--cyber-glass-bg);
  box-shadow:
    inset 0 0 22px rgba(117, 241, 255, 0.08),
    0 0 32px rgba(0, 145, 255, 0.16),
    0 0 46px rgba(255, 82, 205, 0.08);
  backdrop-filter: blur(8px);
  overflow: hidden;
}

.login-list-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, transparent, rgba(117, 241, 255, 0.08), transparent),
    linear-gradient(180deg, rgba(255, 82, 205, 0.05), transparent 35%);
  pointer-events: none;
}

.page-header {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  margin-bottom: 22px;
}

.eyebrow {
  margin: 0 0 8px;
  color: rgba(255, 82, 205, 0.86);
  letter-spacing: 0.28em;
  font-size: 12px;
}

.page-header h1 {
  margin: 0;
  color: var(--cyber-cyan);
  font-size: clamp(28px, 4vw, 36px);
  letter-spacing: 0.08em;
  text-shadow:
    0 0 12px rgba(117, 241, 255, 0.42),
    0 0 22px rgba(0, 145, 255, 0.22);
}

.description {
  margin: 12px 0 0;
  max-width: 560px;
  color: var(--cyber-text-muted);
  line-height: 1.7;
}

.stats-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(160px, 1fr));
  gap: 12px;
  min-width: min(360px, 100%);
}

.stat-chip {
  padding: 16px 18px;
  border: 1px solid rgba(117, 241, 255, 0.24);
  background: rgba(5, 19, 44, 0.72);
  box-shadow:
    inset 0 0 16px rgba(117, 241, 255, 0.08),
    0 0 12px rgba(0, 145, 255, 0.12);
}

.stat-label {
  display: block;
  margin-bottom: 8px;
  color: rgba(183, 216, 255, 0.82);
  font-size: 12px;
  letter-spacing: 0.1em;
}

.stat-value {
  color: #f4fcff;
  font-size: 28px;
  text-shadow: 0 0 12px rgba(117, 241, 255, 0.24);
}

.stat-value-sm {
  font-size: 15px;
  line-height: 1.5;
}

.feedback-panel {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 10px;
  padding: 22px;
  border: 1px solid rgba(255, 82, 205, 0.32);
  background: rgba(28, 8, 34, 0.42);
  color: #ffd7fa;
}

.feedback-panel span {
  font-size: 13px;
  letter-spacing: 0.14em;
}

.feedback-panel p {
  margin: 0;
  color: #ffd7fa;
}

.table-shell {
  position: relative;
  z-index: 1;
  padding: 18px;
  border: 1px solid rgba(117, 241, 255, 0.2);
  background: rgba(3, 13, 31, 0.7);
}

.table-headline {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  color: #eefcff;
}

.table-headline p {
  margin: 0;
  letter-spacing: 0.08em;
}

.headline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--cyber-pink);
  box-shadow:
    0 0 10px rgba(255, 82, 205, 0.95),
    0 0 18px rgba(117, 241, 255, 0.4);
}

.table-wrap {
  min-height: 240px;
  overflow-x: auto;
}

.empty-state {
  min-height: 220px;
}

.login-table {
  --el-table-border-color: rgba(117, 241, 255, 0.18);
  --el-table-tr-bg-color: rgba(2, 14, 34, 0.56);
  --el-table-row-hover-bg-color: rgba(10, 32, 70, 0.78);
  --el-table-header-bg-color: rgba(7, 22, 50, 0.92);
  --el-table-bg-color: transparent;
  --el-table-text-color: var(--cyber-text);
  --el-table-header-text-color: #c9f8ff;
  width: 100%;
  background: transparent;
}

.login-table :deep(.el-table__inner-wrapper::before) {
  background-color: rgba(117, 241, 255, 0.2);
}

.login-table :deep(th.el-table__cell) {
  background: rgba(7, 22, 50, 0.9);
}

.login-table :deep(.el-table__cell) {
  background: transparent;
  border-bottom-color: rgba(117, 241, 255, 0.14);
}

.login-table :deep(.cell) {
  line-height: 1.6;
}

.empty-state :deep(.el-empty__description p) {
  color: var(--cyber-text-muted);
}

.feedback-panel :deep(.el-button),
.table-shell :deep(.el-button) {
  background: linear-gradient(135deg, rgba(0, 145, 255, 0.94), rgba(255, 82, 205, 0.86));
  border-color: transparent;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .stats-panel {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 640px) {
  .login-list-page {
    min-height: calc(100vh - var(--app-nav-height-mobile));
    padding-top: 20px;
  }

  .login-list-card {
    padding: 20px;
  }

  .stats-panel {
    grid-template-columns: 1fr;
  }

  .table-shell {
    padding: 14px;
  }
}
</style>
