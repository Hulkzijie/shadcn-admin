# 复刻项目中的 CAD 配置

> **Workspace:** /Users/wangzijie/Documents/wx/wisecloud-admin

---

**User**

/Users/wangzijie/Documents/full-process-digitization/sdpwork/qgcszh-monorepo/apps/qgcszh-design-vite/vite.config.ts 看一下这个项目中的cad 我想把这一块内容复刻到我项目中

**Assistant**

我先并行探索该目录结构并搜索 CAD 相关关键词。

我将继续补齐剩余关键文件并确认路由注册位置，然后输出完整报告。

我将先补齐最后几处目录结构确认，然后输出完整报告。

# CAD 能力调研报告（qgcszh-design-vite）

> 说明：本报告基于对整个仓库源码的实际 grep / 读取 / 目录遍历得出，已覆盖 `src/pages/OnlineDesignCadWx`（新版）、`src/pages/OnlineDesignCad`（桌面版）、`src/common/components/LeafletBase`、路由体系、package.json、静态资源目录。凡是无法证实的项，均在文末「未找到 / 风险点」中显式列出，不做任何推测性编造。

根目录（下称 `$APP`）：
`/Users/wangzijie/Documents/full-process-digitization/sdpwork/qgcszh-monorepo/apps/qgcszh-design-vite`

---

## 一、结论摘要（最重要的一条）

这套 CAD 不是 WebGL 类 CAD，也不是 three.js / fabric.js / konva：

- 底座是 **Leaflet 1.9.4 + react-leaflet 4.2.1**，所有图元（点、线、面、标注、表格、端子面板、图框、素材点）都是 **Leaflet Marker / Polyline / Polygon / SVG Overlay / DOM Overlay**。
- 交互靠**本地内置（vendored）的 Leaflet 插件**：`leaflet.drag.js`、`leaflet.rotatedMarker.js`、`leaflet-path-transform.js`、`Leaflet.Editable.js`、`leaflet-measure-path.js`、`leaflet.snap.js`、`leaflet.wmts.js`、`leaflet-geometryutil.js`，加载方式统一为 `window.L = L; import './leaflet.xxx'`。
- 状态是**双层**：React-Redux（图纸级数据 `cadMapData`）+ Zustand（画布级 `elementList / selectedElements / mapObj / events / operationsData`）。
- **DXF 只做「导出」，无解析**；**DWG 只存在一个静态示例文件，无任何解析代码**。
- 仓库中**不存在** three.js / fabric / konva / dxf-parser / dwg 解析库 / wasm / Web Worker / 自定义字体。

---

## 二、目录与文件清单

### 2.1 新版主实现：`$APP/src/pages/OnlineDesignCadWx`

#### 页面编排层 `TreeAndGis/`

| 绝对路径 | 行数 | 作用 | 核心依赖 |
|---|---|---|---|
| `$APP/src/pages/OnlineDesignCadWx/TreeAndGis/index.tsx` | 1203 | 页面总入口：左侧图纸树 + 右侧画布 + 模板/历史版本弹窗 + 未保存拦截 | `CadDrawingTreePanel`、`CadCanvasContainer`、`CadTemplateSelectorModal`、`CadHistorySelectorModal`、`templateCanvas`、`service`、`useCadRouteStore`、`routeAdjust`、`FrameObj._history` |
| `TreeAndGis/CadCanvasContainer.tsx` | 53 | 画布容器包装，带 `key={`${mapType}-${treeData.key}`}` 防止重建 | `../CadmapWx` |
| `TreeAndGis/CadDrawingTreePanel.tsx` | — | 图纸树：新建/删除/重命名/编号/模板/缩略图/导出 PDF | antd Tree/Modal/Form、`dom-to-image`、`jsPDF`、`L`、`./service`、`CadThumbnailPreview`、`scaleUtils` |
| `TreeAndGis/CadTemplateSelectorModal.tsx` | 302 | 模板选择弹窗 | `service`、`templateCanvas` |
| `TreeAndGis/CadHistorySelectorModal.tsx` | 530 | 历史版本选择/对比/恢复 | `service`（versions/compareVersions/restoreVersion） |
| `TreeAndGis/CadMapPreviewModal.tsx` | — | 图纸预览（静态渲染） | `templateCanvas`（`buildPreviewRenderDataFromDetail`） |
| `TreeAndGis/ChooseTempFrame/{config.ts,index.tsx,service.ts}` | — | 图框选择 | `service` |
| `TreeAndGis/LeftMapTree/index.tsx` | — | 左侧图层树 | — |
| `TreeAndGis/service.ts` | 594 | **全部后端接口封装**（图纸/模板/文件夹/勘察/子图/字典/区域） | `designProxy`、`systemProxy`、`proxyUrl`、`VITE_WXCAD_HOST` |
| `TreeAndGis/templateCanvas.ts` | 863 | **模板与图元核心工具**（解析、递归模板、合并、规范化、payload 构造） | `getUrlByFileId`、`总图图框A3.svg` |
| `TreeAndGis/util.ts` | 2035 | 通用工具 | — |
| `TreeAndGis/routeAdjust.ts` | — | 路由参数规范化 | — |
| `TreeAndGis/interface.ts` | 5 | 复用 `OnlineDesignCad/TreeAndGis/interface` 的 `LayerElementData / OverlayOptionClass / RenderSchema` | — |
| `TreeAndGis/types.ts` | 7 | `RoutePoint` | — |
| `TreeAndGis/index.exports.ts` | 3 | 统一导出 3 个组件 | — |

#### 路由入口 `TaskList/`

| 路径 | 行数 | 作用 |
|---|---|---|
| `$APP/src/pages/OnlineDesignCadWx/TaskList/index.tsx` | 43 | 任务列表页；`<Route path={config.treeAndGis}>` 挂载 `TreeAndGisWx` |
| `$APP/src/pages/OnlineDesignCadWx/TaskList/config.ts` | 61 | `path` / `treeAndGis` / `routeArr` |
| `$APP/src/pages/OnlineDesignCadWx/TaskList/model.ts` | — | redux model |

#### 画布页 `CadmapWx/`

| 路径 | 行数 | 作用 | 核心依赖 |
|---|---|---|---|
| `CadmapWx/index.tsx` | 52 | 组装 `OnlineCadBase` + 各子组件 | `LocalCadBase`（`OnlineCadBase`）、`InitGetData`、`LayerDrawer`、`Bounday`、`Onload`、`OpenDialog`、`MaterialDialog`、`DateDialog`、`TableDialog`、`BottomTool`、`CadThumbnailStage` |
| `CadmapWx/InitGetData.tsx` | 116 | 首次加载：总图/子图两套数据源 | `getSurveyOrderRecordDetailListLayer`、`queryRecordDetailAndPointsInSubByTaskId`、`handelEles`、`mapJsonToCadElements`、`dicMapping`、`@turf/turf` |
| `CadmapWx/Onload.tsx` | 2241 | **交互总线 + 保存总线**：自动保存、手动保存、工具栏事件、右键事件、批量事件、导出图片/Excel | `cadStorage`、`service`、`templateCanvas`、`ToolBar`、`L.TileLayer.WMS` |
| `CadmapWx/service.ts` | 117 | 勘察点/子图/成果/图片资源接口 | `globalData.designProxy`、`globalData.proxyUrl` |
| `CadmapWx/utils.tsx` | — | 图元转换/坐标工具 | `@turf/turf`、`gcoord` |
| `CadmapWx/config.ts` | — | 配置 | — |
| `CadmapWx/Bounday.tsx` | — | 图框/边界组件 | `Elements/CadFrame` |
| `CadmapWx/BottomTool.tsx` | — | 底部工具栏（历史版本等） | — |
| `CadmapWx/LayerDrawer/index.tsx` | 225 | 图层抽屉 | `cadMapData` |
| `CadmapWx/{OpenDialog,MaterialDialog,DateDialog,TableDialog}.tsx` | — | 各类弹窗 | — |
| `CadmapWx/HandleChildMap.tsx` | — | 子图处理 | — |
| `CadmapWx/EditorPolygon/index.tsx` | — | 多边形编辑 | — |

