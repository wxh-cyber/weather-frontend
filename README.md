# 小慕天气前端项目

## 项目简介

`weather-frontend` 是“小慕天气”系统的前端项目，基于 `Vue 3`、`Vite`、`TypeScript`、`Pinia` 和 `Element Plus` 构建。项目主要用于实现天气展示、用户登录注册、个人中心、城市列表、登录记录等页面与交互能力，整体视觉风格以科幻风界面为主。

## 技术栈

- `Vue 3`：前端核心框架
- `Vite`：前端开发与构建工具
- `TypeScript`：类型系统支持
- `Vue Router`：前端路由管理
- `Pinia`：状态管理
- `Element Plus`：基础 UI 组件库
- `Axios`：HTTP 请求封装
- `Vitest`：单元测试
- `Playwright`：端到端测试

## 项目功能

- 天气首页展示
- 用户登录与注册
- 个人中心信息维护
- 我的城市列表展示
- 登录列表记录查询
- 科幻风导航栏与交互界面

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

## 环境要求

- `Node.js`：`^20.19.0` 或 `>=22.12.0`
- `npm`：建议使用与当前 Node 版本匹配的较新版本

## 项目启动方式

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发环境

```bash
npm run dev
```

启动后即可在本地访问前端开发服务。

### 3. 构建生产版本

```bash
npm run build
```

该命令会先进行类型检查，再执行生产构建。

### 4. 预览构建结果

```bash
npm run preview
```

## 项目测试命令

### 1. 类型检查

```bash
npm run type-check
```

### 2. 单元测试

```bash
npm run test:unit
```

### 3. 端到端测试

```bash
npm run test:e2e
```

首次运行端到端测试时，需要先安装 Playwright 浏览器依赖：

```bash
npx playwright install
```

## 常用开发命令

### 代码格式化

```bash
npm run format
```

### 仅执行前端构建

```bash
npm run build-only
```

## 前后端联调说明

- 当前前端默认通过 `/api` 作为请求前缀访问后端接口。
- 启动联调前，请确保后端服务已正常启动。
- 如果本地代理或后端端口有调整，需要同步检查前端请求配置与 Vite 代理配置。

## 主要页面说明

- `/weather`：天气首页
- `/login`：登录页
- `/register`：注册页
- `/center`：个人中心
- `/list`：我的城市
- `/login-list`：登录记录列表

## 说明

本项目当前聚焦课程设计/毕业设计场景，部分数据能力采用前后端本地联调方式实现。若后续需要部署到正式环境，建议进一步补充：

- 环境变量管理
- 接口鉴权策略
- 日志与异常监控
- 持久化存储方案
