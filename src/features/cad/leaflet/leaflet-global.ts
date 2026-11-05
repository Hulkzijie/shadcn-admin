import L from 'leaflet';

// 部分 Leaflet 插件（rotatedMarker / path-transform 的 UMD 分支）直接引用全局 L，
// 因此必须在这些插件执行前把 L 挂到 globalThis 上。
if (typeof window !== 'undefined') {
  (window as unknown as { L: typeof L }).L = L;
}

export default L;