#### 本地草稿 / 缩略图 `CadmapWx/cadStorage/`

| 路径 | 行数 | 作用 |
|---|---|---|
| `cadStorage/index.ts` | 5 | 统一导出 |
| `cadStorage/cadDraftDb.ts` | 201 | IndexedDB（`qgcszh-cad-draft` / `drafts`，keyPath `graphId`），`readCadDraft/writeCadDraft/deleteCadDraft/cloneCadElementsForStorage` |
| `cadStorage/autoSave.ts` | 688 | **自动保存核心**：30s 周期、2s 防抖、脏检查、payload 构造、缩略图、模板图元物化、后端写入 |
| `cadStorage/cadThumbnail.ts` | 448 | 缩略图截取/裁剪/上传（400×300，`CAD缩略图` 业务类型） |
| `cadStorage/cadThumbnailStage.tsx` | 372 | 隐藏快照舞台（供截图） |
| `cadStorage/CadThumbnailPreview.tsx` | — | 缩略图预览组件 |

#### 画布内核 `LocalCadBase/`

| 路径 | 行数 | 作用 | 核心依赖 |
|---|---|---|---|
| `LocalCadBase/index.tsx` | 277 | **总装 + Zustand Store + Leaflet 插件注入** | `leaflet`、`./leaflet.drag`、`./leaflet.rotatedMarker`、`./leaflet-path-transform`、`./Leaflet.Editable`、`./leaflet-measure-path`、`zustand`、`ConfigProvider` |
| `LocalCadBase/main.tsx` | 131 | `MapContainer` + 全部叠层组件 | `react-leaflet`、`MapSvgOverlay`、`PolylineDrawMeasure`、`EleRender`、`ToolBar`、`CadLoadingProgress`、`PropertySidebar`、`BatchRotateAndScale`、`Terminal`、`BatchScale`、`BatchRotate`、`MapRightMenu`、`FiberCore`、`TranslateBatch`、`XuanzhuanBatch`、`StaightenOut`、`ScaleBatch`、`TipBar` |
| `LocalCadBase/totalMap.tsx` | 82 | 总图分支 | — |
| `LocalCadBase/terminalPanelMap.tsx` | 72 | 端子面板分支 | — |
| `LocalCadBase/loaded.tsx` | 463 | `AfterLoaded`：地图加载后行为 | — |
| `LocalCadBase/interface.ts` | 367 | **`CadElement` 等类型定义** | — |
| `LocalCadBase/utils.ts` | 1909 | 图元/坐标/渲染工具 | `@turf/turf`、`gcoord`、`delaunator` |
| `LocalCadBase/MapSvgOverlay.tsx` | 257 | 底图 SVG Overlay | `leaflet` |
| `LocalCadBase/PolylineDrawMeasure.tsx` | 590 | 折线绘制与测距 | `leaflet-measure-path` |
| `LocalCadBase/scaleUtils.ts` | 177 | 比例尺/缩放换算 | — |
| `LocalCadBase/viewportFit.ts` | 22 | 视口适配 | — |
| `LocalCadBase/modalContainer.ts` | 127 | 弹窗挂载容器 | — |
| `LocalCadBase/figureCompositeCapture.ts` | 405 | 组合图元快照 | `dom-to-image` |
| `LocalCadBase/cadMapLock.ts` | — | 地图锁定 | — |
| `LocalCadBase/elementPick.ts` | — | 图元拾取 | — |
| `LocalCadBase/layerOrder.ts` | — | 图层顺序 | — |
| `LocalCadBase/storeContext.ts` | — | Store Context | — |
| `LocalCadBase/leaflet.drag.js` / `leaflet.rotatedMarker.js` / `leaflet-path-transform.js` / `Leaflet.Editable.js` / `leaflet-measure-path.js` | — | **本地内置 Leaflet 插件** | `L` |
| `LocalCadBase/leaflet.css` | — | Leaflet 样式 | — |

#### 渲染分发

| 路径 | 行数 | 作用 |
|---|---|---|
| `LocalCadBase/EleRender/index.tsx` | 171 | 总图/通用图元渲染分发 |
| `LocalCadBase/SuMap/EleRender/index.tsx` | 366 | 素材点/管线/端子面板渲染分发 |

#### 图元元素

| 路径 | 行数 | 作用 |
|---|---|---|
| `LocalCadBase/Elements/CadFrame/index.tsx` | 350 | 图框（引用 `子图图框A3.svg`、`总图图框.svg`、`总图图框A3.svg`） |
| `LocalCadBase/Elements/Annotation/index.tsx` | 43 | 标注 |
| `LocalCadBase/Elements/FiberSection/index.tsx` | 192 | 纤芯断面 |
| `LocalCadBase/Elements/ZhBox/index.tsx` | 174 | 综合箱 |
| `LocalCadBase/SuMap/Elements/NewMarkerBox/index.tsx` + `snap.ts` | 860 | 新标注点（吸附） |
| `LocalCadBase/SuMap/Elements/MarkerLines/index.tsx` + `util.ts` | 806 | 标注引线 |
| `LocalCadBase/SuMap/Elements/MarkerBox/index.tsx` | 146 | 标注框 |
| `LocalCadBase/SuMap/Elements/PipeBox/`（+`PipePanel/config.ts`） | — | 管孔 |
| `LocalCadBase/SuMap/Elements/TerminalPanelBox/`（+`TerminalPanel/config.ts`） | — | 端子面板 |
| `LocalCadBase/SuMap/util.ts` | — | 素材工具 |
| `LocalCadBase/TableMarker/index.tsx` + `RenderMarker/`(129) + `RotateMarker/`(115) + `ScaleMarker/`(67) + `TableModal/`(201) + `TableRender/index.jsx` + `utils.ts`(25) | — | 表格类标注 |
| `LocalCadBase/DynamicMarkers/index.tsx`(117) + `TagMarker/index.tsx`(178) + `colorText/` | — | 动态标注（编号/日期/自定义文本） |

#### 工具栏与编辑工具

| 路径 | 行数 | 作用 |
|---|---|---|
| `LocalCadBase/ToolBar/index.tsx` | 3138 | 工具栏主组件 |
| `LocalCadBase/ToolBar/config.ts` | 658 | 工具定义全集 `toolsDefine`、`tMapType` |
| `LocalCadBase/ToolBar/util.ts` | 412 | 工具栏工具函数 |
| `LocalCadBase/ToolBar/layerActions.ts` | 303 | 图层动作 |
| `LocalCadBase/ToolBar/FigureLazyImage.tsx` | — | 图例懒加载 |

`LocalCadBase/Operation/Operates/`（约 30+ 个编辑工具，均为 .tsx/.ts）：
`EnterLine`(227)、`CustomLine`(1030)、`CustomPolygon`、`EnterReference`、`EnterTable`(+TableModal+TableRender+utils)、`EnterTag`、`EnterFrameEditor`、`CusTextInput`、`FiberMarkBox`、`fiberCore.tsx`、`fiberCoreMarker.tsx`、`Cutter.tsx`、`CutterBox`、`CutDelete.tsx`、`StretchBox`、`stretch.tsx`、`Mirror`(221)、`newParallel.tsx` / `parallel.tsx` / `NewParallelBox` / `ParallelBox`、`dimensionMark.tsx`、`Summation.tsx`、`align.tsx`、`crop.tsx`、`section.tsx`、`dynamicEnter.tsx`、`referenceEnter.tsx`、`zoom.tsx`、`batchRotate.tsx`、`batchScale.tsx`、`BatchRotateAndScale.tsx`(+`Bak`)、`TranslateBatch`、`XuanzhuanBatch`、`ScaleBatch`、`StaightenOut`、`RectanglePoit`、`MaterialPoint`、`Geometric`、`lineAndTag`、`batchTransformUtils.ts`、`utils.tsx`（**`sanitizeCadElementForSave`**）。

