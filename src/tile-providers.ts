// === react-cockpit-map tile providers ===
// 多 CDN probe + 多层 fallback(R42-R46 演进)
// 来源:原项目 MapCanvas.tsx 行 1085-1248

import L from 'leaflet';

export interface CdnConfig {
  name: string;
  url: string;
  subdomains: string[];
  attribution: string;
  maxZoom: number;
}

/**
 * 国内优先(按 docs/地图API调研.md 实测:高德子域必须带 0 前缀才解析得到)
 *  - webrd1/2/3/4.is.autonavi.com → DNS NXDOMAIN
 *  - webrd01/02/03.is.autonavi.com → HTTP 200
 */
export const CDN_LIST: CdnConfig[] = [
  {
    name: '高德矢量',
    url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    subdomains: ['1', '2', '3'],
    attribution: '© 高德地图',
    maxZoom: 18,
  },
  {
    name: '高德卫星',
    url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
    subdomains: ['1', '2', '3'],
    attribution: '© 高德卫星',
    maxZoom: 18,
  },
  {
    name: '腾讯地图',
    // 标准腾讯 tile URL 必须带 version=400 (防盗链),否则返回 400
    url: 'https://p{s}.map.gtimg.com/{z}/{x}/{y}.png?version=400',
    subdomains: ['2', '3'],
    attribution: '© 腾讯地图',
    maxZoom: 18,
  },
  {
    name: 'OSM',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: '© OpenStreetMap',
    maxZoom: 19,
  },
];

/** 单个 CDN 探测超时 */
const PROBE_TIMEOUT_MS = 1500;

/** 错误阈值 — 累积多少 tileerror 后切换 */
const ERR_THRESHOLD = 4;

/** 切换 CDN 延迟(让用户看到 loading 状态) */
const SWITCH_DELAY_MS = 800;

/**
 * Probe 单个 CDN — 用 Image 加载一张固定瓦片,z=2 x=1 y=1(覆盖面广)
 * 返回 boolean 表示是否可达
 */
export function probeCdn(cdn: CdnConfig): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = window.setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      resolve(false);
    }, PROBE_TIMEOUT_MS);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(true);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(false);
    };
    const sub = cdn.subdomains[0] || '';
    img.src = cdn.url
      .replace('{s}', sub)
      .replace('{z}', '2')
      .replace('{x}', '1')
      .replace('{y}', '1');
  });
}

/** Tile providers 控制器,封装 probe + 切换 + 错误占位 */
export class TileProviderController {
  private currentCdnIndex = 0;
  private activeTileLayer: L.TileLayer | null = null;
  private readonly errCounts: number[] = CDN_LIST.map(() => 0);
  private switchTimer: number | null = null;
  private readonly container: HTMLElement;
  private readonly map: L.Map;

  constructor(map: L.Map, container: HTMLElement) {
    this.map = map;
    this.container = container;
  }

  /** 启动 probe + 加载初始 CDN */
  start(): void {
    void (async (): Promise<void> => {
      const probeResults = await Promise.all(CDN_LIST.map(probeCdn));
      // 异步返回时,map 可能已被 remove() 销毁
      if (!this.map.getContainer() || !this.map.getPane('mapPane')) return;
      const firstReachable = probeResults.findIndex((ok) => ok);
      this.currentCdnIndex = firstReachable >= 0 ? firstReachable : 0;
      const initialCdn = CDN_LIST[this.currentCdnIndex];
      try {
        this.activeTileLayer = L.tileLayer(initialCdn.url, {
          attribution: initialCdn.attribution,
          subdomains: initialCdn.subdomains,
          maxZoom: initialCdn.maxZoom,
          keepBuffer: 2,
        }).addTo(this.map);
      } catch (err) {
        console.warn('[react-cockpit-map] tileLayer addTo 失败', err);
        this.showTileErrorOverlay();
        return;
      }
      this.attachActiveLayerErrorListener();

      if (firstReachable < 0) {
        this.showTileErrorOverlay();
      }
    })();
  }

  /** 销毁 — 清掉 timer + active layer */
  destroy(): void {
    if (this.switchTimer !== null) {
      window.clearTimeout(this.switchTimer);
      this.switchTimer = null;
    }
    if (this.activeTileLayer && this.map.hasLayer(this.activeTileLayer)) {
      this.map.removeLayer(this.activeTileLayer);
    }
    this.activeTileLayer = null;
  }

  /** 显示错误占位 UI */
  private showTileErrorOverlay(): void {
    if (this.container.querySelector('.tile-error-overlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'tile-error-overlay';
    overlay.innerHTML = [
      '<div class="tile-error-box">',
      '  <div class="tile-error-icon">⚠</div>',
      '  <div class="tile-error-title">地图瓦片加载失败</div>',
      '  <div class="tile-error-sub">所有备用 CDN 不可达 (腾讯 / 高德 / OSM)</div>',
      '  <div class="tile-error-hint">可能原因:DNS 解析失败 / 公司网络拦截</div>',
      '  <div class="tile-error-hint">建议:本机改 DNS 为 114.114.114.114 或 223.5.5.5</div>',
      '</div>',
    ].join('');
    this.container.appendChild(overlay);
  }

  /** 监听当前 active layer 的 tileerror,累积到阈值切换 */
  private attachActiveLayerErrorListener(): void {
    if (!this.activeTileLayer) return;
    this.activeTileLayer.on('tileerror', () => {
      if (this.currentCdnIndex >= CDN_LIST.length) return;
      this.errCounts[this.currentCdnIndex] += 1;
      if (
        this.errCounts[this.currentCdnIndex] >= ERR_THRESHOLD &&
        this.switchTimer === null
      ) {
        this.switchTimer = window.setTimeout(() => this.switchToNextCdn(), SWITCH_DELAY_MS);
      }
    });
  }

  /** 切换到下一个 CDN(找不到可达的就显示错误占位) */
  private switchToNextCdn(): void {
    if (this.switchTimer !== null) {
      window.clearTimeout(this.switchTimer);
      this.switchTimer = null;
    }
    if (this.currentCdnIndex >= CDN_LIST.length - 1) {
      this.showTileErrorOverlay();
      return;
    }
    this.currentCdnIndex += 1;
    if (this.activeTileLayer && this.map.hasLayer(this.activeTileLayer)) {
      this.map.removeLayer(this.activeTileLayer);
    }
    const cdn = CDN_LIST[this.currentCdnIndex];
    this.activeTileLayer = L.tileLayer(cdn.url, {
      attribution: cdn.attribution,
      subdomains: cdn.subdomains,
      maxZoom: cdn.maxZoom,
      keepBuffer: 2,
    }).addTo(this.map);
    this.attachActiveLayerErrorListener();
  }
}