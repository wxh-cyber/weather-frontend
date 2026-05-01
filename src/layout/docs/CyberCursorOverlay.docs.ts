/**
 * `CyberCursorOverlay` 组件文档入口。
 *
 * 这个文件专门给 TypeDoc 生成 API 页面使用，不参与页面渲染。
 * 由于 `TypeDoc` 对 `.vue` 单文件组件内的 `<script setup>` 支持有限，
 * 因此这里用一个独立的 TypeScript 文档模块来承接组件说明和公开数据结构。
 *
 * @module CyberCursorOverlay
 */

/**
 * 点击涟漪的数据结构。
 */
export interface Ripple {
  /**
   * 涟漪唯一标识。
   */
  id: number

  /**
   * 涟漪中心点的 X 坐标。
   */
  x: number

  /**
   * 涟漪中心点的 Y 坐标。
   */
  y: number
}

/**
 * 鼠标拖尾片段的数据结构。
 */
export interface TrailSegment {
  /**
   * 当前终点 X 坐标。
   */
  x: number

  /**
   * 当前终点 Y 坐标。
   */
  y: number

  /**
   * 前一采样点 X 坐标。
   */
  px: number

  /**
   * 前一采样点 Y 坐标。
   */
  py: number

  /**
   * 当前剩余生命周期，单位为毫秒。
   */
  life: number

  /**
   * 初始最大生命周期，单位为毫秒。
   */
  maxLife: number

  /**
   * 轨迹宽度。
   */
  width: number

  /**
   * 轨迹强度，取值范围通常为 `0` 到 `1`。
   */
  intensity: number
}

/**
 * `CyberCursorOverlay` 的行为说明。
 *
 * 组件职责：
 * - 监听鼠标移动、进入、离开、点击和窗口缩放事件
 * - 在全屏 `canvas` 上绘制赛博风格鼠标拖尾粒子
 * - 在点击时生成扩散涟漪
 * - 在粗指针设备或用户偏好减少动画时自动降级
 *
 * 使用方式：
 * - 组件通常由 `AppLayout` 挂载，并通过 `Teleport` 渲染到 `body` 下
 * - 当前版本不暴露 `props`、`emits` 或 `slots`
 *
 * 源组件位置：`src/layout/CyberCursorOverlay.vue`
 */
export const cyberCursorOverlayDoc = {
  name: 'CyberCursorOverlay',
  source: 'src/layout/CyberCursorOverlay.vue',
  hasProps: false,
  hasEmits: false,
  hasSlots: false,
} as const
