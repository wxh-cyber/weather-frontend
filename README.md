# 小慕天气前端项目

![Vue 3](https://img.shields.io/badge/Vue%203-3.5.29-42b883?style=for-the-badge&logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-beta-646cff?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-3.0.4-ffd859?style=for-the-badge&logo=pinia&logoColor=1f2937)
![Vue Router](https://img.shields.io/badge/Vue%20Router-5.0.3-35495e?style=for-the-badge&logo=vuedotjs&logoColor=white)
![Element Plus](https://img.shields.io/badge/Element%20Plus-2.13.5-409eff?style=for-the-badge&logo=element&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-1.14.0-5a29e4?style=for-the-badge&logo=axios&logoColor=white)
![ECharts](https://img.shields.io/badge/ECharts-6.0.0-aa344d?style=for-the-badge&logo=apacheecharts&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-4.0.18-6e9f18?style=for-the-badge&logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-1.58.2-2ead33?style=for-the-badge&logo=playwright&logoColor=white)

## 项目简介

`weather-frontend` 是"小慕天气"系统的前端工程，基于 `Vue 3 + Vite + TypeScript` 构建，当前用于毕业设计场景下的页面展示、交互动画与前后端联调。项目已覆盖开始页、天气主页、城市详情、登录注册、个人中心、登录记录、我的城市管理以及地图浏览等核心界面。

## 技术栈

| 技术栈 | 当前版本 | 主要作用 |
|------|------|------|
| `Vue 3` | `3.5.29` | 构建前端页面与组件逻辑，使用 Composition API 和 `<script setup>` 组织业务代码 |
| `Vite` | `beta` | 提供本地开发服务器、构建流程与前后端代理能力 |
| `TypeScript` | `5.9.3` | 提供类型约束与工程可维护性 |
| `Vue Router` | `5.0.3` | 管理开始页、天气页、登录注册、个人中心、我的城市等路由 |
| `Pinia` | `3.0.4` | 维护登录态、城市列表、默认城市等全局响应式状态 |
| `Element Plus` | `2.13.5` | 提供表单、弹窗、输入框、按钮等 UI 组件 |
| `Axios` | `1.14.0` | 统一封装 HTTP 请求、鉴权头注入与错误响应处理 |
| `ECharts` | `6.0.0` | 渲染温度趋势图等图表内容 |
| `Vitest` | `4.0.18` | 承担单元测试与组件测试 |
| `Playwright` | `1.58.2` | 承担端到端流程测试 |

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
npx vitest run src/views/auth/__tests__/Login.spec.ts
```

按描述匹配测试：

```bash
npx vitest run --reporter=verbose -t "shows unregistered"
```

## 当前功能

- 天气主页展示城市天气总览
- 开始页支持多组天气动效背景轮播与实时时间显示
- 登录、注册与本地登录态持久化（`localStorage` + Pinia `authStore`）
- 个人中心资料编辑与头像上传
- 登录记录查询（需鉴权）
- 我的城市页面支持查询、新增、设置默认城市、删除和批量删除
- 城市详情页展示当前天气、地图、短时预报与温度趋势图
- 温度趋势图支持在详情页内部进行局部视图切换，不替换整页内容
- 动态城市背景：按城市名 + 时段（昼 / 昏 / 夜）自动切换背景图片
- 天气粒子特效叠加层：雨、雪、阵雨（含晴雨交替）、雷阵雨（含闪电帧动画）
- 天气地图页支持地图面板与天气点位浏览组件联动
- 用户退出后会清空当前账号城市缓存；重新登录不同账号时，城市列表会按账号隔离展示

## 路由说明

| 路径 | 说明 | 鉴权 |
|------|------|------|
| `/` | 开始页 | — |
| `/weather` | 天气主页，有默认城市时自动重定向到对应城市详情 | — |
| `/weather/:cityName` | 城市详情概览（`CityOverviewView`） | — |
| `/weather/:cityName/temperature-trend` | 城市详情内的温度趋势子视图 | — |
| `/weather/:cityName/map` | 城市详情内的天气地图子视图 | — |
| `/login` | 登录页 | — |
| `/register` | 注册页 | — |
| `/center` | 个人中心 | — |
| `/list` | 我的城市管理；未登录时从导航点击会先跳转到登录页 | — |
| `/login-list` | 登录记录，需要登录后访问 | `requiresAuth: true` |

未匹配路由统一重定向至 `/weather`。

## 城市详情页说明

- 城市详情页外层由 `CityDetail.vue` + 子路由承载，地址栏在概览、温度趋势和天气地图之间同步变化。
- `CityOverviewView` 始终负责整页概览内容，切换至温度趋势时上方天气概览和地图区域不会重绘。
- `HourlyForecastPanel` 内部通过右上角按钮在「概览 / 温度轨迹」之间切换：
  - `/weather/:cityName` 显示短时预报卡片
  - `/weather/:cityName/temperature-trend` 显示温度趋势图
- 城市详情顶部导航已接入 `map` 子路由，可在概览 / 温度趋势 / 天气地图之间切换。
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
- `src/service/weather.ts` 负责封装天气详情、小时趋势、地图逆地理编码等天气相关接口调用。

### 状态管理

| Store | 文件 | 持久化键 | 职责 |
|-------|------|---------|------|
| `authStore` | `src/store/auth.ts` | `auth_token` / `auth_user` | 登录态、用户信息、注册状态同步 |
| `cityStore` | `src/store/city.ts` | `city_list:user:<userId>` | 按用户隔离的城市列表、默认城市、城市 CRUD、本地恢复 |

- `authStore` 在 `setAuth` / `clearAuth` / `updateUserProfile` 时派发 `auth-user-updated` DOM 事件，供非响应式代码（如 `AppTopNav`）监听。
- `cityStore` 启动时通过 `syncFromStorage()` 读取当前登录用户对应的本地缓存，并自动清理旧版共享 `city_list` 与哨兵数据。
- 退出登录时会同时清空当前用户的内存城市状态与对应本地缓存，避免下一个账号复用旧数据。

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

### weather 目录职责拆分

- `src/components/weather/overview`：承载城市概览、当前天气、短时预报和温度轨迹面板。
- `src/components/weather/map`：承载地图面板、地图探索页组件以及地图底图主题配置。
- `src/components/weather/shell`：承载天气页外壳、顶部栏和城市切换标签等页面容器型组件。
- `src/views/weather/entry`：天气首页入口页。
- `src/views/weather/detail`：城市详情、概览和温度趋势等详情子视图。
- `src/views/weather/map`：独立天气地图页视图。

## 项目结构

```text
weather-frontend/
├─ public/                    静态资源
├─ src/
│  ├─ assets/
│  │  ├─ animations/
│  │  │  ├─ auth/             登录/注册背景动图
│  │  │  └─ weather/          开始页天气轮播动图
│  │  ├─ cities/              城市背景图（昼/昏/夜）
│  │  ├─ fonts/               数码管字体等本地字体
│  │  ├─ icons/               GitHub 图标与天气 SVG 图标
│  │  ├─ styles/              全局样式入口（main/base/theme/auth-page）
│  │  └─ logo.svg             项目 logo
│  ├─ components/
│  │  ├─ city-list/           城市列表业务组件（CityList / CityListItem）
│  │  │  └─ __tests__/        城市列表组件单测
│  │  └─ weather/             天气页面业务组件
│  │     ├─ __tests__/
│  │     │  ├─ map/           地图组件单测
│  │     │  ├─ overview/      概览组件单测
│  │     │  └─ shell/         页面外壳组件单测
│  │     ├─ map/
│  │     │  ├─ mapTheme.ts
│  │     │  ├─ WeatherMapExplorer.vue
│  │     │  └─ WeatherMapPanel.vue
│  │     ├─ overview/
│  │     │  ├─ CurrentWeatherPanel.vue
│  │     │  ├─ HourlyForecastPanel.vue
│  │     │  ├─ TemperatureTrendPanel.vue
│  │     │  └─ WeatherCityOverview.vue
│  │     └─ shell/
│  │        ├─ WeatherCityTabs.vue
│  │        ├─ WeatherPageShell.vue
│  │        └─ WeatherTopBar.vue
│  ├─ layout/
│  │  ├─ __tests__/           布局与导航单测
│  │  ├─ helpers/
│  │  │  └─ weatherSearch.ts  城市搜索 provide/inject key
│  │  ├─ AppLayout.vue
│  │  ├─ AppTopNav.vue
│  │  └─ CyberCursorOverlay.vue
│  ├─ router/
│  │  ├─ __tests__/           路由守卫与入口逻辑单测
│  │  └─ index.ts             路由配置 + 守卫（resolveProtectedRoute / resolveWeatherEntryRoute）
│  ├─ service/
│  │  ├─ auth.ts              登录/注册/用户资料/登录记录接口
│  │  ├─ city.ts              城市 CRUD 接口
│  │  ├─ http.ts              Axios 实例 + 拦截器
│  │  └─ weather.ts           天气详情 / 预报 / 地图相关接口
│  ├─ store/
│  │  ├─ __tests__/           authStore / cityStore 单测
│  │  ├─ auth.ts              authStore
│  │  └─ city.ts              cityStore
│  ├─ utils/
│  │  └─ weather/
│  │     ├─ __tests__/        动态背景与天气工具函数单测
│  │     ├─ cityBackgrounds.ts  动态背景解析
│  │     ├─ weatherIconMap.ts   天气图标映射
│  │     └─ weatherOverlays.ts  粒子特效叠加层逻辑
│  ├─ views/
│  │  ├─ auth/                登录 / 注册 / 个人中心 / 登录记录
│  │  │  └─ __tests__/        认证相关页面单测
│  │  ├─ cities/              我的城市管理页
│  │  │  └─ __tests__/        城市列表页单测
│  │  ├─ system/              开始页（Start）
│  │  └─ weather/             天气相关页
│  │     ├─ __tests__/
│  │     │  ├─ detail/        详情页单测
│  │     │  ├─ entry/         首页入口单测
│  │     │  └─ map/           地图页单测
│  │     ├─ detail/
│  │     │  ├─ CityDetail.vue
│  │     │  ├─ CityOverviewView.vue
│  │     │  └─ TemperatureTrendView.vue
│  │     ├─ entry/
│  │     │  └─ Home.vue
│  │     └─ map/
│  │        └─ CityWeatherMapView.vue
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
  - `cities`：城市列表拉取与 CRUD（新增/删除/默认城市/用户隔离）
  - `weather`：当前天气、小时级趋势、多日预报与地图逆地理编码
- 当前 `/cities` 已由后端按登录态自适应处理：
  - 未登录时可获取公共城市列表 / 搜索结果
  - 已登录且不带 `keyword` 时返回当前用户自己的城市列表
  - 已登录且带 `keyword` 时继续走全局搜索语义，便于搜索候选城市后加入当前账号列表

## 后续可扩展点

以下为当前版本的明确边界，后续若继续推进可优先考虑：

### 功能扩展

- **天气预报深化展示**：当前详情页已具备实时天气、温度趋势和地图骨架，可继续扩展风速、湿度、AQI、未来 7 日卡片与生活指数展示。
- **城市搜索联想**：`AppTopNav` 顶部搜索目前仍以输入后确认搜索为主，可继续扩展候选下拉、拼音匹配与热门城市推荐。
- **多城市总览页**：`Home.vue` 当前围绕默认城市进入详情，可扩展为在天气主页直接展示当前账号所有订阅城市的概览卡片矩阵。
- **城市拖拽排序**：后端已具备用户城市排序语义，可在 `List.vue` 接入拖拽交互并把顺序同步到服务端。
- **消息通知与天气预警**：可结合浏览器通知或站内消息，在恶劣天气、雷暴、暴雨等条件下推送提醒。

### 体验优化

- **PWA 离线支持**：项目已使用 Vite，可接入 `vite-plugin-pwa` 实现 Service Worker 离线缓存，优先缓存已访问城市的天气数据与背景图片。
- **骨架屏**：天气面板、城市列表加载时可引入骨架屏组件代替当前的加载指示器，改善首屏体验。
- **动画过渡**：路由切换与天气叠加层切换可通过 Vue `<Transition>` / `<TransitionGroup>` 增加淡入淡出或滑动效果。
- **暗色/亮色主题切换**：CSS 变量已集中管理，可在现有赛博主题基础上增加浅色主题、跟随系统主题或主题持久化逻辑。

### 工程能力

- **Weather 数据 Store**：当前天气数据仍主要由视图组件协作拉取，后续可抽取 `weatherStore` 统一管理缓存策略、过期刷新与错误恢复。
- **接口层类型完善**：`service/` 下的类型已经具备基础定义，后续可进一步和后端 Swagger / OpenAPI 描述同步，并增加运行时校验。
- **E2E 覆盖扩展**：当前 Playwright 覆盖仍偏轻量，可继续补充登录、退出、用户切换、城市 CRUD、详情页子路由切换等关键路径。
- **生产化部署**：可补充 Nginx、Docker Compose、静态资源缓存策略与 CI/CD 流水线，实现前后端一体化部署。
- **国际化（i18n）**：项目当前整体以中文界面为主，后续若需面向更广用户可引入 `vue-i18n` 做文案抽离。

## 说明

- 项目整体视觉风格延续暗色科幻主题，核心样式变量集中在 `src/assets/styles/theme.css`。
- 当前实现优先服务于毕业设计展示与联调闭环，功能边界以"已落地且联调通过"为准。
