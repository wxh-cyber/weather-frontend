# 小慕天气前端项目

## 项目简介

`weather-frontend` 是"小慕天气"系统的前端工程，基于 `Vue 3 + Vite + TypeScript` 构建，当前用于毕业设计场景下的页面展示与前后端联调。项目已覆盖开始页、天气主页、城市详情、登录注册、个人中心、登录记录和我的城市管理等核心界面。

## 技术栈

- `Vue 3`（Composition API + `<script setup>`）
- `Vite`
- `TypeScript`
- `Vue Router 5`
- `Pinia`
- `Element Plus`
- `Axios`
- `ECharts`
- `Vitest`
- `Playwright`

## 运行环境

- `Node.js`：`^20.19.0` 或 `>=22.12.0`
- `npm`：建议使用与 Node 版本匹配的较新版本

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发环境

```bash
npm run dev
```

> 开发服务器会将 `/api` 前缀的请求代理到 `http://localhost:3000`，启动前请确保后端服务已运行。

### 3. 生产构建

```bash
npm run build
```

### 4. 预览构建结果

```bash
npm run preview
```

## 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run preview` | 预览构建产物 |
| `npm run type-check` | 仅执行 `vue-tsc` 类型检查 |
| `npm run test:unit` | 运行所有 Vitest 单元测试 |
| `npm run test:e2e` | 运行 Playwright 端到端测试 |
| `npm run format` | 使用 oxfmt 格式化源码 |

首次执行端到端测试时，如本机尚未安装 Playwright 浏览器，可执行：

```bash
npx playwright install
```

运行单个测试文件：

```bash
npx vitest run src/views/__tests__/Login.spec.ts
```

按描述匹配测试：

```bash
npx vitest run --reporter=verbose -t "shows unregistered"
```

## 当前功能

- 天气主页展示城市天气总览
- 登录、注册与本地登录态持久化（`localStorage` + Pinia `authStore`）
- 个人中心资料编辑与头像上传
- 登录记录查询（需鉴权）
- 我的城市页面支持查询、新增、修改（重命名）、删除和设置默认城市
- 城市详情页展示当前天气、地图、短时预报与温度趋势图
- 温度趋势图支持在详情页内部进行局部视图切换，不替换整页内容
- 动态城市背景：按城市名 + 时段（昼 / 昏 / 夜）自动切换背景图片
- 天气粒子特效叠加层：雨、雪、阵雨（含晴雨交替）、雷阵雨（含闪电帧动画）

## 路由说明

| 路径 | 说明 | 鉴权 |
|------|------|------|
| `/` | 开始页 | — |
| `/weather` | 天气主页，有默认城市时自动重定向到对应城市详情 | — |
| `/weather/:cityName` | 城市详情概览（`CityOverviewView`） | — |
| `/weather/:cityName/temperature-trend` | 城市详情内的温度趋势子视图 | — |
| `/login` | 登录页 | — |
| `/register` | 注册页 | — |
| `/center` | 个人中心 | — |
| `/list` | 我的城市管理 | — |
| `/login-list` | 登录记录，需要登录后访问 | `requiresAuth: true` |

未匹配路由统一重定向至 `/weather`。

## 城市详情页说明

- 城市详情页外层由 `CityDetail.vue` + 子路由承载，地址栏在概览与温度趋势之间同步变化。
- `CityOverviewView` 始终负责整页概览内容，切换至温度趋势时上方天气概览和地图区域不会重绘。
- `HourlyForecastPanel` 内部通过右上角按钮在「概览 / 温度轨迹」之间切换：
  - `/weather/:cityName` 显示短时预报卡片
  - `/weather/:cityName/temperature-trend` 显示温度趋势图
- `TemperatureTrendView` 保留为路由组件，承接现有路由语义与趋势图能力复用。

## 核心模块说明

### 层次结构

