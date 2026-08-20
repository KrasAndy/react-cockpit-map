# Changelog

All notable changes to `@krasandy/react-cockpit-map` will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-20

### Added

- Initial release, extracted from production project (Daqing Oilfield AI Cockpit)
- 17 industrial device SVG icons (well / station / pipeline / storage / pump /
  camera / thermal / mobileball / sensor / rtu / beidou / probe / / handheld /
  gateway / drone / person / alert)
- Multi-CDN tile fallback (高德矢量 + 高德卫星 + 腾讯 + OSM) with probe +
  automatic switching on tileerror
- Inline leaflet.css + dark cockpit theme overrides (no external CSS chunk
  needed at deploy time)
- Hover popup with rich detail (title / type / status / area / vendor-model /
  health bar / parent gateway)
- Click-to-expand topology: gateway → device connections with pulse-line
  animation, dimmed non-related markers
- Pulse broadcast (lens-shaped wave) every 3s along active connections
- 5-scene boundary rings in `colorMode='scene'`
- Heatmap mode (`colorMode='heat'`) with concentric intensity circles + label
- Optional overlays: polyline / pointLabels / areaCircles / flyTarget / popupInfo
- `forwardRef` handle: `flyTo(lat, lng, zoom)` + `openPopup(lat, lng, content)`
- Light + dark themes via CSS filter (no theme system overhead)
- CSS variables with fallback defaults (`var(--bg-3, #f5f7fa)` etc.) — works
  standalone, project theming only adds polish

### Notes

- No runtime antd dependency (Spin replaced with CSS spinner)
- Zero CSS chunk split (R46 lesson from Netlify Drop deployment)