# 小慕天气前端项目

## 项目简介

`weather-frontend` 是“小慕天气”系统的前端工程，基于 `Vue 3 + Vite + TypeScript`。  
当前版本已实现天气页面、登录注册、个人中心、登录记录、城市详情，以及“我的城市”页面中的科幻风城市管理中枢（增删改查、复选批删、单项删除、科幻弹窗确认）。

## 技术栈

- `Vue 3`
- `Vite`
- `TypeScript`
- `Vue Router`
- `Pinia`
- `Element Plus`
- `Axios`
- `Vitest`
- `Playwright`

## 主要功能（当前实现）

- 天气主页面与城市详情页展示
- 用户注册、登录、登录态持久化（本地存储 token + user）
- 个人中心资料编辑、头像上传、默认城市维护
- 登录记录查询（受保护路由）
- 我的城市页面：
  - 城市搜索
  - 新增城市
  - 修改城市名
  - 删除城市（下拉选择、单项删除、复选批量删除）
  - 批删前科幻风确认弹窗
  - 科幻风下拉框、按钮、标签与列表交互
- Pinia 优先读取城市状态，缺失时回源后端接口

## 项目目录结构

```text
weather-frontend/
├─ public/                静态资源
├─ src/
│  ├─ assets/             全局样式、图标、字体、图片资源
│  ├─ components/         通用组件与业务组件
│  ├─ layout/             页面布局与顶部导航
│  ├─ router/             路由配置
│  ├─ service/            接口请求与服务层封装
│  ├─ store/              Pinia 状态管理
│  ├─ views/              页面级组件
│  ├─ App.vue             应用根组件
│  └─ main.ts             应用入口
├─ e2e/                   端到端测试
├─ package.json           项目脚本与依赖配置
└─ README.md              项目说明文档
```

## 运行环境

- `Node.js`：`^20.19.0` 或 `>=22.12.0`
- `npm`：建议使用与 Node 版本匹配的较新版本

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务

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

## 测试与质量命令

### 类型检查

```bash
npm run type-check
```

### 单元测试

```bash
npm run test:unit
```

### 端到端测试

```bash
npm run test:e2e
```

首次执行 Playwright 时：

```bash
npx playwright install
```

### 代码格式化

```bash
npm run format
```

## 前后端联调说明

- 前端请求前缀为 `/api`。
- 启动前端前，请确保 `weather-backend` 已启动。
- 当前城市接口已支持 `GET/POST/PUT/DELETE /cities`，前端“我的城市”页面的管理中枢已接入对应能力。

## 路由说明（当前）

- `/`：开始页
- `/weather`：天气主页
- `/weather/:cityName`：城市详情页
- `/login`：登录页
- `/register`：注册页
- `/center`：个人中心
- `/list`：我的城市
- `/login-list`：登录记录（需登录）

## 备注

- 项目视觉风格以科幻风为主，核心样式变量集中在 `src/assets/theme.css`。
- 当前实现更偏毕业设计/课程设计场景，生产化部署时建议增加更完善的鉴权、监控、日志与配置治理。
