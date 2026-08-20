// === react-cockpit-map types ===
// 独立维护,不再依赖主项目 mock/gis.ts
// 从 8.1.2/8.3.x/15.3.1 等 17 类设备场景提炼

/**
 * 设备图标种类 — 覆盖工业油田全域感知采集层 + 边缘网关 + 巡检力量
 *
 * 17 类 docx 设备 + 巡检人员 + 告警点位 = 18 种
 * 原项目来源:src/mock/gis.ts:5-23
 */
export type DeviceIconKind =
  | 'well' // 采油井
  | 'station' // 联合站 / 转油站
  | 'pipeline' // 管线桩
  | 'storage' // 储油罐
  | 'pump' // 加热炉 / 分离器 / 泵房
  | 'camera' // 固定 AI 高清摄像头
  | 'thermal' // 红外热成像摄像头
  | 'mobileball' // 移动布控球
  | 'sensor' // 振动/温度/可燃气体/液位传感器
  | 'rtu' // RTU 采集终端
  | 'beidou' // 北斗 RTK 定位终端
  | 'probe' // 工业网络探针
  | 'flow' // 内网流量采集器
  | 'handheld' // 防爆手持运维终端
  | 'gateway' // 边缘网关
  | 'drone' // 巡检无人机
  | 'person' // 巡检人员
  | 'alert'; // 告警点位(专用三角形警告图标)

/** 5 大场景 — 用于 colorMode='scene' 着色 */
export type Scene =
  | 'production'
  | 'equipment'
  | 'network'
  | 'pipeline'
  | 'env';

/** Marker 数据类型 — 地图上一个点位 */
export interface Marker {
  id: string;
  lat: number;
  lng: number;
  type: 'normal' | 'alert' | 'offline' | 'gateway' | 'drone' | 'person';
  /** 设备图标种类(决定 SVG icon) */
  iconKind?: DeviceIconKind;
  /** 所属边缘网关 ID(用于归属关系拓扑) */
  parentGatewayId?: string;
  /** 5 大场景归属,用于 colorMode='scene' 时着色 */
  scene?: Scene;
  /** 热力图模式用:0-1 强度 */
  intensity?: number;
  title?: string;
  popup?: string;
  /** 区域 / 位置(用于 popup 详情) */
  area?: string;
  /** 厂商 */
  vendor?: string;
  /** 型号 */
  model?: string;
  /** 健康度 0-100 */
  health?: number;
  /** 设备类型中文名(可覆盖 KIND_LABEL) */
  deviceType?: string;
  /** 负责人 */
  manager?: string;
}

/** 折线覆盖物(轨迹、人员路径、管线段) */
export interface PolylineOverlay {
  points: [number, number][];
  color?: string;
  weight?: number;
  dashArray?: string;
}

/** 数字点位标签(轨迹节点序号) */
export interface PointLabels {
  positions: [number, number][];
  color?: string;
  highlightIndex?: number;
  highlightColor?: string;
}

/** 区域圆圈标注 */
export interface AreaCircle {
  lat: number;
  lng: number;
  radius: number;
  label: string;
  color?: string;
  count?: number;
}

/** 自动弹出的 popup 信息(null 时关闭) */
export interface PopupInfo {
  lat: number;
  lng: number;
  content: string;
}

/** 主题 */
export type Theme = 'light' | 'dark';

/** 点位着色模式 */
export type ColorMode = 'type' | 'scene' | 'heat';

/** MapCanvas Props */
export interface MapCanvasProps {
  markers?: Marker[];
  center?: [number, number];
  zoom?: number;
  height?: number | string;
  theme?: Theme;
  loading?: boolean;
  /** true(默认):markers 首次加载后自动 fitBounds */
  fitOnLoad?: boolean;
  /** 点击 marker 时回调 */
  onMarkerClick?: (m: Marker) => void;
  /** 点位着色模式 */
  colorMode?: ColorMode;
  /** 折线覆盖物 */
  polyline?: PolylineOverlay;
  /** 数字点位标签 */
  pointLabels?: PointLabels;
  /** 区域圆圈标注 */
  areaCircles?: AreaCircle[];
  /** 飞行目标点位(触发 map.flyTo) */
  flyTarget?: [number, number];
  /** 自动弹出的 popup 信息(null 时关闭) */
  popupInfo?: PopupInfo | null;
}

/** forwardRef 暴露的方法 */
export interface MapCanvasHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  openPopup: (lat: number, lng: number, content: string) => void;
}