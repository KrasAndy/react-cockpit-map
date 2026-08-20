// === react-cockpit-map demo — 7 scenarios ===
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapCanvas,
  type ColorMode,
  type MapCanvasHandle,
  type Marker,
} from '@krasandy/react-cockpit-map';
import {
  gisMarkers,
  bigScreenMarkers,
  personnelMarkers,
  personnelAreaCircles,
  personTrack,
  beidouMarkers,
  deviceDetail,
  pipelineMarkers,
} from './mock';

type Scenario =
  | 'gis'
  | 'bigscreen'
  | 'personnel'
  | 'track'
  | 'beidou'
  | 'device'
  | 'pipeline';

interface ScenarioConfig {
  id: Scenario;
  label: string;
  description: string;
}

const SCENARIOS: ScenarioConfig[] = [
  { id: 'gis', label: '1. GIS 一张图', description: '62 markers / 5 大场景过滤 / 折线覆盖' },
  { id: 'bigscreen', label: '2. 大屏暗色', description: 'heat/scene/type 三种 colorMode 切换' },
  { id: 'personnel', label: '3. 实时人员', description: 'areaCircles + scene 色 + hover popup' },
  { id: 'track', label: '4. 轨迹回放', description: 'polyline + 数字标签(高亮当前点)' },
  { id: 'beidou', label: '5. 定位总览', description: 'flyTarget + popupInfo + 实时 beidou 终端' },
  { id: 'device', label: '6. 设备详情', description: '单点 + 6 字段 popup(健康度条)' },
  { id: 'pipeline', label: '7. 管线桩', description: '管线桩 + onMarkerClick 拓扑' },
];

// === Beidou 实时飞向 demo (子组件) ===
function BeidouDemo() {
  const mapRef = useRef<MapCanvasHandle>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | undefined>(undefined);
  const [popupInfo, setPopupInfo] = useState<
    { lat: number; lng: number; content: string } | null
  >(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      const m = beidouMarkers[Math.floor(Math.random() * beidouMarkers.length)];
      setFlyTarget([m.lat, m.lng]);
      setPopupInfo({
        lat: m.lat,
        lng: m.lng,
        content: `<div style="min-width:160px"><div style="font-weight:600;color:#fff;margin-bottom:4px">${m.title}</div><div style="font-size:11px;color:#8ca8d0">健康度:${m.health ?? '—'}</div></div>`,
      });
    }, 3000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <MapCanvas
      ref={mapRef}
      markers={beidouMarkers}
      center={[46.08, 125.0]}
      zoom={11}
      theme="dark"
      height="100%"
      flyTarget={flyTarget}
      popupInfo={popupInfo}
      fitOnLoad
    />
  );
}

