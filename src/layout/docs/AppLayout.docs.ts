/**
 * `AppLayout` 组件文档入口。
 *
 * 这个文件专门给 TypeDoc 生成 API 页面使用，不参与页面渲染。
 * 由于 `TypeDoc` 对 `.vue` 单文件组件内的 `<script setup>` 支持有限，
 * 因此这里用一个独立的 TypeScript 文档模块来承接组件说明和公开行为。
 *
 * @module AppLayout
 */

/**
 * 布局导航当前高亮动作类型。
 */
export type ActiveCenterAction =
  | ''
  | 'city-detail'
  | 'my-cities'
  | 'profile-center'
  | 'login-list'

/**
 * 搜索确认弹窗状态。
 */
export interface SearchConfirmState {
  /**
   * 是否显示确认弹窗。
   */
  visible: boolean

  /**
   * 待确认加入的城市名。
   */
  cityName: string

  /**
   * 用于界面展示的城市名。
   */
  displayName: string

  /**
   * 是否来自候选城市结果。
   */
  fromCandidate: boolean
}

/**
 * `AppLayout` 的行为说明。
 *
 * 组件职责：
 * - 作为页面根布局挂载顶部导航、路由视图和赛博光标覆盖层
 * - 根据当前路由切换导航栏文案、按钮可见性和高亮状态
 * - 同步登录态与城市数据，并在需要时补拉用户资料
 * - 处理城市搜索、候选确认、路由跳转和退出登录等布局级交互
 *
 * 对外行为：
 * - 通过 `provide` 暴露天气搜索提交能力给布局内部页面使用
 * - 不暴露 `props`、`emits` 或 `slots`
 * - 将 `AppTopNav` 作为主要交互入口，并统一协调布局级状态
 *
 * 源组件位置：`src/layout/AppLayout.vue`
 */
export const appLayoutDoc = {
  name: 'AppLayout',
  source: 'src/layout/AppLayout.vue',
  hasProps: false,
  hasEmits: false,
  hasSlots: false,
  provides: ['weatherSearchSubmitKey'],
  childComponents: ['AppTopNav', 'CyberCursorOverlay', 'RouterView'],
} as const