#### 键盘命令系统 `LocalCadBase/CadKeyboard/`

`index.tsx`、`cadKeyboardShared.ts`、`cadHistory.ts`、`shortcutRegistry.ts`、`shortcutTypes.ts`；
`Command/`（`CadKeyboardCommand.tsx`、`commands.ts`、`shortcuts.ts`）、
`Editing/`（`CadKeyboardCopy.tsx`、`CadKeyboardEdit.tsx`）、
`Global/`（`CadKeyboardGuide.tsx`、`CadKeyboardSave.tsx`、`CadKeyboardHistory.tsx`）、
`NonEditing/`（`CadKeyboardBoxSelect.tsx`、`CadKeyboardOperateDelete.tsx`）、
`ShortcutGuide/index.tsx`(213)；
附 `指令指南.md`、`快捷键指南.md`。

#### 其他面板

`LocalCadBase/Operation/PropertySidebar/index.tsx`(219)、`RightMenu/index.tsx`(145)+`propertyTemplates.ts`、`EleRightMenu`、`OpeateRightMenu/MapRightMenu`、`FiberCoreAssignMarker`、`ResourceModal`、`Command`、`Drawing`、`Operation/index.tsx`(308)；
`LocalCadBase/PipeParaEditor`(65)、`TerminalPanelEditor`(50+110)、`CadLoadingProgress`(73 + `useCadLoadProgress.ts` 338)、`TipBar`(16)、`CommandPanel`(348)、`SvgIcon.tsx`、`alignment/{alignment,guides,index,modifier,useElementAlignment}`。

### 2.2 桌面版（旧版，含 DXF 导出）：`$APP/src/pages/OnlineDesignCad`

| 路径 | 作用 |
|---|---|
| `OnlineDesignCad/TreeAndGis/index.tsx`(112) | 旧版图纸+GIS 页面 |
| `OnlineDesignCad/TreeAndGis/DesignGisCAD/leafletCAD.tsx` | **老版 Leaflet CAD 容器**：`react-leaflet` `MapContainer` + `leaflet-draw` + `leaflet.snap` + `Leaflet.Editable` + `leaflet-geometryutil` + `LeafletBase/index.module.less`，导出 `LeafletBase` |
| `OnlineDesignCad/TreeAndGis/DesignGisCAD/{InitConfig.tsx,controls.tsx,index.tsx}` | 老版 CAD 工具/控件 |
| `OnlineDesignCad/TreeAndGis/RightMap/index.tsx` | 右侧地图 |
| `OnlineDesignCad/TreeAndGis/{routeAdjust.ts,service.ts,util.ts,interface.tsx,types.ts}` | 支撑 |
| `OnlineDesignCad/Cadmap/index.tsx` | 桌面版画布页 |
| `OnlineDesignCad/Cadmap/Onload.tsx` | 桌面版交互/保存（**含「导出 dxf」按钮**） |
| `OnlineDesignCad/Cadmap/exportDxf.ts` | **DXF 导出调度**：快照校验 + 图元转换 + DXF 写入 + ZIP 下载；导出 `createDxf / exportDxf` 及 `DxfImage/DxfShape/DxfText` |
| `OnlineDesignCad/Cadmap/dxfTemplate.ts` | AC1021 DXF 文档骨架 |
| `OnlineDesignCad/Cadmap/exportDxfTable.ts` | 表格 → 网格 + MTEXT |
| `OnlineDesignCad/Cadmap/exportDxfBackground.ts` | 图框范围 / 模板图片 / 瓦片拼接 |
| `OnlineDesignCad/Cadmap/exportDxfProgress.ts` + `DxfExportProgress.tsx` | 导出进度 |
| `OnlineDesignCad/Cadmap/DXF导出说明.md`(82) | 导出说明（详见下文） |
| `OnlineDesignCad/Cadmap/{InitGetData,Bounday,HandleChildMap,LayerDrawer,EditorPolygon,...}` | 与 Wx 版结构对应 |
| `OnlineDesignCad/TaskList/*` | 任务列表（含 `detail.tsx/service.ts/model.ts/table.tsx/search.tsx`） |

`DXF导出说明.md` 要点：
- 调用：`await exportDxf(store, { fileName, graph, includeTiles: true, maxTiles: 512 })`。
- 范围字段：`[minLng, maxLng, minLat, maxLat, zoom, finalFontSize, templateId]`，优先 `store.getState().booundy`，其次 `graph.boundary / graph.boundry`。
- ZIP 内容：`.dxf` + `images/` + `elementList.json` + `manifest.json` + 使用说明 + `导出提示.txt`。
- 限制：每层最多 512 瓦片、并发 4、单次超时 20s、画布上限 3200 万像素 / 单边 16384。

### 2.3 公共 Leaflet 底座：`$APP/src/common/components/LeafletBase/`

`leaflet.css`、`leaflet.wmts.js`、`leaflet.snap.js`、`leaflet-geometryutil.js`、`Leaflet.Editable.js`、`leaflt.markcluster.css`、`images/*`（marker-icon、maptools_*、drawtools_* 等）、`LayerEditor/EditorBtns/icons/*`。

---

## 三、npm 依赖清单

### 3.1 应用 `$APP/package.json`（171 行，已完整读取）

确认**存在**的 CAD 相关依赖：

```
"leaflet": "^1.9.4"
"react-leaflet": "^4.2.1"
"leaflet-draw": "1.0.4"
"leaflet-editable": "^1.3.0"
"react-leaflet-draw": "^0.20.4"
"react-leaflet-editable": "^0.2.2"
"react-leaflet-markercluster": "^4.2.1"
"leaflet-betterscale": "^1.0.0"
"leaflet-geometryutil": "^0.10.3"
"leaflet-measure-path": "^1.5.0"
"leaflet-path-drag": "^1.9.5"
"@turf/turf": "^7.2.0"
"gcoord": "^1.0.7"
"delaunator": "^5.0.1" / "@types/delaunator": "^5.0.3"
"dom-to-image": "^2.6.0"
"html2canvas": "^1.4.1"
"file-saver": "^2.0.5"
"jspdf": "^4.2.1"
"exceljs": "^4.4.0"
"xlsx": "^0.18.5"
"xlsx-populate": "^1.21.0"
"xml2js": "^0.6.2"
"zustand": "^5.0.3"
"@reduxjs/toolkit": "^2.3.0" / "react-redux": "^9.1.2" / "redux": "^5.0.1" / "redux-saga": "^1.3.0"
"react-router": "^5.3.4" / "react-router-dom": "^5.3.4" / "react-router-redux": "^4.0.8" / "history": "^4.10.1"
"qiankun": "^2.10.16" / "vite-plugin-qiankun": "^1.0.15"
"react-dnd": "^16.0.1" / "react-dnd-html5-backend": "^16.0.1"
"react-draggable": "^4.4.6" / "react-resizable": "^3.1.3" / "react-color": "^2.19.3"
"crypto-js" / "lodash" / "dayjs"
"antd": "^5.22.0" / "@ant-design/cssinjs" / "@ant-design/icons"
devDependencies: "@types/leaflet": "^1.9.14"
```

**明确不存在**：`three`、`fabric`、`konva`、`dxf-parser`、`dwg` 相关解析库、`@react-three/*`。

### 3.2 monorepo 根 `package.json`
`/Users/wangzijie/Documents/full-process-digitization/sdpwork/qgcszh-monorepo/package.json`
- dependencies 仅 `antd ^5.26.0`；其余为 devDependencies（commitlint / concurrently / husky / prettier 等），**无 CAD 相关依赖**。

