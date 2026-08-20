// === react-cockpit-map public API ===
// 外部用户导入方式:import { MapCanvas, KIND_LABEL, ICON_PATHS } from '@krasandy/react-cockpit-map'

export { MapCanvas } from './MapCanvas';
export { KIND_LABEL, ICON_PATHS } from './icons';
export { CDN_LIST, TileProviderController, probeCdn } from './tile-providers';
export type { CdnConfig } from './tile-providers';
export { injectLeafletStyles } from './inject-styles';

export type {
  AreaCircle,
  ColorMode,
  DeviceIconKind,
  MapCanvasHandle,
  MapCanvasProps,
  Marker,
  PointLabels,
  PolylineOverlay,
  PopupInfo,
  Scene,
  Theme,
} from './types';

// CSS 入口 — 用户可 import '@krasandy/react-cockpit-map/styles.css'
// Vite build 时会生成 dist/style.css
import './MapCanvas.module.css';