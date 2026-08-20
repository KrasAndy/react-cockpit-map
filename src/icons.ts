// === react-cockpit-map 设备 SVG icons ===
// 来源:原项目 MapCanvas.tsx 行 85-234,17 类设备 SVG path + 中文标签
// 24x24 viewBox,stroke-based,currentColor 由 CSS 状态类决定

import type { DeviceIconKind } from './types';

/** Round 27: iconKind → 中文标签(popup 显示用) */
export const KIND_LABEL: Record<DeviceIconKind, string> = {
  well: '采油井',
  station: '联合站 / 转油站',
  pipeline: '管线桩',
  storage: '储油罐',
  pump: '加热炉 / 分离器 / 泵房',
  camera: '固定 AI 高清摄像头',
  thermal: '红外热成像摄像头',
  mobileball: '移动布控球',
  sensor: '传感器',
  rtu: 'RTU 采集终端',
  beidou: '北斗 RTK 定位终端',
  probe: '工业网络探针',
  flow: '内网流量采集器',
  handheld: '防爆手持运维终端',
  gateway: '边缘网关',
  drone: '巡检无人机',
  person: '巡检人员',
  alert: '告警点位',
};

/** 设备图标 SVG path(24x24 viewBox,stroke-based,currentColor) */
export const ICON_PATHS: Record<DeviceIconKind, string> = {
  // 采油井 — A 字形井架 + 钻杆
  well:
    '<path d="M5 21 L12 4 L19 21" />' +
    '<line x1="8" y1="21" x2="16" y2="21" />' +
    '<line x1="12" y1="4" x2="12" y2="15" />',
  // 联合站 / 转油站 — 双罐 + 立罐组合
  station:
    '<ellipse cx="9" cy="9" rx="4" ry="1.6" />' +
    '<line x1="5" y1="9" x2="5" y2="18" />' +
    '<line x1="13" y1="9" x2="13" y2="18" />' +
    '<ellipse cx="9" cy="18" rx="4" ry="1.6" />' +
    '<ellipse cx="17" cy="13" rx="3" ry="1.2" />' +
    '<line x1="14" y1="13" x2="14" y2="20" />' +
    '<line x1="20" y1="13" x2="20" y2="20" />' +
    '<ellipse cx="17" cy="20" rx="3" ry="1.2" />',
  // 管线桩 — 双横线 + 桩点
  pipeline:
    '<line x1="3" y1="9" x2="21" y2="9" />' +
    '<line x1="3" y1="15" x2="21" y2="15" />' +
    '<circle cx="6" cy="9" r="1.4" />' +
    '<circle cx="6" cy="15" r="1.4" />' +
    '<circle cx="18" cy="9" r="1.4" />' +
    '<circle cx="18" cy="15" r="1.4" />',
  // 储油罐 — 立式圆柱 + 顶部封头 + 横纹
  storage:
    '<rect x="6" y="5" width="12" height="14" rx="0.6" />' +
    '<ellipse cx="12" cy="5" rx="6" ry="1.6" />' +
    '<line x1="6" y1="9" x2="18" y2="9" />' +
    '<line x1="6" y1="13" x2="18" y2="13" />',
  // 加热炉 / 分离器 / 泵房 — 圆形 + 表针 + 进出管
  pump:
    '<circle cx="12" cy="12" r="5" />' +
    '<path d="M12 12 L12 7" />' +
    '<path d="M12 12 L15.5 12" />' +
    '<line x1="12" y1="3" x2="12" y2="5" />' +
    '<line x1="3" y1="12" x2="5" y2="12" />',
  // 固定 AI 高清摄像头 — 镜头 + 镜头筒
  camera:
    '<rect x="3" y="8" width="11" height="8" rx="1" />' +
    '<path d="M14 10 L19 7 L19 17 L14 14" />' +
    '<circle cx="8" cy="12" r="2" />' +
    '<circle cx="8" cy="12" r="0.6" fill="currentColor" />',
  // 红外热成像 — 摄像头 + 温度波纹
  thermal:
    '<rect x="3" y="8" width="11" height="8" rx="1" />' +
    '<path d="M14 10 L19 7 L19 17 L14 14" />' +
    '<path d="M19 12 Q22 10.5 22 12 Q22 13.5 19 13.5" />',
  // 移动布控球 — 球形镜头 + 三角架底
  mobileball:
    '<circle cx="12" cy="9" r="4" />' +
    '<circle cx="12" cy="9" r="1.6" />' +
    '<path d="M7 13 L7 19 L17 19 L17 13" />' +
    '<line x1="12" y1="13" x2="12" y2="19" />',
  // 通用传感器 — 方框 + 中心圆 + 四向引脚
  sensor:
    '<rect x="6" y="6" width="12" height="12" rx="1" />' +
    '<circle cx="12" cy="12" r="3" />' +
    '<line x1="3" y1="12" x2="6" y2="12" />' +
    '<line x1="18" y1="12" x2="21" y2="12" />' +
    '<line x1="12" y1="3" x2="12" y2="6" />' +
    '<line x1="12" y1="18" x2="12" y2="21" />',
  // RTU 采集终端 — 工业控制箱 + LED 指示
  rtu:
    '<rect x="4" y="6" width="16" height="12" rx="0.8" />' +
    '<line x1="4" y1="10" x2="20" y2="10" />' +
    '<line x1="4" y1="14" x2="20" y2="14" />' +
    '<circle cx="7" cy="8" r="0.5" fill="currentColor" />' +
    '<circle cx="7" cy="12" r="0.5" fill="currentColor" />' +
    '<circle cx="7" cy="16" r="0.5" fill="currentColor" />' +
    '<line x1="11" y1="8" x2="18" y2="8" />' +
    '<line x1="11" y1="12" x2="18" y2="12" />' +
    '<line x1="11" y1="16" x2="18" y2="16" />',
  // 北斗 RTK — 卫星天线(伞形)+ 接收机基座
  beidou:
    '<path d="M12 10 L7 14 L17 14 Z" />' +
    '<line x1="12" y1="4" x2="12" y2="10" />' +
    '<path d="M9 7 L15 7" />' +
    '<circle cx="12" cy="5" r="0.8" fill="currentColor" />' +
    '<rect x="7" y="17" width="10" height="4" rx="0.5" />' +
    '<line x1="9" y1="19" x2="15" y2="19" />',
  // 工业网络探针 — 盾形 + 内部对勾
  probe:
    '<path d="M12 3 L20 6 L20 12 Q20 18 12 21 Q4 18 4 12 L4 6" />' +
    '<path d="M9 12 L11 14 L15 10" />',
  // 内网流量采集器 — 圆形流量计 + 内部 S 形流体
  flow:
    '<circle cx="12" cy="12" r="6" />' +
    '<path d="M9 12 Q12 9 15 12 Q12 15 9 12" />' +
    '<line x1="3" y1="12" x2="6" y2="12" />' +
    '<line x1="18" y1="12" x2="21" y2="12" />',
  // 防爆手持运维终端 — PDA + 屏幕 + 按键
  handheld:
    '<rect x="7" y="3" width="10" height="14" rx="1" />' +
    '<rect x="9" y="5" width="6" height="6" />' +
    '<circle cx="12" cy="14" r="0.6" fill="currentColor" />' +
    '<circle cx="9" cy="15.5" r="0.4" fill="currentColor" />' +
    '<circle cx="15" cy="15.5" r="0.4" fill="currentColor" />',
  // 边缘网关 — 1U 服务器机架
  gateway:
    '<rect x="3" y="6" width="18" height="12" rx="0.8" />' +
    '<line x1="3" y1="10" x2="21" y2="10" />' +
    '<line x1="3" y1="14" x2="21" y2="14" />' +
    '<circle cx="6" cy="8" r="0.5" fill="currentColor" />' +
    '<circle cx="6" cy="12" r="0.5" fill="currentColor" />' +
    '<circle cx="6" cy="16" r="0.5" fill="currentColor" />' +
    '<line x1="10" y1="8" x2="19" y2="8" />' +
    '<line x1="10" y1="12" x2="19" y2="12" />' +
    '<line x1="10" y1="16" x2="19" y2="16" />',
  // 巡检无人机 — 4 螺旋桨俯视图 + 中心方块
  drone:
    '<rect x="10" y="10" width="4" height="4" rx="0.4" />' +
    '<circle cx="5" cy="5" r="2.4" />' +
    '<circle cx="19" cy="5" r="2.4" />' +
    '<circle cx="5" cy="19" r="2.4" />' +
    '<circle cx="19" cy="19" r="2.4" />' +
    '<line x1="7" y1="7" x2="10" y2="10" />' +
    '<line x1="17" y1="7" x2="14" y2="10" />' +
    '<line x1="7" y1="17" x2="10" y2="14" />' +
    '<line x1="17" y1="17" x2="14" y2="14" />',
  // 巡检人员 — 头 + 肩
  person: '<circle cx="12" cy="7" r="3" />' + '<path d="M5 21 Q5 13 12 13 Q19 13 19 21" />',
  // 告警 — 三角形警告
  alert:
    '<path d="M12 4 L21 20 L3 20 Z" />' +
    '<line x1="12" y1="10" x2="12" y2="14" />' +
    '<circle cx="12" cy="17" r="0.6" fill="currentColor" />',
};