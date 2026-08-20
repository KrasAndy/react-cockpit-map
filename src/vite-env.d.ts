/// <reference types="vite/client" />

// === react-cockpit-map vite type shims ===
// 解决 ?inline / .module.css import 在 tsc 下的类型缺失问题
// vite 客户端类型内置了 '*.css?inline' → string, '*.module.css' → Record<string, string>

declare module '*.css?inline' {
  const css: string;
  export default css;
}

declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}