```
src/service/    原始 API 调用（http.ts 客户端）
    ↓
src/store/      Pinia 状态管理（响应式状态 + localStorage 持久化）
    ↓
src/views/      页面级组件（1:1 对应路由）
    ↓
src/components/ 可复用业务组件（按功能分组）
```

### HTTP 客户端（`src/service/http.ts`）

- Base URL 为 `/api`，开发环境代理至 `localhost:3000`。
- 请求拦截器自动注入 `Authorization: Bearer <token>`。
- 响应拦截器解包 `response.data`；收到 401 时清除 auth 状态并重定向到 `/login?reason=expired&redirect=<path>`。

### 状态管理

| Store | 文件 | 持久化键 | 职责 |
|-------|------|---------|------|
| `authStore` | `src/store/auth.ts` | `auth_token` / `auth_user` | 登录态、用户信息 |
| `cityStore` | `src/store/city.ts` | `city_list` | 城市列表、默认城市、CRUD |

- `authStore` 在 `setAuth` / `clearAuth` / `updateUserProfile` 时派发 `auth-user-updated` DOM 事件，供非响应式代码（如 `AppTopNav`）监听。
- `cityStore` 启动时通过 `syncFromStorage()` 读取本地数据，并自动剔除旧版硬编码的默认城市哨兵数据。

### 动态背景（`src/utils/weather/cityBackgrounds.ts`）

- 构建时通过 `import.meta.glob` 预加载 `src/assets/cities/*.{png,jpg,webp}`。
- 文件名须遵循 `城市名（昼|昏|夜）.ext` 格式。
- 时段划分：黎明/傍晚 05:00–07:00 & 18:00–20:00 → `dusk`，白天 07:00–18:00 → `day`，其余 → `night`。

### 天气叠加层（`src/utils/weather/weatherOverlays.ts`）

- 将中文天气描述（如 `晴`、`阵雨`、`雷阵雨`）映射到叠加层类型。
- 阵雨与雷阵雨按 10 秒周期在降雨/晴天两相之间交替；雷阵雨在降雨相的固定时间窗口内触发闪电帧动画。

### 导航变体（`meta.navVariant`）

路由 `meta.navVariant` 控制 `AppLayout` 渲染的导航样式：

- `'start'`：着陆页 / 登录注册页导航
- `'home'`：主应用页导航

## 项目结构

```text
weather-frontend/
├─ public/                    静态资源
├─ src/
│  ├─ assets/
│  │  ├─ cities/              城市背景图（昼/昏/夜）
│  │  └─ theme.css            全局 CSS 变量（暗色科幻主题）
│  ├─ components/
│  │  ├─ city-list/           城市列表业务组件（CityList / CityListItem）
│  │  └─ weather/             天气页面业务组件
│  │     ├─ CurrentWeatherPanel.vue
│  │     ├─ HourlyForecastPanel.vue
│  │     ├─ TemperatureTrendPanel.vue
│  │     ├─ WeatherCityOverview.vue
│  │     ├─ WeatherCityTabs.vue
│  │     ├─ WeatherMapPanel.vue
│  │     ├─ WeatherPageShell.vue
│  │     └─ WeatherTopBar.vue
│  ├─ layout/
│  │  ├─ helpers/
│  │  │  └─ weatherSearch.ts  城市搜索 provide/inject key
│  │  ├─ AppLayout.vue
│  │  ├─ AppTopNav.vue
│  │  └─ CyberCursorOverlay.vue
│  ├─ router/
│  │  └─ index.ts             路由配置 + 守卫（resolveProtectedRoute / resolveWeatherEntryRoute）
│  ├─ service/
│  │  ├─ auth.ts              登录/注册/用户资料/登录记录接口
│  │  ├─ city.ts              城市 CRUD 接口
│  │  └─ http.ts              Axios 实例 + 拦截器
│  ├─ store/
│  │  ├─ auth.ts              authStore
│  │  └─ city.ts              cityStore
│  ├─ utils/
│  │  └─ weather/
│  │     ├─ cityBackgrounds.ts  动态背景解析
│  │     ├─ weatherIconMap.ts   天气图标映射
│  │     └─ weatherOverlays.ts  粒子特效叠加层逻辑
│  ├─ views/
│  │  ├─ auth/                登录 / 注册 / 个人中心 / 登录记录
│  │  ├─ cities/              我的城市管理页
│  │  ├─ system/              开始页（Start）
│  │  └─ weather/             天气相关页（Home / CityDetail / CityOverviewView / TemperatureTrendView）
│  ├─ App.vue
│  └─ main.ts
├─ e2e/                       Playwright 端到端测试
├─ package.json
└─ README.md
```

