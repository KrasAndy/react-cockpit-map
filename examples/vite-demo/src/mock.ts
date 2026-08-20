// === Mock data for 7 demo scenarios ===
// 模拟主项目的 7 个页面使用场景

import type { Marker } from '@krasandy/react-cockpit-map';

const DAQING_CENTER: [number, number] = [46.08, 125.0];

/** 随机偏移生成点位(围绕中心点) */
function offset(c: [number, number], dlat: number, dlng: number): [number, number] {
  return [c[0] + dlat, c[1] + dlng];
}

// === 1. GIS single map markers (62 个) ===
export const gisMarkers: Marker[] = [
  // 12 网关
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `EG-${String(i + 1).padStart(2, '0')}`,
    lat: DAQING_CENTER[0] + (Math.random() - 0.5) * 0.15,
    lng: DAQING_CENTER[1] + (Math.random() - 0.5) * 0.4,
    type: 'gateway' as const,
    iconKind: 'gateway' as const,
    scene: 'production' as const,
    title: `边缘网关 EG-${String(i + 1).padStart(2, '0')}`,
    deviceType: '边缘网关',
    area: '第一采油厂',
    health: 75 + Math.floor(Math.random() * 25),
    vendor: '华为',
    model: 'AR502',
    manager: '王立新',
  })),
  // 28 主力设备(各种 iconKind)
  ...Array.from({ length: 28 }, (_, i) => {
    const kinds: Marker['iconKind'][] = ['well', 'station', 'pipeline', 'storage', 'pump', 'camera', 'sensor'];
    const kind = kinds[i % kinds.length];
    return {
      id: `D-${String(i + 1).padStart(3, '0')}`,
      lat: DAQING_CENTER[0] + (Math.random() - 0.5) * 0.15,
      lng: DAQING_CENTER[1] + (Math.random() - 0.5) * 0.4,
      type: 'normal' as const,
      iconKind: kind,
      parentGatewayId: `EG-${String((i % 12) + 1).padStart(2, '0')}`,
      scene: 'production' as const,
      title: `${kind}-${String(i + 1).padStart(3, '0')}`,
      deviceType: kind,
      health: 60 + Math.floor(Math.random() * 40),
    };
  }),
  // 6 无人机
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `UAV-${String(i + 1).padStart(2, '0')}`,
    lat: DAQING_CENTER[0] + (Math.random() - 0.5) * 0.15,
    lng: DAQING_CENTER[1] + (Math.random() - 0.5) * 0.4,
    type: 'drone' as const,
    iconKind: 'drone' as const,
    scene: 'equipment' as const,
    title: `巡检无人机 UAV-${String(i + 1).padStart(2, '0')}`,
    deviceType: '巡检无人机',
  })),
  // 8 人员
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `P-${String(i + 1).padStart(2, '0')}`,
    lat: DAQING_CENTER[0] + (Math.random() - 0.5) * 0.15,
    lng: DAQING_CENTER[1] + (Math.random() - 0.5) * 0.4,
    type: 'person' as const,
    iconKind: 'person' as const,
    scene: 'production' as const,
    title: `巡检员 王${i + 1}`,
    deviceType: '巡检人员',
    manager: `王${i + 1}`,
  })),
];

// === 2. Big screen dark (subset + alert) ===
export const bigScreenMarkers: Marker[] = gisMarkers.slice(0, 40).concat([
  {
    id: 'ALERT-001',
    lat: DAQING_CENTER[0] + 0.02,
    lng: DAQING_CENTER[1] - 0.01,
    type: 'alert',
    iconKind: 'alert',
    scene: 'production',
    title: '联合站压力异常告警',
    deviceType: '告警点位',
    health: 25,
  },
]);

// === 3. Personnel realtime (10 person + areaCircles) ===
export const personnelMarkers: Marker[] = Array.from({ length: 10 }, (_, i) => ({
  id: `PERSON-${String(i + 1).padStart(2, '0')}`,
  lat: DAQING_CENTER[0] + (Math.random() - 0.5) * 0.1,
  lng: DAQING_CENTER[1] + (Math.random() - 0.5) * 0.2,
  type: 'person',
  iconKind: 'person',
  scene: 'production',
  title: `在线人员 ${i + 1}`,
}));

export const personnelAreaCircles = [
  { lat: DAQING_CENTER[0] + 0.05, lng: DAQING_CENTER[1] + 0.1, radius: 3000, label: '第一采油厂', color: '#1890ff', count: 3 },
  { lat: DAQING_CENTER[0] - 0.03, lng: DAQING_CENTER[1] - 0.05, radius: 3000, label: '联合站', color: '#13c2c2', count: 2 },
  { lat: DAQING_CENTER[0] + 0.02, lng: DAQING_CENTER[1] + 0.05, radius: 2500, label: '管线区', color: '#fa8c16', count: 5 },
];

// === 4. Person track (polyline + pointLabels) ===
const trackPoints: [number, number][] = [
  offset(DAQING_CENTER, 0, 0),
  offset(DAQING_CENTER, 0.005, 0.01),
  offset(DAQING_CENTER, 0.012, 0.02),
  offset(DAQING_CENTER, 0.018, 0.03),
  offset(DAQING_CENTER, 0.025, 0.04),
  offset(DAQING_CENTER, 0.03, 0.05),
];

export const personTrack = {
  polyline: { points: trackPoints, color: '#1677ff', weight: 3 },
  pointLabels: {
    positions: trackPoints,
    color: '#1677ff',
    highlightIndex: 4,
    highlightColor: '#fa8c16',
  },
};

// === 5. Trace location (Beidou terminals) ===
export const beidouMarkers: Marker[] = Array.from({ length: 8 }, (_, i) => ({
  id: `BD-${String(i + 1).padStart(2, '0')}`,
  lat: DAQING_CENTER[0] + (Math.random() - 0.5) * 0.08,
  lng: DAQING_CENTER[1] + (Math.random() - 0.5) * 0.15,
  type: 'normal',
  iconKind: 'beidou',
  scene: 'equipment',
  title: `北斗定位终端 BD-${String(i + 1).padStart(2, '0')}`,
  deviceType: '北斗 RTK 定位终端',
  health: 85 + Math.floor(Math.random() * 15),
}));

// === 6. Device detail (single rich point) ===
export const deviceDetail: Marker = {
  id: 'RTU-003',
  lat: DAQING_CENTER[0] + 0.005,
  lng: DAQING_CENTER[1] + 0.01,
  type: 'alert',
  iconKind: 'rtu',
  scene: 'production',
  title: 'RTU-003 数据采集终端',
  deviceType: 'RTU 采集终端',
  area: '第一采油厂 8 号区块',
  vendor: '华为',
  model: 'AR502H',
  health: 25,
  manager: '王立新',
  parentGatewayId: 'EG-03',
};

// === 7. Pipeline stake (clickable for topology) ===
export const pipelineMarkers: Marker[] = Array.from({ length: 20 }, (_, i) => ({
  id: `PS-${String(i + 1).padStart(3, '0')}`,
  lat: DAQING_CENTER[0] + (i - 10) * 0.008,
  lng: DAQING_CENTER[1] + Math.sin(i * 0.5) * 0.1,
  type: i === 8 ? 'alert' : 'normal',
  iconKind: 'pipeline',
  scene: 'pipeline',
  title: `管线桩 PS-${String(i + 1).padStart(3, '0')}`,
  deviceType: '管线桩',
  health: i === 8 ? 35 : 80 + Math.floor(Math.random() * 20),
}));