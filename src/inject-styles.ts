// === react-cockpit-map CSS injection ===
// R46: 把 leaflet.css 作为字符串 inline 到 bundle 里,运行时通过 <style> 注入
// 来源:原项目 MapCanvas.tsx 行 9, 11, 339-349
// 原因:Netlify Drop 部署时偶发漏掉异步 chunk 的 CSS,
//   导致 leaflet 容器高度 0 → tile 即使加载成功也看不见
// ?inline 后 vite 把 CSS 编译为字符串,运行时通过 <style> 标签注入,
//   完全不产生外部 CSS 请求 → 部署绝对可靠

// Vite library mode 下,?inline 仍然支持 — Vite 在构建时把 CSS 文本 inline 到 bundle
// 用户导入时,这个变量直接是字符串内容
import leafletCssText from 'leaflet/dist/leaflet.css?inline';
// 用户可以把 leaflet-overrides.css 也 import 后传入;不传就只注入 leaflet.css
// (我们的 leaflet-overrides.css 包含暗色 cockpit 风格 + tile 灰阶覆盖,
//  通过 map-theme-dark class 触发)

/** 注入 leaflet.css 到 <head>(带 cache,避免重复注入) */
export function injectLeafletStyles(extraCss: string = ''): void {
  if (typeof document === 'undefined') return;
  const styleId = 'react-cockpit-map-leaflet-css';
  if (document.getElementById(styleId)) return; // 已注入则跳过
  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = leafletCssText + (extraCss ? '\n' + extraCss : '');
  document.head.appendChild(styleEl);
  // 不 cleanup — 样式是全局的,卸载组件不需要移除(避免路由切换闪烁)
}