### 3.3 依赖风险
- `OnlineDesignCad/Cadmap/exportDxf.ts` 中 `import ... from 'jszip'`，但 **`jszip` 未在 `$APP/package.json` 声明**（可能靠传递依赖）。复刻时需显式补装 `jszip`。

---

## 四、入口组件、路由挂载方式与数据流

### 4.1 路由链路（新版）

```
$APP/src/Router.tsx               (132 行，HashRouter + Switch)
        │  <Route path="/BasicLayout" ... />
        ▼
$APP/src/myFrame/layouts/BasicLayout.tsx (150 行)
        │  getMenuProps(globalData.menuData, pathname, globalData.routes, isPc) → pageObjKey
        │  读 globalData.routes[pageObjKey] 的 fullCenter / noSider / fullScreen
        ▼
$APP/src/myFrame/layouts/EntryComponent.tsx (29 行)
        │  React.useMemo(() => globalData.getComponent(globalData.routes[pageObjKey]), [pageObjKey])
        ▼
$APP/src/projectRoute.config.ts   (1598–1602 行)
        TaskListWxCad: {
          path: '/BasicLayout/Design/Online/Management/TaskListWxCad',
          models: () => [import('./pages/OnlineDesignCadWx/TaskList/model')],
          component: () => import('./pages/OnlineDesignCadWx/TaskList/index.tsx')
        }
        ▼
$APP/src/pages/OnlineDesignCadWx/TaskList/index.tsx
        │  <Route path={config.treeAndGis} render={... <TreeAndGisWx {...location.state} />} />
        ▼
$APP/src/pages/OnlineDesignCadWx/TaskList/config.ts
        treeAndGis = globalData.routes.TaskListWxCad.path + '/treeAndGis'
        ▼
$APP/src/pages/OnlineDesignCadWx/TreeAndGis/index.tsx
        │  <CadDrawingTreePanel/> + <CadCanvasContainer/> + 模板/历史弹窗
        ▼
$APP/src/pages/OnlineDesignCadWx/TreeAndGis/CadCanvasContainer.tsx
        ▼
$APP/src/pages/OnlineDesignCadWx/CadmapWx/index.tsx
        ▼
$APP/src/pages/OnlineDesignCadWx/LocalCadBase/index.tsx  (Zustand + Leaflet 插件)
        ▼
$APP/src/pages/OnlineDesignCadWx/LocalCadBase/main.tsx    (MapContainer 及全部叠层)
```

完整 hash 路由：
`#/BasicLayout/Design/Online/Management/TaskListWxCad/treeAndGis`

补充：
- 桌面版 `/OnlineDesignCad` 是在 `Router.tsx` 第 122 行硬编码的 `<Route path="/OnlineDesignCad" render={props => <TaskList {...props} />} />`。
- 同 `projectRoute.config.ts` 中还有：`DrawingTemplate`(25–28)、`TaskList`(1593–1597)、`cadTemp`(1633–1636)、`bottomFrame`(1640–1641)、`material`(1646–1647)、`PrimitiveManagement`(1684–1687)。
- `config.ts` 的 `dicMapping`（约 1814 行）定义图纸分类字典：任务图 / 光缆路由图 / 光缆逻辑图 / 管道路由图 / 逻辑子图 / 路由子图等。

### 4.2 画布入口装配

`CadmapWx/index.tsx`（52 行）：
```tsx
<OnlineCadBase
  mapType bottomMap baseMapSvgUrl showCadFrame
  drawingScaleRatio drawingScaleUnit drawingBoundary
  initState={{ openChooseTempFrame, onIsFullscreen, onOpenTreeDrawer, isFullScreen }}
>
  <InitGetData /> <LayerDrawer /> <Bounday showCadFrame /> <Onload />
  <OpenDialog /> <MaterialDialog /> <DateDialog /> <TableDialog />
  <BottomTool onOpenHistory={openHistoryVersion} />
</OnlineCadBase>
<CadThumbnailStage bottomMap baseMapSvgUrl />
```

`LocalCadBase/index.tsx`（277 行）关键点：
```tsx
window.L = L;
import './leaflet.drag';
import './leaflet.rotatedMarker';
import './leaflet-path-transform';
import './Leaflet.Editable';
import './leaflet-measure-path';
```
Zustand Store 字段（同一份 store context）：
`curToolBar`、`customToolBars`、`customBaseOptions`、`overlayRefs`、`mapObj`、`events`、`selectedElements`、`rectElectedElements`、`elementList`、`elementListRefs`、`eleTypeList`、`curOperateType`、`commandOn`、`curDrawing`、`toolBarEvents`、`downOperateCallback`、`rightMenuEvents`、`generatePointEvents`、`geometryEvents`、`batchEvents`、`mapType`（`'总图' | '子图' | '附图-端子面板' | '其他' | '模板预览'`）、`operationsData`、`snapEnabled/snapThreshold/snapTargetOptions/snapHint`、`showPropertyPanel`、`backEvents`、`selGraphKeys`、`subMapBgColor='#121c25'`、`finalFontSize=10`、`currentScaleRatio/currentScaleUnit`。

事件总线 `onlineCadEventDefine`：
`terminal / onMapLoaded / onOverlayClick / onMapChange / onRightClick / commandEnd / drawingEnd / opeateRightMenu / closeAllContextMenus / contextmenu / batchRotate / BatchRotateAndScale / batchScale / fibrecore / TranslateBatch / XuanzhuanBatch / ScaleBatch / toolbarSave / exportDrawing / StaightenOut / refreshFigureLibrary`。

按 `mapType` 分派：
```tsx
{mapType === '子图' && <ComponentRaw/>}
{mapType === '模板预览' && <ComponentRaw/>}
{mapType === '总图' && <TotalMap/>}
{mapType === '其他' && <TotalMap/>}
{mapType === '附图-端子面板' && <TerminalPanelMap/>}
```
对外暴露 `useContext()` / `useEvent()`。

`LocalCadBase/main.tsx`（131 行）：
`MapContainer`（`maxZoom=30`、`zoomSnap=0.5`、`doubleClickZoom={false}`、`editable`）内：
`MapSvgOverlay`、`PolylineDrawMeasure`、`children`、`AfterLoaded`、`BatchRotateAndScale`、`Terminal`、`BatchScale`、`BatchRotate`、`MapRightMenu`、`FiberCore`、`TranslateBatch`、`XuanzhuanBatch`、`StaightenOut`、`EleRender`、`TipBar`、`ScaleBatch`；
外层：`ToolBar`、`CadLoadingProgress`、`PropertySidebar`。

### 4.3 图元模型 `CadElement`（`LocalCadBase/interface.ts`，367 行）

核心字段：
- `drawType`：点 / 线 / 面 / 标注点 / 标注表格 / 端子面板 / 参照物 / 管孔 / 自定义圆 / 自定义矩形 / 自定义多边形 / 自定义线 / 自定义素材点 / 标注引线 / 自定义日期 / 自定义编号 / 文本框 / 指北针
- `eleType`、`lat/lng`、`positions`、`drawPara`、`detailBody.body.data`、`recordId/resId`
- 模板标记：`templeId / templateId`

坐标与边界：
- `boundary` 形如 `[minLng, maxLng, minLat, maxLat, baseZoom, finalFontSize, templateId]`
- `scale / unit` 为绘图比例
- zoom 变化通过 CSS 变量 `--leaflet-marker-scale`、`--leaflet-line-width` 等比缩放图元
- 已有工具函数：`handlePositions`、`updateRelPosition`（相对坐标）

### 4.4 图纸加载数据流