## 前后端联调现状

- 前端默认通过 `/api` 前缀代理访问后端，启动前须先确保 `weather-backend` 服务已启动。
- 当前已接入的服务端点：
  - `auth`：登录、注册、资料编辑、头像上传、登录记录查询
  - `cities`：城市列表拉取与 CRUD（新增/修改/删除）

## 后续可扩展点

以下为当前版本的明确边界，后续若继续推进可优先考虑：

### 功能扩展

- **天气预报接入**：`service/` 层可增加 `/weather/:cityName` 端点封装，将实时气象数据（风速、湿度、AQI、未来 7 日预报）接入 `CurrentWeatherPanel` 与 `HourlyForecastPanel`，目前面板内数据为静态占位。
- **城市搜索联想**：`AppTopNav` 顶部搜索框当前仅支持精确跳转，可对接后端模糊搜索接口并在下拉面板中展示候选结果。
- **多城市天气概览**：`Home.vue` 当前直接重定向到默认城市，可扩展为在落地页同时展示所有已订阅城市的天气卡片列表。
- **城市顺序拖拽排序**：`cityStore` 中城市数组顺序即默认城市语义，可在 `List.vue` 中接入拖拽排序（如 `@vueuse/core` + `Sortable.js`）并持久化顺序。
- **消息通知与天气预警**：可扩展为在严重天气时通过 Element Plus `ElNotification` 或浏览器 Notification API 推送预警信息。

### 体验优化

- **PWA 离线支持**：项目已使用 Vite，可接入 `vite-plugin-pwa` 实现 Service Worker 离线缓存，优先缓存已访问城市的天气数据与背景图片。
- **骨架屏**：天气面板、城市列表加载时可引入骨架屏组件代替当前的加载指示器，改善首屏体验。
- **动画过渡**：路由切换与天气叠加层切换可通过 Vue `<Transition>` / `<TransitionGroup>` 增加淡入淡出或滑动效果。
- **暗色/亮色主题切换**：CSS 变量已集中在 `theme.css`，可在此基础上实现 `prefers-color-scheme` 跟随系统或手动切换逻辑。

### 工程能力

- **Weather 数据 Store**：当前天气数据由各视图组件独立拉取，后续可抽取 `weatherStore` 统一管理请求状态、缓存策略与失效刷新。
- **接口层类型完善**：`service/` 下的响应类型目前较为简略，可随后端 OpenAPI/Swagger 文档完善而补全，并引入 `zod` 等运行时校验。
- **E2E 覆盖扩展**：当前 Playwright 测试覆盖有限，可补充城市 CRUD 流程、登录跳转、背景图切换等关键路径的端到端用例。
- **生产化部署**：可补充 Nginx 反向代理配置（静态文件 + `/api` 代理）、Docker Compose 联合后端一键启动方案，以及 CI/CD 流水线接入。
- **国际化（i18n）**：项目当前全量使用中文，若需扩展受众，可引入 `vue-i18n` 并将界面文案抽取到语言包中。

## 说明

- 项目整体视觉风格延续暗色科幻主题，核心样式变量集中在 `src/assets/theme.css`。
- 当前实现优先服务于毕业设计展示与联调闭环，功能边界以"已落地且联调通过"为准。
