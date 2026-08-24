# react-cockpit-map

> React 18 + Leaflet map component with multi-CDN tile fallback, dark cockpit
> style, and 17 industrial device SVG icons. **Born from overseas-deployment
> pain** — solves "Netlify US region × 高德 DNS NXDOMAIN × Leaflet CSS chunk
> lost on Drop deploy" all at once.

[中文](#中文) | [English](#english)

---

## English

### Why this exists

Deploying a Chinese map app overseas (Netlify / Vercel / Cloudflare Pages) hits
three classic failures:

1. **Tile DNS** — `is.autonavi.com` (高德瓦片) is not resolvable from US/EU
2. **Leaflet CSS** — Vite chunks `leaflet.css` into a separate file; Netlify Drop
   sometimes serves the index.html (655 bytes) when the CSS chunk is requested,
   which browsers refuse to parse → invisible map
3. **Tile error feedback** — users just see "blank gray map" with no clue

This package solves all of them:

| Pain | Solution |
|------|----------|
| 高德 DNS | 4 CDN probe (高德矢量 / 高德卫星 / 腾讯 / OSM) → first reachable wins |
| Single CDN dead | Switch to next CDN after 4 tileerrors (800ms debounce) |
| All CDNs dead | Visible DNS error overlay with troubleshooting hints |
| Leaflet CSS chunk lost | **Inline leaflet.css as string via `?inline`** → no external CSS request |
| Dark theme gray | CSS grayscale + brightness + invert + hue-rotate filter |
| 17 device icons needed | Hand-crafted 24×24 SVG path set, all stroke-based |

### Install

```bash
npm install @krasandy/react-cockpit-map leaflet
# peerDependencies: react ^18, react-dom ^18, leaflet ^1.9
```

### Quick start

```tsx
import { MapCanvas, type Marker } from '@krasandy/react-cockpit-map';

const markers: Marker[] = [
  { id: 'RTU-001', lat: 46.08, lng: 125.0, type: 'normal', iconKind: 'rtu',
    title: '采油厂 RTU-001', area: '第一采油厂', health: 92, vendor: '华为', model: 'AR502' },
  { id: 'EG-01', lat: 46.10, lng: 125.05, type: 'gateway', iconKind: 'gateway',
    title: '边缘网关 EG-01' },
];

export default function GisPage() {
  return (
    <MapCanvas
      markers={markers}
      center={[46.08, 125.0]}
      zoom={11}
      theme="dark"
      height={500}
      onMarkerClick={(m) => console.log('clicked:', m.id)}
    />
  );
}
```

### 7 real-world scenarios

This package was extracted from a real production project (Daqing Oilfield AI
Cockpit) and validated against 7 different page layouts:

| # | Scenario | Key props |
|---|----------|-----------|
| 1 | GIS single map (62 markers, layer filter) | `markers`, `fitOnLoad` |
| 2 | Big-screen dark cockpit (heat / scene / type) | `theme="dark"`, `colorMode` |
| 3 | Personnel realtime (scene color + hover popup) | `colorMode="scene"`, `areaCircles` |
| 4 | Person track (polyline + numbered labels) | `polyline`, `pointLabels` |
| 5 | Trace location (real-time flyTarget) | `flyTarget`, `popupInfo` |
| 6 | Device detail (single point + rich popup) | 6 popup fields |
| 7 | Pipeline stake map (click → topology expand) | `onMarkerClick` |

All 7 are demonstrated in `examples/vite-demo/`.

### Props reference

```typescript
interface MapCanvasProps {
  markers?: Marker[];
  center?: [number, number];           // default [46.08, 125.0]
  zoom?: number;                        // default 9
  height?: number | string;             // default 480
  theme?: 'light' | 'dark';             // default 'light'
  loading?: boolean;
  fitOnLoad?: boolean;                  // default true
  onMarkerClick?: (m: Marker) => void;
  colorMode?: 'type' | 'scene' | 'heat'; // default 'type'
  polyline?: { points: [number, number][]; color?: string; weight?: number; dashArray?: string };
  pointLabels?: { positions: [number, number][]; color?: string; highlightIndex?: number; highlightColor?: string };
  areaCircles?: { lat: number; lng: number; radius: number; label: string; color?: string; count?: number }[];
  flyTarget?: [number, number];
  popupInfo?: { lat: number; lng: number; content: string } | null;
}

interface Marker {
  id: string; lat: number; lng: number;
  type: 'normal' | 'alert' | 'offline' | 'gateway' | 'drone' | 'person';
  iconKind?: DeviceIconKind;
  parentGatewayId?: string;
  scene?: 'production' | 'equipment' | 'network' | 'pipeline' | 'env';
  intensity?: number;
  title?: string; popup?: string;
  area?: string; vendor?: string; model?: string;
  health?: number; deviceType?: string; manager?: string;
}

type DeviceIconKind =
  | 'well' | 'station' | 'pipeline' | 'storage' | 'pump'
  | 'camera' | 'thermal' | 'mobileball'
  | 'sensor' | 'rtu' | 'beidou' | 'probe' | 'flow' | 'handheld'
  | 'gateway' | 'drone' | 'person' | 'alert';
```

### forwardRef handle

```tsx
const mapRef = useRef<MapCanvasHandle>(null);

useEffect(() => {
  // Fly to a specific point from outside (e.g
  // when a list item is clicked)
  mapRef.current?.flyTo(46.08, 125.0, 14);
}, []);

<MapCanvas ref={mapRef} markers={markers} />
```

### Customization

#### Override CSS variables (project-level theming)

```css
:root {
  --bg-3: #0a1426;
  --color-primary: #1890ff;
  --font-family-num: 'JetBrains Mono', monospace;
}
```

All variables have fallback defaults — works without any setup.

#### Add your own device icon

```tsx
import { ICON_PATHS } from '@krasandy/react-cockpit-map';

// ICON_PATHS is a Record<DeviceIconKind, string> — you can fork and modify
// Note: this package exports ICON_PATHS, KIND_LABEL so you can ship your own
// custom preset by wrapping MapCanvas.
```

### Why Vite library mode + `cssCodeSplit: false`

Netlify Drop deployment of Vite builds sometimes returns `index.html` (655
bytes) when an async CSS chunk URL is requested — the browser refuses to
parse HTML as CSS, and your leaflet container has height 0 → invisible map.

This package builds with `cssCodeSplit: false` (single CSS file, already
linked from `index.html`). Combined with the **inline leaflet.css** strategy,
zero external CSS requests are needed at runtime → deployment reliability is
absolute.

### License

MIT © 2026 KrasAndy

---

## 中文

### 为什么有这个包

中国地图 app 海外发布(Netlify / Vercel / Cloudflare Pages)会遇到 3 个经典坑:

1. **瓦片 DNS** — `is.autonavi.com` 在欧美节点无法解析
2. **Leaflet CSS 丢失** — Vite 把 leaflet.css 切成独立 chunk;Netlify Drop 偶发
   把这个 CSS chunk URL 返回成 index.html(655 字节),浏览器拒绝解析 → 地图空白
3. **错误反馈缺失** — 用户只看到"灰底地图",不知道为什么

本包一次性解决:

| 痛点 | 方案 |
|------|------|
| 高德 DNS | 4 CDN 并行 probe(高德矢量 / 高德卫星 / 腾讯 / OSM),第一个可达胜出 |
| 单 CDN 失败 | 累积 4 次 tileerror 后切换下一个 CDN(800ms debounce) |
| 全部失败 | 显示 DNS 错误占位 UI + 排查建议 |
| Leaflet CSS chunk 丢失 | **`?inline` 把 leaflet.css 内联到 bundle**,零外部 CSS 请求 |
| 暗色瓦片 | CSS grayscale + brightness + invert + hue-rotate 滤镜 |
| 17 类设备 icon | 手写 24×24 SVG path 集,纯 stroke,currentColor |

### 安装

```bash
npm install @krasandy/react-cockpit-map leaflet
```

### 快速开始

```tsx
import { MapCanvas, type Marker } from '@krasandy/react-cockpit-map';

const markers: Marker[] = [
  { id: 'RTU-001', lat: 46.08, lng: 125.0, type: 'normal', iconKind: 'rtu',
    title: '采油厂 RTU-001', health: 92 },
];

<MapCanvas markers={markers} theme="dark" height={500} />
```

### 7 个真实使用场景

Derived from production React dashboard experience, validated across 7 different page layouts:

| # | 场景 | 关键 props |
|---|------|-----------|
| 1 | GIS 一张图(62 个 marker,图层过滤) | `markers`, `fitOnLoad` |
| 2 | 大屏暗色驾驶舱(heat/scene/type 切换) | `theme="dark"`, `colorMode` |
| 3 | 实时人员分布(scene 色 + 悬浮 popup) | `colorMode="scene"`, `areaCircles` |
| 4 | 人员轨迹回放(折线 + 数字标签) | `polyline`, `pointLabels` |
| 5 | 定位总览(实时飞向) | `flyTarget`, `popupInfo` |
| 6 | 设备详情(单点 + 丰富 popup) | 6 字段 popup |
| 7 | 管线桩地图(点击展开拓扑) | `onMarkerClick` |

详见 `examples/vite-demo/`。

### 自定义

#### 覆盖 CSS 变量(项目级主题)

```css
:root {
  --bg-3: #0a1426;
  --color-primary: #1890ff;
}
```

所有变量都有 fallback 默认值,零配置即可工作。

#### 自定义设备图标

```tsx
import { ICON_PATHS, KIND_LABEL } from '@krasandy/react-cockpit-map';
// 拿到后 fork 修改,或包一层自己的 preset
```

### 为什么不切 CSS chunk

`vite.config.ts` 设置 `cssCodeSplit: false`,理由见上(Netlify Drop CSS 丢失
问题)。配合 `?inline` 把 leaflet.css 内联进 JS,运行时零外部 CSS 请求 → 部署
绝对可靠。

### 协议

MIT © 2026 KrasAndy