```
用户在 CadDrawingTreePanel 选中节点 (drawingId)
  │
  ▼ TreeAndGis/index.tsx: handleTreeNodeSelect(drawingId)
  │   1. getDrawingDetail(id)                     ← service.ts GET /drawings/detail
  │   2. getDrawingObjectsFromDetail(detail)       ← templateCanvas.ts
  │   3. normalizeDrawingObjects(objects)          ← templateCanvas.ts（drawType 归一）
  │   4. buildMapObjectsFromDetail(...)            ← templateCanvas.ts
  │        └─ resolveTemplateCanvasObjects(...)    ← 递归 5 层，拉 /drawingTemplate/detail
  │        └─ mergeDrawingObjectsWithTemplate(...) ← 同 id 以图纸为准
  │
  ▼ dispatch redux:
      cadMapData / handleMapData / filteredLayers / selGraphNode / cadLoading
  │
  ▼ Zustand: elementList ← filteredLayers（syncElementLayersFromData）
  │
  ▼ EleRender / SuMap/EleRender 遍历 elementList → 生成 Leaflet Marker/Polyline/Polygon/Overlay
```

（`templateCanvas.ts` 中另有 `parseCanvasDataRoot` 最多 3 层 JSON 解析；`resolveTemplateBaseMapUrl` 支持 `previewUrl/thumbnailUrl/baseMapUrl/underlayUrl` → `files[0]` → `getUrlByFileId`，SVG 追加 `?isSvg=true`。）

### 4.5 交互数据流

- 绘制：`ToolBar/config.ts` 的 `toolsDefine` → `curToolBar` → `Operation/Operates/*` 子组件 → 生成 `CadElement` → 写入 Zustand `elementList` → `EleRender` 重绘。
- 选中/拖拽/旋转/缩放：`leaflet.drag.js`、`leaflet.rotatedMarker.js`、`leaflet-path-transform.js`、`Leaflet.Editable.js`；坐标回写 `positions / lat / lng`。
- 吸附：`leaflet.snap.js` + `SuMap/Elements/NewMarkerBox/snap.ts`，配 `snapEnabled/snapThreshold/snapTargetOptions/snapHint`。
- 测距：`leaflet-measure-path.js` + `PolylineDrawMeasure.tsx`。
- 右键菜单：`Operation/OpeateRightMenu/MapRightMenu`、`EleRightMenu`、`RightMenu`。
- 键盘命令：`CadKeyboard/*`（Command/Editing/Global/NonEditing/ShortcutGuide）。
- 双向同步：`elementList` → `reorderCadMapDataByElementList` → Redux `cadMapData`；脏检查用 `getCadSourceElements` + 签名对比。

### 4.6 保存数据流

**手动保存**（`CadmapWx/Onload.tsx`，2241 行）：
```
const thumbnailId = await uploadCadThumbnail(drawingId);
const res = await saveDrawingCad({
  id: drawingId, templateId, scale, unit, boundary, thumbnailId,
  changeType: 'manual',
  content: { showCadFrame, scale, unit, boundary, layers: [], objects, annotations, tables },
  changeDescription: values?.changeDescription?.trim()
});
```

**自动保存**（`cadStorage/autoSave.ts`，688 行）：
```
AUTO_SAVE_INTERVAL_MS = 30 * 1000
DRAFT_PERSIST_DEBOUNCE_MS = 2 * 1000
isCadDrawingDirty(...) / evaluateCadDirtyState(...)
  → buildCadAutoSavePayload(...)
  → saveCadDraftToIndexedDb(...)       // 先写 IndexedDB，缩略图异步补写（savedAt 校验防覆盖）
  → 若需上后端：saveCadDraftPlaceholder(...)
       1) 物化模板图元：若已有绝对 lat/lng/positions，则删除 templeId/templateId
       2) filterNonTemplateElementsForSave(...).map(sanitizeCadElementForSave)
       3) splitCadElementsForSave(...)
       4) uploadCadThumbnail(graphId)
       5) saveDrawingCad({ ..., changeType: 'auto', changeDescription: `自动保存(${时间})` })
       6) 成功后 markCadSavedBaseline(...) + deleteCadDraft(...)
```

**本地草稿**（`cadStorage/cadDraftDb.ts`，201 行）：
- DB：`qgcszh-cad-draft`，Store：`drafts`，keyPath `graphId`
- 记录：`CadDraftRecord { graphId, businessKey, elements, showCadFrame, scale, unit, boundary, thumbnailSrc, savedAt, schemaVersion: 1 }`
- 恢复撤销项常量：`CAD_DRAFT_RESTORE_UNDO_KEY = '自动保存恢复'`
- 打开库失败/被占用返回 `null`；缺 store 自动升版本重建；序列化丢弃 function / 非字符串 `svg` / 循环引用。

**缩略图**（`cadStorage/cadThumbnail.ts`，448 行）：
- 常量：`CAD_THUMBNAIL_BUSINESS_TYPE='CAD缩略图'`、`400×300`、`THUMBNAIL_QUALITY=0.82`、`MARKER_SCALE_SETTLE_MS=340`、`CAPTURE_TIMEOUT_MS=12000`、`DEFAULT_THUMBNAIL_BACKGROUND='#121c25'`
- 优先 `captureFromStage`（隐藏 `CadThumbnailStage`），兜底 `captureFromLiveMap`（临时 `setView` 后还原）
- 裁剪 `resolveCropBox`（边界外扩 4%，补足 4:3，`cover`）；`isSolidCanvas` 过滤纯色
- 上传 `uploadFile(formData)` → `resolveUploadedFileId`（兼容 `result['CAD缩略图'].fileId` / `result.file.fileId` / `result.fileId`）

### 4.7 后端接口总表（`TreeAndGis/service.ts`，594 行）

三套前缀：`designProxy + '/api'`、`systemProxy + '/api'`、`proxyUrl + '/api'`；另有 `requestWxCadFolder` / `requestWxCadApi`（带 `SC-Token` 头，`VITE_WXCAD_HOST` 存在时 `credentials: 'include'`）。

- 图纸：`GET /drawings/detail`、`POST /drawings/save`、`/drawings/create`、`/drawings/update`、`/drawings/deleteByIds`、`/drawings/export`(BLOB Excel)、`/drawings/exportPdf`、`/drawings/versions`、`/drawings/versionDetail`、`/drawings/compareVersions`、`/drawings/restoreVersion`、`/drawings/batchUpdateNumbers`
- 模板：`/figures/templateList`、`/drawingTemplate/detail`、`/drawings/createFromTemplate`、`/figures/saveTemplate`、`/figures/createByDrawing`、`/figures/typeList`、`/figures/list`、`/figures/getConstructDesc`
- 图纸树：`/wxCadFolder/getFolderTree|insert|update|delete`
- 勘察/子图：`/surveyOrderRecordDetail/queryRecordDetailAndPointsByTaskId`、`/SurveyOrderRecordDetailSub/{insertBatch,insertBatchWithReturn,insertOrUpdateBatchWithReturn,update,getGisChangePage,updateGisChange}`、`/cadMainSubgraph/{insertWithReturn,update,delete,queryListByRecordIds}`、`/layerUp/eleDefine/list`、`/sysRegion/getRegions`、`/gkTaskUnit/listWithSpecialCondition`

`saveDrawingCad` 归一化 payload：
```ts
const payload = {
  id, templateId, scale, unit, boundary, thumbnailId,
  content: content || { layers: [], objects: [], annotations: [], tables: [] },
  changeDescription, changeType
};
return request(`${url}/drawings/save`, { method: 'POST', body: payload });
```

备注：`queryRecordDetailAndPointsInSubByTaskId` 目前直接返回 `[]`（旧实现被注释）。

`CadmapWx/service.ts`（117 行，前缀 `globalData.designProxy + '/api'`、`globalData.proxyUrl + '/api'`）：
`/SurveyOrderRecordDetailPointSub/updateBatch`、`/SurveyOrderRecordDetailSub/{updateBatch, deleteByResIdsAndInsertPoints, update, recoverByIds, deleteBatch, insertBatch}`、`/achievement/insertOrUpdateCompat`、`/cadPicResource/{page, pageWithSpecialCondition}`。

