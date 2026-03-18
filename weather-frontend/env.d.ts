/// <reference types="vite/client" />     
//引入vite/client中的类型定义

//TS默认不认识.vue文件是一个可导入模块，需要一个全局的*.vue模块声明
declare module '*.vue' {       //凡是以后以 .vue 结尾的文件导入，都按照下面定义的规则来处理
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
