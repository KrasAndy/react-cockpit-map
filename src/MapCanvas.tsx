// === react-cockpit-map main component ===
// 来源:原项目 src/components/MapCanvas/MapCanvas.tsx (1722 行)
// 提炼:17 类设备 + 4 CDN fallback + popup + 拓扑 + 脉冲 + 暗色 cockpit
// 移除:antd Spin → CSS spinner(本文件内联 .spinner class)
// 单文件交付,逻辑紧凑,易于审计

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import L from 'leaflet';
import { injectLeafletStyles } from './inject-styles';
import { TileProviderController } from './tile-providers';
import { ICON_PATHS, KIND_LABEL } from './icons';
import type {
  DeviceIconKind,
  MapCanvasHandle,
  MapCanvasProps,
  Marker,
} from './types';
import leafletOverridesText from './leaflet-overrides.css?inline';
import styles from './MapCanvas.module.css';

// === R32: divIcon 缓存(按 kind+status 维度,命中跳过 L.divIcon 实例化) ===
const divIconCache = new Map<string, L.DivIcon>();

/** 构造 L.divIcon(白底圆 + SVG icon + 状态色描边) */
function deviceIcon(kind: DeviceIconKind, status: Marker['type']): L.DivIcon {
  const statusClass =
    status === 'alert'
      ? 'map-marker-icon--alert'
      : status === 'offline'
        ? 'map-marker-icon--offline'
        : status === 'gateway'
          ? 'map-marker-icon--gateway'
          : kind === 'drone'
            ? 'map-marker-icon--drone'
            : kind === 'person'
              ? 'map-marker-icon--person'
              : 'map-marker-icon--online';

  const cacheKey = `${kind}|${statusClass}`;
  const cached = divIconCache.get(cacheKey);
  if (cached) return cached;

  const html = `<div class="map-marker-icon ${statusClass}">
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[kind] ?? ICON_PATHS.sensor}</svg>
  </div>`;

  const icon = L.divIcon({
    className: 'map-marker-wrap',
    html,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
  divIconCache.set(cacheKey, icon);
  return icon;
}

/** 告警点位仍用 circleMarker pulse halo(独立于 icon) */
function alertHalo(latlng: [number, number], map: L.Map): L.CircleMarker {
  return L.circleMarker(latlng, {
    radius: 14,
    color: '#ff4d4f',
    weight: 1.5,
    fillColor: '#ff4d4f',
    fillOpacity: 0.3,
    className: 'alert-halo',
    interactive: false,
  }).addTo(map);
}

/** 根据 marker 状态返回连线颜色 */
function statusColor(m: Marker): string {
  if (m.type === 'alert' || m.iconKind === 'alert') return '#ff4d4f';
  if (m.iconKind === 'gateway' || m.type === 'gateway') return '#1890ff';
  if (m.iconKind === 'drone' || m.type === 'drone') return '#722ed1';
  if (m.iconKind === 'person' || m.type === 'person') return '#fa8c16';
  if (m.type === 'offline') return '#8c8c8c';
  return '#52c41a';
}

/** 构建 popup HTML */
function buildPopupHtml(m: Marker): string {
  const statusText = m.type === 'alert' ? '告警' : m.type === 'offline' ? '离线' : '在线';
  const statusBgColor = statusColor(m);
  const titleText = m.title || m.id;
  const typeText = m.deviceType || (m.iconKind ? KIND_LABEL[m.iconKind] : '设备');
  const areaText = m.area || '—';
  const vendorModel =
    m.vendor || m.model
      ? `${m.vendor ?? ''}${m.vendor && m.model ? ' · ' : ''}${m.model ?? ''}`
      : '';
  const health = typeof m.health === 'number' ? m.health : null;
  const healthBar =
    health !== null
      ? `<div style="display:flex;align-items:center;gap:6px;margin-top:3px">
         <span style="font-size:10px;color:#5a7da8;min-width:36px">健康度</span>
         <span style="flex:1;height:3px;background:rgba(140,168,208,0.12);position:relative;overflow:hidden">
           <span style="position:absolute;left:0;top:0;bottom:0;width:${health}%;background:${health >= 80 ? '#52c41a' : health >= 50 ? '#faad14' : '#ff4d4f'}"></span>
         </span>
         <span style="font-family:var(--font-family-num, system-ui);font-size:11px;color:#fff;min-width:32px;text-align:right">${health}</span>
       </div>`
      : '';
  return (
    `<div style="min-width:200px">` +
    `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px">` +
    `<div style="font-size:13px;font-weight:600;color:#fff;letter-spacing:0.5px">${titleText}</div>` +
    `<span style="font-size:10px;padding:1px 7px;border:1px solid ${statusBgColor};color:${statusBgColor};font-family:var(--font-family-num, system-ui);letter-spacing:0.5px">${statusText}</span>` +
    `</div>` +
    `<div style="display:inline-block;font-size:10px;padding:1px 7px;background:rgba(140,168,208,0.1);color:#8ca8d0;letter-spacing:0.5px;margin-bottom:8px">${typeText}</div>` +
    `<div style="display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:11px;line-height:1.5">` +
    `<span style="color:#5a7da8">编号</span><span style="color:#d9e6ff;font-family:var(--font-family-num, system-ui)">${m.id}</span>` +
    (vendorModel
      ? `<span style="color:#5a7da8">厂商</span><span style="color:#d9e6ff">${vendorModel}</span>`
      : '') +
    `<span style="color:#5a7da8">位置</span><span style="color:#d9e6ff">${areaText}</span>` +
    (m.manager
      ? `<span style="color:#5a7da8">负责人</span><span style="color:#d9e6ff">${m.manager}</span>`
      : '') +
    (m.parentGatewayId
      ? `<span style="color:#5a7da8">归属网关</span><span style="color:#1890ff;font-family:var(--font-family-num, system-ui)">${m.parentGatewayId}</span>`
      : '') +
    `</div>` +
    healthBar +
    `</div>`
  );
}

/**
 * MapCanvas — 主组件
 *
 * 17 类工业设备 SVG icon + 4 CDN tile fallback + 暗色 cockpit 风格
 * hover popup + click 拓扑展开 + pulse 动画
 */
export const MapCanvas = forwardRef<MapCanvasHandle, MapCanvasProps>(
  (
    {
      markers: markersProp = [],
      center: centerProp,
      zoom = 9,
      height = 480,
      theme = 'light',
      loading,
      fitOnLoad = true,
      onMarkerClick,
      colorMode = 'type',
      polyline,
      pointLabels,
      areaCircles,
      flyTarget,
      popupInfo,
    },
    ref,
  ) => {
    const divRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<Marker[]>(markersProp);
    markersRef.current = markersProp;

    // 默认中心点(北京/大庆附近)— 用户必填覆盖
    const defaultCenter: [number, number] = [46.08, 125.0];
    const center = centerProp ?? defaultCenter;

    // === forwardRef:暴露 flyTo / openPopup ===
    useImperativeHandle(
      ref,
      () => ({
        flyTo: (lat: number, lng: number, z = 12) => {
          mapRef.current?.flyTo([lat, lng], z, { duration: 1.5 });
        },
        openPopup: (lat: number, lng: number, content: string) => {
          const map = mapRef.current;
          if (!map) return;
          map.closePopup();
          const popup = L.popup().setLatLng([lat, lng]).setContent(content).addTo(map);
          map.openPopup(popup);
        },
      }),
      [],
    );

    const centerKey = useMemo(() => `${center[0]},${center[1]}`, [center]);

    // === R46:把 inline 进来的 leaflet.css + 暗色覆盖 注入到 <head> ===
    useEffect(() => {
      injectLeafletStyles(leafletOverridesText);
    }, []);

    const clickHandlerRef = useRef(onMarkerClick);
    useEffect(() => {
      clickHandlerRef.current = onMarkerClick;
    }, [onMarkerClick]);

    const fittedRef = useRef(false);

    // === Round 24: 选中 / hover 状态 refs ===
    const selectedMarkerIdRef = useRef<string | null>(null);
    const hoveredMarkerIdRef = useRef<string | null>(null);
    const markerByIdRef = useRef<Map<string, { marker: L.Marker; data: Marker }>>(new Map());
    const connectionLayersRef = useRef<{
      lines: L.Polyline[];
      circles: L.Layer[];
      extras: L.Layer[];
    }>({ lines: [], circles: [], extras: [] });
    const pulseWavesRef = useRef<Set<L.Marker>>(new Set());
    const pulseIntervalRef = useRef<number | null>(null);
    const tileControllerRef = useRef<TileProviderController | null>(null);

    // === Round 28: 脉冲波 — 沿连线流动 ===
    const startPulseBroadcast = () => {
      const map = mapRef.current;
      if (!map || pulseIntervalRef.current !== null) return;
      pulseIntervalRef.current = window.setInterval(() => {
        const activeLines = connectionLayersRef.current.lines;
        if (activeLines.length === 0) return;
        activeLines.forEach((line) => {
          // L.polyline([[a,b]]).getLatLngs() 可能返回 LatLng[] 或 LatLng[][]
          // 我们画的都是 2 点直线,取第一段即可
          const raw = line.getLatLngs?.() as L.LatLng[] | L.LatLng[][] | undefined;
          const flat: L.LatLng[] = Array.isArray(raw?.[0])
            ? ((raw as L.LatLng[][])[0] ?? [])
            : ((raw as L.LatLng[]) ?? []);
          if (flat.length < 2) return;
          const start = flat[0];
          const end = flat[flat.length - 1];
          const color = (line.options.color as string) ?? '#52c41a';
          const dy = end.lat - start.lat;
          const dx = end.lng - start.lng;
          const angleRad = Math.atan2(dy, dx);
          const angleDeg = (angleRad * 180) / Math.PI + 90;

          const wave = L.marker([start.lat, start.lng], {
            icon: L.divIcon({
              className: 'pulse-lens-wrap',
              html:
                `<div style="color:${color};transform:rotate(${angleDeg}deg)">` +
                `<div class="pulse-lens-halo"></div>` +
                `<div class="pulse-lens-glow"></div>` +
                `<div class="pulse-lens-core"></div>` +
                `</div>`,
              iconSize: [22, 4],
              iconAnchor: [11, 2],
            }),
            interactive: false,
          }).addTo(map);
          pulseWavesRef.current.add(wave);
          // 沿连线动画移动(raf)
          const startTime = performance.now();
          const duration = 1800;
          const animate = () => {
            const elapsed = performance.now() - startTime;
            const t = Math.min(elapsed / duration, 1);
            const lat = start.lat + (end.lat - start.lat) * t;
            const lng = start.lng + (end.lng - start.lng) * t;
            wave.setLatLng([lat, lng]);
            if (t < 1) {
              requestAnimationFrame(animate);
            } else {
              pulseWavesRef.current.delete(wave);
              map.removeLayer(wave);
            }
          };
          requestAnimationFrame(animate);
        });
      }, 3000);
    };

    const stopPulseBroadcast = () => {
      const map = mapRef.current;
      if (pulseIntervalRef.current !== null) {
        window.clearInterval(pulseIntervalRef.current);
        pulseIntervalRef.current = null;
      }
      pulseWavesRef.current.forEach((w) => map?.removeLayer(w));
      pulseWavesRef.current.clear();
    };

    const clearConnections = () => {
      const map = mapRef.current;
      if (!map) return;
      stopPulseBroadcast();
      connectionLayersRef.current.lines.forEach((l) => map.removeLayer(l));
      connectionLayersRef.current.circles.forEach((c) => map.removeLayer(c));
      connectionLayersRef.current.extras.forEach((e) => map.removeLayer(e));
      connectionLayersRef.current = { lines: [], circles: [], extras: [] };
      markerByIdRef.current.forEach(({ marker }) => {
        const inner = marker.getElement()?.querySelector('.map-marker-icon');
        inner?.classList.remove('map-marker-icon--active', 'map-marker-icon--dimmed');
      });
      selectedMarkerIdRef.current = null;
    };

    /** 选中 marker 后的拓扑连线 + 暗化非关联 */
    const drawConnections = (selectedId: string) => {
      const map = mapRef.current;
      if (!map) return;
      const entry = markerByIdRef.current.get(selectedId);
      if (!entry) return;
      const sel = entry.data;

      const related: Marker[] = [];
      const isGateway = sel.iconKind === 'gateway' || sel.type === 'gateway';
      if (isGateway) {
        markerByIdRef.current.forEach(({ data }) => {
          if (data.id !== selectedId && data.parentGatewayId === selectedId) related.push(data);
        });
      } else if (sel.parentGatewayId) {
        const gw = markerByIdRef.current.get(sel.parentGatewayId);
        if (gw && gw.data.id !== selectedId) related.push(gw.data);
      }

      // alert 应急同心圈
      if (sel.type === 'alert' || sel.iconKind === 'alert') {
        [500, 2000].forEach((r) => {
          const c = L.circle([sel.lat, sel.lng], {
            radius: r,
            color: '#ff4d4f',
            weight: 1,
            opacity: 0.7,
            fillColor: '#ff4d4f',
            fillOpacity: 0.08,
            className: 'pulse-ring',
            interactive: false,
          }).addTo(map);
          connectionLayersRef.current.circles.push(c);
        });
      }

      // 网关中心浅蓝背景圈(选中时增加视觉锚点)
      if (isGateway) {
        const gatewayColor = statusColor(sel);
        const centerHalo = L.circle([sel.lat, sel.lng], {
          radius: 300,
          color: gatewayColor,
          weight: 0,
          fillColor: gatewayColor,
          fillOpacity: 0.08,
          interactive: false,
        }).addTo(map);
        connectionLayersRef.current.circles.push(centerHalo);
      }

      // 画连线 + active
      const lineColorFor = (rel: Marker): string =>
        isGateway ? statusColor(sel) : statusColor(rel);
      related.forEach((rel) => {
        const line = L.polyline(
          [
            [sel.lat, sel.lng],
            [rel.lat, rel.lng],
          ],
          {
            color: lineColorFor(rel),
            weight: 1.6,
            opacity: 0.95,
            dashArray: '5 7',
            className: 'pulse-line',
            interactive: false,
          },
        ).addTo(map);
        connectionLayersRef.current.lines.push(line);

        const relMk = markerByIdRef.current.get(rel.id);
        const inner = relMk?.marker.getElement()?.querySelector('.map-marker-icon');
        inner?.classList.add('map-marker-icon--active');
      });

      // 暗化非 selected / 非 related
      markerByIdRef.current.forEach(({ marker, data }) => {
        if (data.id === selectedId) return;
        if (related.some((r) => r.id === data.id)) return;
        const inner = marker.getElement()?.querySelector('.map-marker-icon');
        inner?.classList.add('map-marker-icon--dimmed');
      });

      startPulseBroadcast();
      selectedMarkerIdRef.current = selectedId;
    };

    const handleSelect = (id: string) => {
      if (selectedMarkerIdRef.current === id) {
        clearConnections();
      } else {
        clearConnections();
        drawConnections(id);
      }
    };

    // === 初始化地图(主题变化时重建) ===
    useEffect(() => {
      if (!divRef.current) return;
      if (mapRef.current) {
        mapRef.current.setView(center, zoom);
        window.setTimeout(() => mapRef.current?.invalidateSize(), 50);
        return;
      }
      const map = L.map(divRef.current, {
        center,
        zoom,
        zoomControl: false,
        attributionControl: true,
      });
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      if (theme === 'dark') {
        L.DomUtil.addClass(divRef.current, 'map-theme-dark');
      }

      const tileCtrl = new TileProviderController(map, divRef.current);
      tileCtrl.start();
      tileControllerRef.current = tileCtrl;
      mapRef.current = map;

      const resizeTimer = window.setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 120);

      return () => {
        window.clearTimeout(resizeTimer);
        tileCtrl.destroy();
        tileControllerRef.current = null;
        map.remove();
        mapRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [centerKey, zoom, theme]);

    // === 渲染 markers(markers 引用变化时执行,不重建) ===
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;
      map.eachLayer((layer) => {
        if (
          layer instanceof L.CircleMarker ||
          layer instanceof L.Marker ||
          layer instanceof L.Polyline ||
          layer instanceof L.Circle
        ) {
          map.removeLayer(layer);
        }
      });

      selectedMarkerIdRef.current = null;
      hoveredMarkerIdRef.current = null;
      markerByIdRef.current = new Map();
      connectionLayersRef.current = { lines: [], circles: [], extras: [] };
      if (pulseIntervalRef.current !== null) {
        window.clearInterval(pulseIntervalRef.current);
        pulseIntervalRef.current = null;
      }
      pulseWavesRef.current.forEach((w) => mapRef.current?.removeLayer(w));
      pulseWavesRef.current.clear();

      const ms = markersRef.current;
      if (ms.length === 0) return;
      const bounds = L.latLngBounds([]);

      // === 热力图模式 ===
      if (colorMode === 'heat') {
        ms.forEach((m) => {
          const latlng: [number, number] = [m.lat, m.lng];
          const intensity = typeof m.intensity === 'number' ? m.intensity : 0.7;
          const outerR = 1500 + intensity * 2500;
          const midR = 600 + intensity * 1400;
          L.circle(latlng, {
            radius: outerR,
            color: '#ff4d4f',
            weight: 1,
            opacity: 0.55,
            fillColor: '#ff4d4f',
            fillOpacity: 0.04,
            className: 'heat-outer',
            interactive: false,
          }).addTo(map);
          L.circle(latlng, {
            radius: midR,
            color: '#ff4d4f',
            weight: 1.5,
            opacity: 0.75,
            fillColor: '#ff4d4f',
            fillOpacity: 0.12,
            className: 'heat-mid',
            interactive: false,
          }).addTo(map);
          const core = L.circleMarker(latlng, {
            radius: 6 + intensity * 6,
            color: '#fff',
            weight: 2,
            fillColor: '#ff4d4f',
            fillOpacity: 0.95,
          }).addTo(map);
          if (intensity >= 0.8) {
            const labelHtml =
              `<div class="heat-label-inner">${(intensity * 100).toFixed(0)}</div>` +
              (m.title ? `<div class="heat-label-sub">${m.title}</div>` : '');
            L.marker(latlng, {
              icon: L.divIcon({
                className: 'heat-label',
                html: labelHtml,
                iconSize: [90, 30],
                iconAnchor: [45, 15],
              }),
              interactive: false,
              zIndexOffset: -100,
            }).addTo(map);
          }
          if (m.title || m.popup)
            core.bindPopup(`<strong>${m.title || m.id}</strong><br/>${m.popup || ''}`);
          core.on('click', () => {
            map.setView(latlng, 12, { animate: true });
            clickHandlerRef.current?.(m);
          });
          bounds.extend(latlng);
        });
        if (fitOnLoad && !fittedRef.current) {
          window.setTimeout(() => {
            const m = mapRef.current;
            if (m) {
              m.invalidateSize();
              m.fitBounds(bounds, { padding: [40, 40], maxZoom: 13, animate: true });
            }
          }, 200);
          fittedRef.current = true;
        }
        return;
      }

      // === 通用图标化渲染 ===
      const gatewayMap = new Map<
        string,
        { lat: number; lng: number; status: string; markerRef: L.Marker | null }
      >();
      const markerToGateway = new Map<L.Marker, string | undefined>();
      ms.forEach((m) => {
        if (m.iconKind === 'gateway' || m.type === 'gateway') {
          gatewayMap.set(m.id, { lat: m.lat, lng: m.lng, status: m.type, markerRef: null });
        }
      });

      ms.forEach((m) => {
        const latlng: [number, number] = [m.lat, m.lng];
        const kind: DeviceIconKind = m.iconKind ?? 'sensor';

        if (colorMode === 'type' && (m.type === 'alert' || kind === 'alert')) {
          alertHalo(latlng, map);
        }

        const icon = deviceIcon(kind, m.type);
        const marker = L.marker(latlng, { icon, riseOnHover: true }).addTo(map);

        markerByIdRef.current.set(m.id, { marker, data: m });

        marker.bindPopup(buildPopupHtml(m), {
          closeOnClick: false,
          autoClose: false,
          offset: [0, -4],
          className: 'map-popup-cockpit',
        });

        const isGateway = m.iconKind === 'gateway' || m.type === 'gateway';
        if (!isGateway) {
          markerToGateway.set(marker, m.parentGatewayId);
        } else {
          const g = gatewayMap.get(m.id);
          if (g) g.markerRef = marker;
        }
        const setActive = (on: boolean) => {
          const apply = (mk: L.Marker | null | undefined) => {
            if (!mk) return;
            const el = mk.getElement();
            if (!el) return;
            const inner = el.querySelector('.map-marker-icon');
            if (!inner) return;
            inner.classList.toggle('map-marker-icon--active', on);
          };
          apply(marker);
          if (!isGateway && m.parentGatewayId) {
            const g = gatewayMap.get(m.parentGatewayId);
            apply(g?.markerRef ?? null);
          }
        };
        marker.on('mouseover', () => {
          hoveredMarkerIdRef.current = m.id;
          marker.openPopup();
          if (selectedMarkerIdRef.current) return;
          setActive(true);
        });
        marker.on('mouseout', () => {
          hoveredMarkerIdRef.current = null;
          if (selectedMarkerIdRef.current === m.id) return;
          marker.closePopup();
          if (selectedMarkerIdRef.current) return;
          setActive(false);
        });
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          handleSelect(m.id);
          clickHandlerRef.current?.(m);
        });
        bounds.extend(latlng);
      });

      // gateway hover → 反向高亮子设备
      const gatewayToChildren = new Map<string, L.Marker[]>();
      markerToGateway.forEach((pid, mk) => {
        if (!pid) return;
        const list = gatewayToChildren.get(pid) ?? [];
        list.push(mk);
        gatewayToChildren.set(pid, list);
      });
      gatewayToChildren.forEach((children, pid) => {
        const g = gatewayMap.get(pid);
        const gmk = g?.markerRef;
        if (!gmk) return;
        const setActive = (on: boolean) => {
          const apply = (mk: L.Marker | null | undefined) => {
            if (!mk) return;
            const el = mk.getElement();
            if (!el) return;
            const inner = el.querySelector('.map-marker-icon');
            if (!inner) return;
            inner.classList.toggle('map-marker-icon--active', on);
          };
          apply(gmk);
          children.forEach((c) => apply(c));
        };
        gmk.on('mouseover', () => {
          hoveredMarkerIdRef.current = pid;
          gmk.openPopup();
          if (selectedMarkerIdRef.current) return;
          setActive(true);
        });
        gmk.on('mouseout', () => {
          if (hoveredMarkerIdRef.current === pid) hoveredMarkerIdRef.current = null;
          if (selectedMarkerIdRef.current === pid) return;
          gmk.closePopup();
          if (selectedMarkerIdRef.current) return;
          setActive(false);
        });
      });

      // 点击空白取消选中
      map.on('click', () => {
        if (selectedMarkerIdRef.current) {
          clearConnections();
          markerByIdRef.current.forEach(({ marker }) => marker.closePopup());
        }
      });

      // scene 模式:每个 scene 边界圈
      if (colorMode === 'scene') {
        const scenes = ['production', 'equipment', 'network', 'pipeline', 'env'] as const;
        scenes.forEach((sc) => {
          const pts = ms
            .filter((m) => m.scene === sc)
            .map((m) => [m.lat, m.lng] as [number, number]);
          if (pts.length < 2) return;
          const b = L.latLngBounds(pts);
          const ne = b.getNorthEast();
          const sw = b.getSouthWest();
          const pad = 0.02;
          const paddedRect: [number, number][] = [
            [ne.lat + pad, ne.lng + pad],
            [sw.lat + pad, ne.lng + pad],
            [sw.lat - pad, sw.lng - pad],
            [ne.lat - pad, sw.lng - pad],
            [ne.lat + pad, ne.lng + pad],
          ];
          const colors: Record<string, string> = {
            production: '#1890ff',
            equipment: '#13c2c2',
            network: '#722ed1',
            pipeline: '#fa8c16',
            env: '#52c41a',
          };
          L.polyline(paddedRect, {
            color: colors[sc],
            weight: 1.5,
            opacity: 0.55,
            dashArray: '8 6',
            interactive: false,
          }).addTo(map);
        });
      }

      if (fitOnLoad && !fittedRef.current) {
        window.setTimeout(() => {
          const m = mapRef.current;
          if (m) {
            m.invalidateSize();
            m.fitBounds(bounds, { padding: [40, 40], maxZoom: 13, animate: true });
          }
        }, 200);
        fittedRef.current = true;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [markersProp, fitOnLoad, colorMode]);

    // === areaCircles ===
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !areaCircles || areaCircles.length === 0) return;
      const circles: L.Circle[] = [];
      const labels: L.Marker[] = [];
      areaCircles.forEach((c) => {
        const color = c.color ?? '#1890ff';
        const circle = L.circle([c.lat, c.lng], {
          radius: c.radius,
          color,
          weight: 1.5,
          opacity: 0.7,
          fillColor: color,
          fillOpacity: 0.1,
          interactive: false,
        }).addTo(map);
        circles.push(circle);

        const labelHtml = `<div class="area-circle-label">${c.label}${c.count !== undefined ? ` (${c.count})` : ''}</div>`;
        const labelMarker = L.marker([c.lat, c.lng], {
          icon: L.divIcon({
            className: '',
            html: labelHtml,
            iconSize: [120, 24],
            iconAnchor: [60, 12],
          }),
          interactive: false,
          zIndexOffset: -200,
        }).addTo(map);
        labels.push(labelMarker);
      });
      return () => {
        circles.forEach((c) => map.removeLayer(c));
        labels.forEach((m) => map.removeLayer(m));
      };
    }, [areaCircles]);

    // === polyline + pointLabels ===
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;
      const layers: (L.Polyline | L.Marker)[] = [];

      if (polyline && polyline.points.length > 0) {
        const pl = L.polyline(polyline.points, {
          color: polyline.color ?? '#1890ff',
          weight: polyline.weight ?? 3,
          dashArray: polyline.dashArray,
          interactive: false,
        }).addTo(map);
        layers.push(pl);
      }

      if (pointLabels && pointLabels.positions.length > 0) {
        const baseColor = pointLabels.color ?? '#1890ff';
        const hlColor = pointLabels.highlightColor ?? '#fa8c16';
        pointLabels.positions.forEach((pos, idx) => {
          const isHl = idx === pointLabels.highlightIndex;
          const labelColor = isHl ? hlColor : baseColor;
          const extraClass = isHl ? 'point-label--current' : '';
          const labelHtml = `<div class="point-label ${extraClass}" style="--label-color: ${labelColor}">${idx + 1}</div>`;
          const m = L.marker(pos, {
            icon: L.divIcon({
              className: '',
              html: labelHtml,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            }),
            interactive: false,
            zIndexOffset: isHl ? 500 : 0,
          }).addTo(map);
          layers.push(m);
        });
      }

      return () => {
        layers.forEach((l) => map.removeLayer(l));
      };
    }, [polyline, pointLabels]);

    // === flyTarget ===
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !flyTarget) return;
      map.flyTo([flyTarget[0], flyTarget[1]], 12, { duration: 1.5 });
    }, [flyTarget]);

    // === popupInfo ===
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;
      map.closePopup();
      if (!popupInfo) return;
      const popup = L.popup()
        .setLatLng([popupInfo.lat, popupInfo.lng])
        .setContent(popupInfo.content)
        .addTo(map);
      map.openPopup(popup);
    }, [popupInfo]);

    return (
      <div className={styles.wrap} style={{ height }}>
        <div ref={divRef} className={styles.map} />
        {loading && (
          <div className={styles.loading}>
            <div>
              <div className={styles.spinner} />
              <div className={styles.loadingTip}>地图加载中...</div>
            </div>
          </div>
        )}
      </div>
    );
  },
);