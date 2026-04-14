# 小慕天气前端项目

## 项目简介

`weather-frontend` 是“小慕天气”系统的前端工程，基于 `Vue 3 + Vite + TypeScript` 构建，当前用于毕业设计场景下的页面展示与前后端联调。项目已覆盖开始页、天气主页、城市详情、登录注册、个人中心、登录记录和我的城市管理等核心界面。

## 技术栈

- `Vue 3`
- `Vite`
- `TypeScript`
- `Vue Router`
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

### 3. 生产构建

```bash
npm run build
```

### 4. 预览构建结果

```bash
npm run preview
```

## 常用脚本

```bash
npm run dev
npm run build
npm run preview
npm run type-check
npm run test:unit
npm run test:e2e
npm run format
```

首次执行端到端测试时，如本机尚未安装 Playwright 浏览器，可执行：

```bash
npx playwright install
```

## 当前功能

- 天气主页展示城市天气总览
- 登录、注册与本地登录态持久化
- 个人中心资料编辑与头像上传
- 登录记录查询
- 我的城市页面支持查询、新增、修改、删除和批量删除
- 城市详情页展示当前天气、地图、短时预报与温度趋势图
- 温度趋势图支持在详情页内部进行局部视图切换，不替换整页内容

## 路由说明

- `/`：开始页
- `/weather`：天气主页，若本地已有默认城市会自动跳转到对应城市详情
- `/weather/:cityName`：城市详情页概览
- `/weather/:cityName/temperature-trend`：城市详情页中的温度趋势子视图
- `/login`：登录页
- `/register`：注册页
- `/center`：个人中心
- `/list`：我的城市
- `/login-list`：登录记录页，需要登录后访问

## 城市详情页说明

- 城市详情页外层仍由 `CityDetail` + 子路由承载，地址栏会在概览与温度趋势之间同步变化。
- 当前实现中，`CityOverviewView` 始终负责整页概览内容，上方天气概览和地图区域不会因为切换温度趋势而重绘或替换。
- `HourlyForecastPanel` 内部通过右上角按钮在“概览 / 温度轨迹”之间切换：
  - `/weather/:cityName` 显示短时预报卡片
  - `/weather/:cityName/temperature-trend` 显示温度趋势图
- `TemperatureTrendView` 仍保留为路由组件，用于承接现有路由语义与趋势图能力复用。

## 前后端联调现状

- 前端默认通过 `/api` 前缀代理访问后端。
- 启动前端前，请先确保 `weather-backend` 服务已启动。
- 当前前端实际已接入的服务主要集中在：
  - `auth`：登录、注册、资料、头像、登录记录
  - `cities`：城市列表与我的城市管理
- 后端已扩展出更完整的 JWT、用户城市和天气能力，但前端 README 仅记录当前页面已使用或已明确落地的联调链路，不把尚未全面接入的能力写成前端已全部消费。

## 项目结构

```text
weather-frontend/
├─ public/                静态资源
├─ src/
│  ├─ assets/             全局样式、图标、字体、图片资源
│  ├─ components/         通用组件与业务组件
│  ├─ layout/             页面布局与顶部导航
│  ├─ router/             路由配置
│  ├─ service/            接口请求封装
│  ├─ store/              Pinia 状态管理
│  ├─ views/              页面级组件
│  ├─ App.vue             应用根组件
│  └─ main.ts             应用入口
├─ e2e/                   端到端测试
├─ package.json           项目脚本与依赖配置
└─ README.md              项目说明文档
```

## 说明

- 项目整体视觉风格延续暗色科幻主题，核心样式变量集中在 `src/assets/theme.css`。
- 当前实现优先服务于毕业设计展示与联调闭环，后续若继续扩展，可再细化更完整的接口消费、状态同步和生产化部署说明。