export default function App() {
  const [scenario, setScenario] = useState<Scenario>('gis');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [colorMode, setColorMode] = useState<ColorMode>('type');
  const [gisFilter, setGisFilter] = useState<string>('all');
  const [trackProgress, setTrackProgress] = useState(4);
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);

  const gisVisible = useMemo<Marker[]>(() => {
    if (gisFilter === 'all') return gisMarkers;
    return gisMarkers.filter((m) => m.type === gisFilter);
  }, [gisFilter]);

  return (
    <div className="app">
      <div className="tabs">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            className={`tab ${scenario === s.id ? 'active' : ''}`}
            onClick={() => setScenario(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {scenario === 'gis' && (
        <div className="toolbar">
          <label>
            <span>过滤:</span>
            <select value={gisFilter} onChange={(e) => setGisFilter(e.target.value)}>
              <option value="all">全部 (62)</option>
              <option value="gateway">网关 (12)</option>
              <option value="drone">无人机 (6)</option>
              <option value="person">人员 (8)</option>
              <option value="normal">普通设备 (28)</option>
              <option value="alert">告警 (2)</option>
              <option value="offline">离线 (6)</option>
            </select>
          </label>
          <label>
            <span>主题:</span>
            <select value={theme} onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}>
              <option value="dark">dark</option>
              <option value="light">light</option>
            </select>
          </label>
          <span style={{ color: '#5a7da8', fontSize: 11 }}>
            点击 marker 触发拓扑展开 + pulse 动画
          </span>
        </div>
      )}

      {scenario === 'bigscreen' && (
        <div className="toolbar">
          <label>
            <span>colorMode:</span>
            <select value={colorMode} onChange={(e) => setColorMode(e.target.value as ColorMode)}>
              <option value="type">type(设备类型色)</option>
              <option value="scene">scene(5 大场景色)</option>
              <option value="heat">heat(风险热力图)</option>
            </select>
          </label>
          <span style={{ color: '#5a7da8', fontSize: 11 }}>
            切换看 3 种着色模式差异
          </span>
        </div>
      )}

      {scenario === 'personnel' && (
        <div className="toolbar">
          <span style={{ color: '#5a7da8', fontSize: 11 }}>hover 任意人员查看 popup + 归属联动</span>
        </div>
      )}

      {scenario === 'track' && (
        <div className="toolbar">
          <label>
            <span>高亮进度:</span>
            <select
              value={trackProgress}
              onChange={(e) => setTrackProgress(Number(e.target.value))}
            >
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <option key={i} value={i}>
                  第 {i + 1} 步
                </option>
              ))}
            </select>
          </label>
          <span style={{ color: '#5a7da8', fontSize: 11 }}>当前点用橙色突出显示</span>
        </div>
      )}

      {scenario === 'beidou' && (
        <div className="toolbar">
          <span style={{ color: '#5a7da8', fontSize: 11 }}>
            8 个北斗终端,每 3s 自动 flyTarget 到随机点位
          </span>
        </div>
      )}

      {scenario === 'pipeline' && (
        <div className="toolbar">
          <span style={{ color: '#5a7da8', fontSize: 11 }}>
            点击任意管线桩 → 拓扑展开 + dimmed 非关联点
            {selectedPipeline && (
              <strong style={{ color: '#1890ff' }}> 当前选中:{selectedPipeline}</strong>
            )}
          </span>
        </div>
      )}

      <div className="stage">
        {scenario === 'gis' && (
          <MapCanvas
            markers={gisVisible}
            center={[46.08, 125.0]}
            zoom={11}
            theme={theme}
            height="100%"
            colorMode="type"
            fitOnLoad
          />
        )}

        {scenario === 'bigscreen' && (
          <MapCanvas
            markers={bigScreenMarkers}
            center={[46.08, 125.0]}
            zoom={11}
            theme="dark"
            height="100%"
            colorMode={colorMode}
            fitOnLoad
          />
        )}

        {scenario === 'personnel' && (
          <MapCanvas
            markers={personnelMarkers}
            center={[46.08, 125.0]}
            zoom={10}
            theme="dark"
            height="100%"
            colorMode="scene"
            areaCircles={personnelAreaCircles}
            fitOnLoad
          />
        )}

        {scenario === 'track' && (
          <MapCanvas
            markers={[]}
            center={[46.08, 125.0]}
            zoom={12}
            theme="dark"
            height="100%"
            polyline={personTrack.polyline}
            pointLabels={{
              ...personTrack.pointLabels,
              highlightIndex: trackProgress,
            }}
            fitOnLoad
          />
        )}

        {scenario === 'beidou' && <BeidouDemo />}

        {scenario === 'device' && (
          <MapCanvas
            markers={[deviceDetail]}
            center={[46.08, 125.0]}
            zoom={13}
            theme="dark"
            height="100%"
            fitOnLoad
          />
        )}

        {scenario === 'pipeline' && (
          <MapCanvas
            markers={pipelineMarkers}
            center={[46.08, 125.0]}
            zoom={11}
            theme="dark"
            height="100%"
            onMarkerClick={(m) => setSelectedPipeline(m.id)}
            fitOnLoad
          />
        )}
      </div>

      <div className="demo-meta">
        react-cockpit-map demo · {SCENARIOS.find((s) => s.id === scenario)?.description}
      </div>
    </div>
  );
}