### 4.8 模板图元机制（`templateCanvas.ts`，863 行）

主要导出：
- `DEFAULT_CAD_FRAME_URL`（`总图图框A3.svg`）
- `parseCanvasDataRoot`（最多 3 层 JSON 解析）
- `normalizeTemplateDetail`
- `resolveTemplateBaseMapUrl`
- `extractObjectsFromCanvasRoot`（objects/annotations/tables → content → contentJson）
- `resolveTemplateCanvasObjects(tplDetail, visited, depth)`（**最多 5 层嵌套递归**）
- `fetchDrawingTemplateDetail`（并发合并 + 内存缓存 `templateDetailCache` / `templateDetailDataCache`，支持 `forceRefresh`）
- `markTemplateElements` / `isTemplateMarkedElement` / `filterNonTemplateElementsForSave`
- `normalizeDrawingObjects`（drawType 映射表：`点/线/面/参照物/标注/图框/表格/line/polyline/polygon/figure/point/text/table/marker/reference/material`）
- `mergeDrawingObjectsWithTemplate`
- `buildMapObjectsFromDetail` / `resolveDrawingBaseMapState` / `buildPreviewRenderDataFromDetail`
- `getDrawingObjectsFromDetail` / `mergeObjectsAndTables`（表格归一 + id 去重）
- `buildTemplateCanvasDataPayload`（另存为模板：`contentJson = {layers:[],objects,tables,annotations,showCadFrame}`）
- `getLiveDrawingElementsFromPageState`（Redux + Zustand 合并）/ `replaceDrawingTemplateElements`
- `findDrawingIdInFolders` / `extractCreatedDrawingId`

### 4.9 微前端与离开拦截

- `qiankun` 接入：`FrameObj._history`、`VITE_QIANKUN_BASENAME`。
- `TreeAndGis/index.tsx` 中 `FrameObj._history.block(...)`：有未保存修改时弹确认；选「不保存」调用 `saveCurrentCadDraftToIndexedDb` 存本地草稿。
- 切换图纸：`confirmUnsavedChanges`。

---

## 五、静态资源清单

### 5.1 SVG 图元库（新版）
目录：`$APP/src/pages/OnlineDesignCadWx/assets/`
确认存在：
`指北针.svg`、`总图图框A3.svg`、`落地监控杆.svg`、`落地景观灯塔.svg`、`落地角钢塔.svg`、`落地双轮景观塔.svg`、`落地单管塔.svg`、`落地仿生树.svg`、`楼顶角钢塔.svg`、`楼顶拉线桅杆.svg`、`楼顶拉线塔.svg`、`抱杆.svg`、`平台.svg`、`机房.svg`、`机架.svg`、`配电箱.svg`、`交流配电箱.svg`、`室外机柜.svg`、`分纤箱.svg`、`走线架.svg`、`室外走线架.svg`、`爬梯.svg`、`空调.svg`、`电源.svg`、`门.svg`、`窗.svg`、`设备图例.svg`、`设备表.svg`、`材料表.svg`、`工参表.svg`、`天线图.svg`、`天线角度.svg`、`信源图.svg`、`室分AP.svg`、`插入图片.svg`、`图框编辑器.svg`、`室分导入楼层平面图.svg`

### 5.2 图框 SVG（同组件目录）
`$APP/src/pages/OnlineDesignCadWx/LocalCadBase/Elements/CadFrame/`
`子图图框A3.svg`、`总图图框.svg`、`总图图框A3.svg`

### 5.3 图标
- `$APP/src/common/assets/`：`CAD_export.png`、`CADexcel_export.png`、`DWG.png`、`DIG.png`、`PDF.png`、`layer_on.png`、`layer_off.png`、`插入工作量表.png`
- `$APP/src/assets/`：`icon_CAD_close.png`、`icon_CAD_layer.png`、`icon_CAD_save.png`、`综合箱.svg`

### 5.4 Leaflet 图片资源
`$APP/src/common/components/LeafletBase/images/*`（marker-icon、maptools_*、drawtools_* 等）、`$APP/src/common/components/LeafletBase/LayerEditor/EditorBtns/icons/*`

### 5.5 示例文件
`$APP/public/static/材料清单模板.dwg`（**仅静态示例，无任何解析代码引用**）

### 5.6 明确不存在的资源
- **无 wasm**（`@turf` 为纯 JS）
- **无 Web Worker**（未发现 `new Worker` / `Worker(`）
- **无自定义字体**（未发现 `@font-face` / `.ttf` / `.woff`）
- `public/static/wf/*` 属于 Oryx/BPMN 工作流资源，与 CAD 无关

---

## 六、复刻所需最小文件集合与 import 依赖关系

### 6.1 最小可行集合（推荐分层）

**L0：运行时依赖（package.json）**
`leaflet`、`react-leaflet`、`leaflet-draw`、`leaflet-editable`、`react-leaflet-editable`、`@turf/turf`、`gcoord`、`delaunator`、`dom-to-image`、`file-saver`、`jspdf`、`xlsx`、`exceljs`、`zustand`、`antd`、`dayjs`、`lodash`

**L1：Leaflet 插件与样式（必须整体拷走，无法替代）**
```
$APP/src/pages/OnlineDesignCadWx/LocalCadBase/leaflet.drag.js
$APP/src/pages/OnlineDesignCadWx/LocalCadBase/leaflet.rotatedMarker.js
$APP/src/pages/OnlineDesignCadWx/LocalCadBase/leaflet-path-transform.js
$APP/src/pages/OnlineDesignCadWx/LocalCadBase/Leaflet.Editable.js
$APP/src/pages/OnlineDesignCadWx/LocalCadBase/leaflet-measure-path.js
$APP/src/pages/OnlineDesignCadWx/LocalCadBase/leaflet.css
$APP/src/pages/OnlineDesignCadWx/LocalCadBase/index.module.less
$APP/src/pages/OnlineDesignCadWx/LocalCadBase/modalOverlay.less
$APP/src/common/components/LeafletBase/leaflet.snap.js
$APP/src/common/components/LeafletBase/leaflet.wmts.js
$APP/src/common/components/LeafletBase/leaflet-geometryutil.js
$APP/src/common/components/LeafletBase/leaflt.markcluster.css
$APP/src/common/components/LeafletBase/images/
```

**L2：类型与基础工具**
```
LocalCadBase/interface.ts        (CadElement 等类型，367 行)
LocalCadBase/utils.ts            (1909 行)
LocalCadBase/scaleUtils.ts       (177 行)
LocalCadBase/viewportFit.ts      (22 行)
LocalCadBase/storeContext.ts
LocalCadBase/cadMapLock.ts
LocalCadBase/elementPick.ts
LocalCadBase/layerOrder.ts
LocalCadBase/modalContainer.ts   (127 行)
LocalCadBase/figureCompositeCapture.ts (405 行)
aligning/alignment/*.ts
```

**L3：画布内核**
```
LocalCadBase/index.tsx           (总装 + Zustand Store + window.L 注入)
LocalCadBase/main.tsx            (MapContainer)
LocalCadBase/loaded.tsx          (463 行)
LocalCadBase/totalMap.tsx        (82 行)
LocalCadBase/terminalPanelMap.tsx(72 行)
LocalCadBase/MapSvgOverlay.tsx   (257 行)
LocalCadBase/PolylineDrawMeasure.tsx (590 行)
LocalCadBase/EleRender/index.tsx (171 行)
LocalCadBase/SuMap/EleRender/index.tsx (366 行)
```

