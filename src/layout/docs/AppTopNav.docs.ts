/**
 * `AppTopNav` 组件文档入口。
 *
 * 这个文件专门给 TypeDoc 生成 API 页面使用，不参与页面渲染。
 * 由于 `TypeDoc` 对 `.vue` 单文件组件内的 `<script setup>` 支持有限，
 * 因此这里用一个独立的 TypeScript 文档模块来承接组件说明和公开接口。
 *
 * @module AppTopNav
 */

/**
 * `AppTopNav` 的中心按钮高亮动作类型。
 */
export type AppTopNavActiveAction =
  | ''
  | 'city-detail'
  | 'my-cities'
  | 'profile-center'
  | 'login-list'

/**
 * `AppTopNav` 的主要属性。
 */
export interface AppTopNavPropsDoc {
  /**
   * GitHub 仓库地址。
   */
  githubUrl?: string

  /**
   * 左侧品牌文案。
   */
  brandText?: string

  /**
   * 是否显示城市详情按钮。
   */
  showCityDetail?: boolean

  /**
   * 是否显示“我的城市”按钮。
   */
  showMyCities?: boolean

  /**
   * 是否显示“个人中心”按钮。
   */
  showProfileCenter?: boolean

  /**
   * 是否显示“登录列表”按钮。
   */
  showLoginList?: boolean

  /**
   * 是否将中部按钮区居中显示。
   */
  centerNavCentered?: boolean

  /**
   * 右侧登录状态文案。
   */
  loginLabel?: string

  /**
   * 用户头像地址。
   */
  avatarUrl?: string

  /**
   * 是否显示退出按钮。
   */
  showLogout?: boolean

  /**
   * 当前高亮的中部动作标识。
   */
  activeCenterAction?: AppTopNavActiveAction
}

/**
 * `AppTopNav` 发出的事件说明。
 */
export interface AppTopNavEmitsDoc {
  /**
   * 点击登录状态区域时触发。
   */
  'login-click': void

  /**
   * 点击城市详情按钮时触发。
   */
  'city-detail-click': void

  /**
   * 点击“我的城市”按钮时触发。
   */
  'my-cities-click': void

  /**
   * 点击“个人中心”按钮时触发。
   */
  'profile-center-click': void

  /**
   * 点击“登录列表”按钮时触发。
   */
  'login-list-click': void

  /**
   * 点击退出按钮时触发。
   */
  'logout-click': void

  /**
   * 提交搜索关键词时触发。
   */
  'search-submit': {
    keyword: string
  }
}

/**
 * `AppTopNav` 的行为说明。
 *
 * 组件职责：
 * - 渲染应用顶部导航栏、品牌区、功能按钮区和用户状态区
 * - 根据传入状态切换中部按钮可见性、当前高亮态和头像显示
 * - 为中部功能按钮提供粒子动画和交互反馈
 * - 通过事件将导航操作上抛给布局层处理
 *
 * 使用方式：
 * - 通常由 `AppLayout` 挂载
 * - 当前版本不暴露 `slots`
 *
 * 源组件位置：`src/layout/AppTopNav.vue`
 */
export const appTopNavDoc = {
  name: 'AppTopNav',
  source: 'src/layout/AppTopNav.vue',
  hasProps: true,
  hasEmits: true,
  hasSlots: false,
} as const