**L4：图元渲染组件**
```
LocalCadBase/Elements/CadFrame/index.tsx (+3 个 svg)
LocalCadBase/Elements/Annotation/, FiberSection/, ZhBox/
LocalCadBase/SuMap/Elements/{NewMarkerBox, MarkerLines, MarkerBox, PipeBox, TerminalPanelBox}
LocalCadBase/SuMap/util.ts
LocalCadBase/TableMarker/*
LocalCadBase/DynamicMarkers/*
```

**L5：工具栏与编辑工具**
```
LocalCadBase/ToolBar/{index.tsx, config.ts, util.ts, layerActions.ts, FigureLazyImage.tsx}
LocalCadBase/Operation/{index.tsx, Command, Drawing, RightMenu, EleRightMenu, OpeateRightMenu, PropertySidebar, ResourceModal, FiberCoreAssignMarker}
LocalCadBase/Operation/Operates/*     (按需裁剪，核心：EnterLine, CustomLine, CustomPolygon,
                                        EnterTable, EnterTag, EnterReference, EnterFrameEditor,
                                        CusTextInput, MaterialPoint, RectanglePoit, Mirror,
                                        newParallel, stretch, section, crop, dimensionMark,
                                        fiberCore, batchRotate, batchScale, TranslateBatch,
                                        XuanzhuanBatch, ScaleBatch, StaightenOut,
                                        BatchRotateAndScale, utils.tsx)
LocalCadBase/PipeParaEditor/, TerminalPanelEditor/, CadLoadingProgress/, TipBar/, CommandPanel/
LocalCadBase/CadKeyboard/*
```

**L6：页面业务层**
```
OnlineDesignCadWx/CadmapWx/index.tsx
OnlineDesignCadWx/CadmapWx/main.tsx 相关子组件：
  InitGetData.tsx, Onload.tsx, Bounday.tsx, LayerDrawer/, BottomTool.tsx,
  OpenDialog.tsx, MaterialDialog.tsx, DateDialog.tsx, TableDialog.tsx,
  HandleChildMap.tsx, EditorPolygon/, config.ts, service.ts, utils.tsx
OnlineDesignCadWx/CadmapWx/cadStorage/{index.ts, cadDraftDb.ts, autoSave.ts, cadThumbnail.ts, cadThumbnailStage.tsx, CadThumbnailPreview.tsx}
OnlineDesignCadWx/TreeAndGis/{index.tsx, CadCanvasContainer.tsx, CadDrawingTreePanel.tsx,
  CadTemplateSelectorModal.tsx, CadHistorySelectorModal.tsx, CadMapPreviewModal.tsx,
  ChooseTempFrame/, LeftMapTree/, service.ts, templateCanvas.ts, util.ts, routeAdjust.ts,
  interface.ts, types.ts, index.exports.ts}
OnlineDesignCadWx/TaskList/{index.tsx, config.ts, model.ts}
OnlineDesignCadWx/assets/*  (全部 SVG)
```

**L7：路由接入**
```
src/Router.tsx
src/project.config.ts
src/projectRoute.config.ts   (新增 TaskListWxCad 条目)
src/myFrame/layouts/BasicLayout.tsx
src/myFrame/layouts/EntryComponent.tsx
```

**L8（可选）：DXF 导出（桌面版）**
```
OnlineDesignCad/Cadmap/exportDxf.ts
OnlineDesignCad/Cadmap/dxfTemplate.ts
OnlineDesignCad/Cadmap/exportDxfTable.ts
OnlineDesignCad/Cadmap/exportDxfBackground.ts
OnlineDesignCad/Cadmap/exportDxfProgress.ts
OnlineDesignCad/Cadmap/DxfExportProgress.tsx
+ 需补装 jszip
```

### 6.2 import 依赖关系图（自底向上）

```
 [leaflet + 本地 vendored 插件]  ── window.L ──┐
 [zustand]                                     │
 [react-leaflet]                               │
        │                                      │
        ▼                                      │
 LocalCadBase/index.tsx  ◀─────────────────────┘
        │ 提供 StoreContext / useEvent / useContext
        │
        ├──▶ LocalCadBase/main.tsx
        │        ├──▶ MapSvgOverlay.tsx
        │        ├──▶ PolylineDrawMeasure.tsx   (leaflet-measure-path)
        │        ├──▶ EleRender/index.tsx
        │        │       ├──▶ Elements/CadFrame
        │        │       ├──▶ Elements/Annotation | FiberSection | ZhBox
        │        │       ├──▶ TableMarker/*
        │        │       └──▶ DynamicMarkers/*
        │        ├──▶ SuMap/EleRender/index.tsx
        │        │       ├──▶ SuMap/Elements/{NewMarkerBox(+snap), MarkerLines, MarkerBox, PipeBox, TerminalPanelBox}
        │        │       └──▶ SuMap/util.ts
        │        ├──▶ ToolBar/index.tsx  (config.ts, util.ts, layerActions.ts)
        │        │       └──▶ Operation/Operates/*  (utils.tsx: sanitizeCadElementForSave)
        │        ├──▶ BatchRotateAndScale | BatchScale | BatchRotate | TranslateBatch
        │        │    | XuanzhuanBatch | ScaleBatch | StaightenOut | FiberCore | Terminal
        │        ├──▶ MapRightMenu / RightMenu / PropertySidebar
        │        ├──▶ CadLoadingProgress (useCadLoadProgress.ts)
        │        ├──▶ CadKeyboard/*
        │        └──▶ afterLoaded → loaded.tsx
        │
        ▼
 CadmapWx/index.tsx
   ├──▶ LocalCadBase (OnlineCadBase)
   ├──▶ InitGetData.tsx
   │       ├──▶ TreeAndGis/service.ts (getSurveyOrderRecordDetailListLayer)
   │       ├──▶ CadmapWx/service.ts   (queryRecordDetailAndPointsInSubByTaskId)
   │       └──▶ utils.tsx (handelEles, mapJsonToCadElements, updateRelPosition)
   ├──▶ Bounday.tsx → Elements/CadFrame
   ├──▶ LayerDrawer/, BottomTool.tsx
   ├──▶ OpenDialog / MaterialDialog / DateDialog / TableDialog
   ├──▶ Onload.tsx
   │       ├──▶ TreeAndGis/service.ts (saveDrawingCad, ...)
   │       ├──▶ CadmapWx/service.ts
   │       ├──▶ cadStorage/autoSave.ts
   │       └──▶ cadStorage/cadThumbnail.ts
   └──▶ cadStorage/cadThumbnailStage.tsx
        │
        ▼
 TreeAndGis/CadCanvasContainer.tsx ──▶ CadmapWx/index.tsx
        │
        ▼
 TreeAndGis/index.tsx
   ├──▶ CadDrawingTreePanel.tsx ──▶ TreeAndGis/service.ts, cadStorage/CadThumbnailPreview
   ├──▶ CadCanvasContainer.tsx
   ├──▶ CadTemplateSelectorModal.tsx ──▶ service.ts, templateCanvas.ts
   ├──▶ CadHistorySelectorModal.tsx  ──▶ service.ts
   ├──▶ CadMapPreviewModal.tsx       ──▶ templateCanvas.ts
   ├──▶ templateCanvas.ts
   │       ├──▶ service.ts (drawingTemplateDetail / getUrlByFileId)
   │       └──▶ Operation/Operates/utils.tsx (sanitizeCadElementForSave)
   ├──▶ cadStorage/{autoSave, cadDraftDb, cadThumbnail}
   ├──▶ routeAdjust.ts / useCadRouteStore
   └──▶ FrameObj._history.block
        │
        ▼
 TaskList/index.tsx ──▶ TaskList/config.ts ──▶ projectRoute.config.ts
        │
        ▼
 myFrame/layouts/EntryComponent.tsx ──▶ BasicLayout.tsx ──▶ Router.tsx
```

### 6.3 复刻时最容易踩的坑

1. **`window.L = L` 必须早于所有 `import './leaflet.xxx'`**，否则本地插件找不到全局 `L`。
2. `CadCanvasContainer` 的 `key` **不能包含 `bottomMap`**（注释明确说明：首次打开由 false→true 会导致 Leaflet 地图与进度条被销毁重建，进度条刚出现就消失、首次图框不显示）。当前 key 为 `${mapType}-${treeData?.key || 'default'}`。
3. `MapContainer` 需 `maxZoom=30 / zoomSnap=0.5 / doubleClickZoom={false} / editable`。
4. 图元缩放依赖 CSS 变量 `--leaflet-marker-scale`、`--leaflet-line-width`，复刻时 CSS 必须一起搬。
5. 自动保存必须提交**全量** `objects`（后端整体覆盖），且**先物化模板图元**（有绝对坐标就删除 `templeId/templateId`），否则模板图元会被重复叠加。
6. 缩略图保存有 `savedAt` 竞态校验，异步补写必须在 `savedAt` 未变时落地。
7. `jszip` 需显式补进依赖（`exportDxf.ts` 使用但 `package.json` 未声明）。
8. `TreeAndGis/interface.ts` 依赖 `../../OnlineDesignCad/TreeAndGis/interface`，说明新版对旧版有**跨版本类型复用**；只搬新版时需一并搬该 interface 文件或改路径。

---

## 七、明确「没找到」的部分

| 检索目标 | 结论 |
|---|---|
| three.js / THREE | **不存在**（精确 grep `three|THREE` 无 CAD 相关命中） |
| fabric.js | **不存在** |
| konva | **不存在** |
| dxf-parser / DxfParser / parseDxf | **不存在**，无 DXF 解析能力 |
| DWG 解析任何库 | **不存在**；`public/static/材料清单模板.dwg` 仅为静态示例文件 |
| wasm（`.wasm` / `WebAssembly`） | **不存在** |
| Web Worker（`new Worker` / `Worker(`） | **不存在** |
| 自定义字体（`@font-face` / `.ttf` / `.woff`） | **不存在** |
| monorepo 根 package.json 中的 CAD 依赖 | **不存在**（仅 `antd` 等） |
| `jszip` 在 `$APP/package.json` | **未声明**（但 `exportDxf.ts` 引用） |

---

## 八、建议的复刻执行顺序

1. 先装依赖：`leaflet`、`react-leaflet`、`@turf/turf`、`gcoord`、`delaunator`、`zustand`、`dom-to-image`、`file-saver`、`jspdf`、`xlsx`、`jszip`。
2. 拷 Leaflet 插件 + 样式（L1），跑通一个空白 `MapContainer`。
3. 拷 `interface.ts` + `utils.ts` + `scaleUtils.ts`（L2），定义 `CadElement`。
4. 拷 `LocalCadBase/index.tsx` + `main.tsx` + `EleRender`（L3），实现「读 elementList → 画 Marker/Polyline」。
5. 拷图元组件（L4），逐个验证 drawType 渲染。
6. 拷工具栏与编辑工具（L5），按业务需要裁剪。
7. 拷 `CadmapWx` + `cadStorage`（L6），打通加载/自动保存/缩略图。
8. 拷 `TreeAndGis`（L6），打通图纸树/模板/历史版本。
9. 最后接路由（L7）；DXF 导出（L8）按需单独移植并补 `jszip`。

以上所有结论均基于对 `$APP` 下源码的实际检索与读取，未做任何文件修改。

我先做完了源项目的 CAD 调研，下面是关键结论，然后需要你确认复刻范围。

## 源项目 CAD 的真实形态（和直觉不同）

- 它**不是** three.js / fabric / konva 的 CAD，也不是 DXF/DWG 解析器。
- 底座是 **Leaflet 1.9.4 + react-leaflet 4.2.1**，所有图元（点/线/面/标注/表格/端子面板/图框/图例素材）都是 Leaflet 的 Marker / Polyline / Polygon / SVG Overlay / DOM Overlay。
- 交互依赖 **5 个内置的 Leaflet 插件**（drag、rotatedMarker、path-transform、Editable、measure-path），它们从 `window.L` 取全局变量。
- 状态是 **Redux（图纸级）+ Zustand（画布级）** 双层。
- 页面业务在 `TreeAndGis`（图纸树、模板、历史版本、缩略图、自动保存 IndexedDB）和 `CadmapWx`（加载、交互总线、保存）中。
- DXF 只有**导出**（旧版 `OnlineDesignCad/Cadmap/exportDxf*`），DWG 只是一个示例文件，**没有任何解析**。
- 核心内核目录：[LocalCadBase](file:///Users/wangzijie/Documents/full-process-digitization/sdpwork/qgcszh-monorepo/apps/qgcszh-design-vite/src/pages/OnlineDesignCadWx/LocalCadBase)，页面层：[TreeAndGis](file:///Users/wangzijie/Documents/full-process-digitization/sdpwork/qgcszh-monorepo/apps/qgcszh-design-vite/src/pages/OnlineDesignCadWx/TreeAndGis)、[CadmapWx](file:///Users/wangzijie/Documents/full-process-digitization/sdpwork/qgcszh-monorepo/apps/qgcszh-design-vite/src/pages/OnlineDesignCadWx/CadmapWx)。

## 你项目的现状差异

- 你现在的地图栈是 **MapLibre + OpenLayers**（`src/features/gis`），**没有 Leaflet**。
- 源 CAD 单文件规模很大：`ToolBar/index.tsx` 3138 行、`Onload.tsx` 2241 行、`utils.ts` 1909 行，加上 30+ 个编辑工具组件，还有 antd 5 与 Redux 依赖。
- 直接整体搬过来会引入 Leaflet + antd + Redux 三套体系，和你现有的 shadcn + TanStack + Zustand 完全不兼容。

所以"复刻"必须先定范围，否则会做出一个无法维护的混血系统。


开始实施：画布内核 + 基础图元，Leaflet 原插件，mock 数据。先读取需要移植的核心源码。


现在开始实施。先安装 Leaflet 依赖，然后移植插件与内核。


现在更新图元层的 props 传递，并重写地图交互。

现在重写地图交互，加入绘制、键盘操作。

CAD 复刻已跑通到「可交互」状态，`/cad` 页面可访问：http://localhost:5180/cad

本轮补齐的内容：

- [cad-canvas.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/cad/components/cad-canvas.tsx)：对齐新 `bounds` 契约，并把工具栏、草稿层挂进画布
- [cad-draft-layer.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/cad/components/cad-draft-layer.tsx)：草稿虚线路径 + 顶点标记，落在 `cad-draft-pane`
- [cad-toolbar.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/cad/components/cad-toolbar.tsx)：选择/点/线/面/标注 切换、撤销上一点、完成、取消、删除选中、图元计数与操作提示
- [cad-map-interaction.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/cad/components/cad-map-interaction.tsx)：点/标注点击即落图元；线/面连续采点；`Enter` 提交、`Esc` 取消
- [store.ts](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/cad/store.ts)：新增 `commitDraft()`，顶点不足（线 <2、面 <3）时不生成图元
- 图元组件新增 `selectable`：绘制态下不抢选中、不拦地图点击，保证点在已有图元上也能继续采点

验证：`tsc -b` 零错误、`eslint src/features/cad` 零告警、`vite build` 通过（cad chunk 194 kB｜gzip 56.8 kB），dev server 下各模块均正常转译。

与源项目一致的部分：Leaflet 1.9 + 自建容器（绕过 StrictMode 白屏）、pane 五层分级、`--leaflet-marker-scale`/`--leaflet-line-width` 缩放变量、路径拖拽插件接管移动。尚未做：图纸树、模板、历史版本、属性面板、比例尺控件——需要的话我接着补属性面板和 1:N 比例切换。

---

