# 知识库入库编排（Ingestion Pipeline Orchestration）PRD

| 项目 | 内容 |
| --- | --- |
| 文档版本 | v1.0 |
| 状态 | 待评审 |
| 关联模块 | 知识库（/knowledge-base）、入库进度、（复用）Agent 编排画布 |
| 参考输入 | 「创建知识库」弹窗配置项 + 文档入库流水线 12 条参考设计 |

---

## 1. 背景与问题

当前知识库的「创建」是一个**固定表单**：用户填写名称/描述、选择数据类型、上传文件、选择分段方式、选 Embedding 模型、开关知识增强，然后后端按**写死的一条流水线**跑入库。见 [create-knowledge-base-dialog.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/knowledge-base/components/create-knowledge-base-dialog.tsx)。

问题：

1. **流水线不可见**：用户只在「入库进度」弹窗里看到后端返回的节点名（[ingest-progress-dialog.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/knowledge-base/components/ingest-progress-dialog.tsx)），无法预知有哪些环节、也无法调整。
2. **参数无处落**：表单里的 `segmentLength`、`preprocessRules`、`enhancement`、`embeddingModel` 只是零散字段（[knowledge-types.ts](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/knowledge-base/data/knowledge-types.ts#L21-L32)），缺少"这些参数属于哪个处理节点"的模型，后续加节点只能继续加表单项，表单会失控。
3. **异常不可修复**：任务失败后只能看原因，不能从失败节点重跑，通常要整份文档重来（贵在解析与 LLM 打标）。
4. **能力不可扩展**：OCR 兜底、摘要、关键词、敏感审核、人工审核、版本化等能力无法按知识库差异化开启。
5. **缺少对账与幂等**：向量入库"返回成功但数据不全"无法发现；同一文件重复导入会产生脏向量。

因此需要一个**面向知识库文档入库的可视化编排**：把固定流水线变成可配置、可版本化、可观测、可重试的编排模板，并把「创建知识库」收敛为编排模板的快捷配置层。

---

## 2. 目标与非目标

### 2.1 目标

- G1：提供可视化编排编辑器，支持拖拽/连线/配置/校验/发布，覆盖参考设计中的全部核心节点。
- G2：每个知识库绑定一份**编排版本**；「创建知识库」表单参数映射进编排，消除双份配置。
- G3：运行态可视化：按文件维度展示节点级耗时、入参/出参、异常、重试记录，支持**按 fileId 回放**。
- G4：失败可恢复：节点级重试策略 + 失败分支 + **从任意节点重跑**（复用上游产物快照）。
- G5：治理能力：多租户隔离、权限控制、DSL 版本快照、审计留痕、入库对账。

### 2.2 非目标（本期不做）

- 不做通用 DAG 调度平台（不承载非知识库业务任务）。
- 不做跨知识库的全局切片去重（去重作用域仅"同一文档内"）。
- 不允许用户在画布中写任意脚本/自定义代码节点（避免安全与稳定性风险，P2 再评估 HTTP 节点）。
- 流水线由**后端执行**，前端只负责编排定义与可观测，不在浏览器跑任务。
- 不改造现有 Agent 对话编排（`start/llm/knowledge/condition/tool/end`），两套画布共用基础设施但节点体系独立。

---

## 3. 名词定义

| 名词 | 含义 |
| --- | --- |
| 编排模板（Pipeline Template） | 一份可复用的入库流水线定义（节点 + 连线 + 参数），有租户归属与版本 |
| 编排版本（Pipeline Version） | 模板发布后的不可变快照，任务运行时锁定版本 |
| 知识库绑定（Binding） | 知识库 → 模板 + 版本 + 参数覆盖（overrides） |
| 运行（Run） | 一次"某个文件在某版本流水线上"的执行记录，`runId` 全局唯一 |
| 节点运行（Node Run） | Run 内单个节点的执行记录，含 attempt（重试次数） |
| 产物（Artifact） | 节点输出（解析文本、切片 JSON、向量批次等），可被下游复用与预览 |
| 幂等键（Idempotency Key） | 文件 md5 指纹，默认作用域为 `tenantId + kbId` |
| 试运行（Dry Run） | 用样例文件跑通编排但不写向量库/主数据，用于验证配置 |

---

## 4. 用户与场景

| 角色 | 场景 |
| --- | --- |
| 平台管理员 | 维护系统级模板（标准文档入库 / 扫描件 OCR / 严格管控），供租户引用 |
| 租户管理员 | 基于系统模板派生本租户模板，配置字典、模型、审核策略 |
| 知识库负责人 | 创建知识库时选模板并覆盖少量参数；上线后调参、试运行、发布新版本 |
| 运维/实施 | 查看失败任务、按 fileId 回放、从失败节点重跑、导出诊断信息 |

核心用户故事：

- US1：作为知识库负责人，我能在创建知识库时看到"这条流水线会经历哪些步骤"，并只调整我关心的 2~3 个参数。
- US2：作为实施，我能看到某个文件卡在"实体标注"节点、错误是 LLM 限流、已重试 3 次，并一键从该节点重跑。
- US3：作为租户管理员，我能把"敏感内容审核"节点插到向量入库前，违规切片直接拦截。
- US4：作为运维，我能发现某文档切片数 120、Milvus 实际 98 条，对账失败并告警。

---

## 5. 现状分析（可复用能力）

| 能力 | 现状 | 复用方式 |
| --- | --- | --- |
| 画布 | [flow/index.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/agent/flow/index.tsx) 基于 `@xyflow/react`，已实现拖拽、连线、`+` 号追加、Delete 删除、MiniMap、适应画布、移动端 Sheet 配置 | 抽成通用 `FlowCanvas`，节点渲染与配置面板由编排侧注入 |
| 节点元数据 | [flow-presets.ts](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/agent/flow/data/flow-presets.ts) 的 `NODE_KIND_META` 模式（label/summary/icon/色板） | 新增 `ingestNodeRegistry`，同样以注册表驱动节点库与图标 |
| 节点配置面板 | [node-inspector.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/agent/flow/node-inspector.tsx) | 改为 schema 驱动表单（通用区 + 节点参数区） |
| 节点库 | [node-palette.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/agent/flow/node-palette.tsx) 分组展示 | 按「接入 / 解析 / 处理 / 增强 / 存储 / 控制」六组分类 |
| 创建知识库表单 | [create-knowledge-base-dialog.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/knowledge-base/components/create-knowledge-base-dialog.tsx) | 保留为"模板快捷配置"，提交改为 `templateId + overrides` |
| 入库进度 | [ingest-progress-dialog.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/knowledge-base/components/ingest-progress-dialog.tsx) 轮询 `/status/{task_id}` | 升级为运行详情页，兼容旧接口 |
| 路由 | [component-registry.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/router/component-registry.tsx) 后台菜单动态挂载 | 编排编辑器作为**非线性路由**（带 `$kbId`/`$pipelineId` 参数），由页面内 `Link` 进入 |

---

## 6. 产品方案总览

四层结构，**单一事实来源**：

```
① 模板层  Pipeline Template（可视化编排，含版本）
              │ 派生 / 引用
② 绑定层  KnowledgeBase → { pipelineId, version, overrides }
              │ 运行
③ 运行层  Run(fileId) → NodeRun[]（快照锁版本、可重试、可回放）
              │ 输出
④ 观测层  运行详情 / 节点耗时与产物 / 审计埋点 / 告警对账
```

关键决策：

- **D1 单一事实来源**：分段、清洗、Embedding、知识增强等参数只存在于编排 DSL 中；知识库表仅存 `pipelineId + version + overrides`。创建弹窗是 DSL 的"快捷视图"，不新增独立业务字段（旧字段做兼容读取，写入时折叠进 overrides）。
- **D2 版本不可变**：模板每次发布生成新版本，运行中的任务锁定启动时版本，改模板不影响在跑任务。
- **D3 默认可用**：每个 `dataType` 预置模板，用户不进入编排编辑器也能一键创建（与现状体验一致）。
- **D4 编排只定义"怎么处理"**，文件来源（上传 / 批量 / OSS 监听）作为触发节点配置，不改变调用链。

---

## 7. 信息架构与入口

| 入口 | 位置 | 说明 |
| --- | --- | --- |
| E1 知识库卡片 | 列表卡片底部操作区（现「查看入库进度」旁）新增「入库编排」 | 进入该知识库绑定的编排，未绑定时引导选择模板 |
| E2 创建知识库弹窗 | 表单底部新增「查看/调整入库流程」链接 | 打开**只读预览**（创建前不可改模板结构，可改暴露参数） |
| E3 模板中心 | 知识库页顶部 Tab：「知识库 / 编排模板」 | 模板列表、新建、派生、发布、停用；系统模板只读 |
| E4 运行详情 | 入库进度入口升级；卡片显示"最近一次运行状态" | 支持从模板/知识库/文件多入口进入 |

页面清单：

1. 模板列表页 `/knowledge-base/pipelines`
2. 编排编辑器 `/knowledge-base/pipelines/$pipelineId`
3. 知识库编排（绑定视图）`/knowledge-base/$kbId/pipeline`
4. 运行详情 `/knowledge-base/runs/$runId`
5. 人工审核台（P1）`/knowledge-base/reviews`

---

## 8. 编排编辑器

### 8.1 布局

三栏（沿用 Agent 编排的响应式策略）：

- **左：节点库**，可折叠、可搜索，按分组展示，拖拽或点击添加。
- **中：画布**，点阵背景、MiniMap、缩放、适应画布；顶部浮动状态条（节点数/连线数/校验结果）。
- **右：节点配置**，未选中时展示"编排概览 + 校验结果"；选中时展示配置表单。

顶部工具栏：`返回`、知识库/模板名、版本下拉（查看历史版本）、`校验`、`试运行`、`保存草稿`、`发布`、状态徽标（草稿/未保存/已发布 v3）。

### 8.2 画布交互（沿用并补齐）

- 拖拽添加、从锚点连线、`+` 号在节点右侧快速追加并自动连线。
- 删除节点/连线（Delete/Backspace）、框选、复制粘贴（P1）。
- 连线样式区分：主链路（实线）、异常分支（虚线 + 红色）、条件分支（标签显示表达式）。
- 节点卡片展示：图标、名称、关键摘要（如"500 字 / 重叠 50"）、启用开关、异常标记。
- **只读态**：系统模板、已发布版本的查看、无编辑权限时为只读，隐藏拖拽手柄与保存。

### 8.3 节点配置面板

统一四段式，按节点类型渲染参数区：

1. **基础**：节点名称（默认取节点类型名）、说明、启用开关、节点 ID（只读）。
2. **参数**：由 `configSchema` 驱动（Select/Switch/Input/Number/Textarea/多选标签/键值对），带占位示例与帮助文案。
3. **失败与重试**（所有节点通用）：
   - 失败动作：`终止流程` / `重试后终止` / `跳过并继续` / `走异常分支` / `挂起待人工`
   - 重试次数 0–5、重试间隔、指数退避、最大超时
   - 是否幂等（重试是否复用已产出 Artifact）
4. **高级**：并发度、批量大小、日志级别、产物保留策略（保留/仅元数据）。

### 8.4 校验（发布前强校验）

| 规则 | 级别 |
| --- | --- |
| 有且仅有一个「文件接收」入口、至少一个「结束」 | 阻断 |
| 无环、无孤立节点（除禁用的扩展节点） | 阻断 |
| 每个分支条件必须有表达式与默认分支 | 阻断 |
| 必填参数缺失（如向量化未选模型、入库未选 collection） | 阻断 |
| 至少包含：解析 → 切片 → 向量化 → 向量入库 | 阻断 |
| 质量初检 / 向量校验 / 对账 未启用 | 警告 |
| 重试次数 > 0 但节点非幂等 | 警告 |
| 节点数 > 60 / 串行深度 > 20 | 警告（性能） |
| 条件分支表达式语法错误 | 阻断 |

校验结果以问题列表展示，点击定位到节点。

### 8.5 保存 / 发布 / 版本

- 保存草稿：仅自己可见，可随时继续编辑。
- 发布：生成不可变版本 `vN`，写发布说明；可选择「同时设为新建知识库的默认模板」。
- 版本对比（P1）：节点增删、参数 diff。
- 回滚：把历史版本另存为新版本（不改变历史）。
- 绑定切换：知识库切换到新版本时提示"仅影响之后的新文件，进行中任务仍使用旧版本"。

### 8.6 试运行（Dry Run）

- 入口：顶部「试运行」，选择 1 个 ≤15MB 合规文件（沿用 [knowledge-service.ts](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/knowledge-base/lib/knowledge-service.ts#L21-L33) 的格式与大小校验）。
- 选项：跑到指定节点为止 / 全流程；是否写向量库（默认否，写入临时 collection，跑完清理）。
- 展示：逐节点状态与耗时、每节点产物预览（清洗后文本、切片列表、标签、向量维度/范数、对账结果）。
- 试运行不占用正式任务配额，但记录审计。

---

## 9. 节点能力清单

> 覆盖参考设计的 12 条，并补充扩展节点。所有节点均为"可插入 / 可禁用 / 可配置"。

### 9.1 接入与校验

| 节点 | code | 职责 | 关键配置 | 默认失败动作 |
| --- | --- | --- | --- | --- |
| 文件接收 | `input.file` | 单文件上传 / 批量 zip / OSS 监听触发；生成 `fileId`、`docId`；入队 | 来源、并发度、队列优先级、zip 解压策略（保留目录层级/扁平化） | 重试后终止（3 次，指数退避） |
| 前置校验 | `guard.precheck` | 格式白名单、大小上限、病毒预扫（可选）、md5 指纹、知识库写权限、幂等判定 | 白名单、大小上限、是否病毒扫描、重复策略（覆盖/跳过/拒绝） | 终止（业务拒绝，不重试） |

幂等键：`md5(tenantId + kbId + fileMd5)`；命中去重时按策略分流，`跳过` 时 Run 直接标记 `skipped` 并给出已存在 `docId`。

### 9.2 解析与清洗

| 节点 | code | 职责 | 关键配置 | 默认失败动作 |
| --- | --- | --- | --- | --- |
| 文档解析 | `parse.document` | 调用 MinerU / 原生解析 / 表格解析 / 图片 OCR，输出 Markdown | 解析引擎（按 dataType 默认）、语言、页码范围、是否保留图片 | 重试 2 次后终止 |
| OCR 兜底 | `parse.ocr` | 扫描版 PDF 效果差时分支调用 OCR | 触发条件（解析质量 < 阈值 / 页均字符数 < N）、OCR 引擎、语言 | 跳过并继续（保留原解析结果） |
| 清洗与规范化 | `clean.normalize` | 剔除页码/页眉页脚/广告，全角半角与不可见字符归一，表格断行修复，垃圾切片过滤 | 规则开关组、自定义正则、广告词库、表格修复级别、丢弃空切片阈值 | 跳过并继续（记录警告） |
| 质量初检 | `guard.quality` | 有效文本占比、乱码率、空文档判定；不达标提前终止，节省 LLM/向量成本 | 有效文本阈值、乱码率阈值、动作（终止 / 转 OCR 分支） | 终止（可配置转分支） |

### 9.3 切片与去重

| 节点 | code | 职责 | 关键配置 | 默认失败动作 |
| --- | --- | --- | --- | --- |
| 切片 | `split.chunk` | 按自动/自定义规则分段 | 模式（自动/自定义）、长度（默认 500）、重叠、分隔符、是否按标题层级、表格是否独立成片 | 重试 1 次后终止 |
| 切片去重 | `split.dedupe` | **同一文档内**切片去重，降低冗余向量 | 算法（SimHash / 余弦相似度 / 精确匹配）、阈值（默认 0.95）、最短参与长度、是否保留首条 | 跳过并继续 |

### 9.4 增强与审核

| 节点 | code | 职责 | 关键配置 | 默认失败动作 |
| --- | --- | --- | --- | --- |
| 实体标注 | `enrich.entity` | 商品/设备识别：字典优先、LLM 兜底、多标签写入元数据 | 字典、LLM 模型、多标签开关、并发、兜底策略（保留空标签/打默认标签） | 跳过并继续（按兜底策略） |
| 摘要生成 | `enrich.summary` | 整篇摘要写入元数据，供知识库列表展示 | 模型、长度、是否写回主数据 | 跳过并继续 |
| 关键词提取 | `enrich.keywords` | 抽取关键词标签 | 数量、词库、是否参与检索过滤 | 跳过并继续 |
| 敏感内容审核 | `compliance.review` | 切片级内容安全审核，违规拦截不入库 | 审核通道（词库/模型）、命中动作（拦截/脱敏/转人工）、分级阈值 | 终止（合规场景不重试，直接走失败分支） |

### 9.5 向量与存储

| 节点 | code | 职责 | 关键配置 | 默认失败动作 |
| --- | --- | --- | --- | --- |
| 向量化 | `embed.vector` | 调用 Embedding 模型（默认 qwen3-embedding） | 模型、批量大小、维度、归一化、并发、限流 QPS | 重试 3 次（限流退避）后终止 |
| 向量校验 | `guard.vector` | 拦截全 0 / 空 / NaN / 维度不符向量 | 校验项开关、最大零向量占比 | 重试 1 次后终止 |
| 向量入库 | `store.vector` | 写 Milvus（collection / partition） | collection、partition、批量、upsert 策略、写入超时 | 重试 3 次后终止 |
| 入库对账 | `guard.reconcile` | 按 docId 反查向量数，与本地切片总数比对 | 容忍误差（默认 0）、比对维度（数量/批次/校验和）、动作（告警/重跑入库） | 走异常分支（告警 + 可重跑） |
| 主数据与缓存 | `store.master` | 写文档主表（名称、时间、状态、标签、切片数）、刷新 Redis 列表与统计 | 缓存 key 规则、TTL、失效策略、是否同步知识库统计 | 重试 3 次后终止（不阻断向量结果） |

### 9.6 控制与扩展

| 节点 | code | 职责 | 关键配置 |
| --- | --- | --- | --- |
| 条件分支 | `flow.condition` | 按表达式/质量指标分流（如质量不达标转 OCR） | 表达式、分支标签、默认分支 |
| 人工审核 | `flow.human-review` | 解析/打标后进入审核台，通过后才向量化 | 审核角色、超时时间、超时动作、可编辑范围（切片/标签） |
| 版本与增量 | `store.version` | 文档更新时旧版本切片软删、新版本入库 | 版本号规则、软删保留期、是否支持回溯、切流时机 |
| 结束 | `flow.end` | 成功/失败/跳过终态，汇总运行统计 | 终态类型、通知策略 |

> 审计与埋点（参考第 10 条）不做成可拖拽节点，作为**平台内建能力**：每个节点强制记录耗时、入参摘要、出参摘要、异常、traceId、attempt；避免用户误删观测能力。

---

## 10. 编排模板与「创建知识库」的联动

### 10.1 映射关系

| 创建弹窗字段 | 落点 | 说明 |
| --- | --- | --- |
| `dataType` | `input.file` 白名单 + 默认模板选择 | 非结构化→`标准文档入库`；结构化→`表格结构化入库`；多模态→`图片多模态入库` |
| `fileIds` | Run 的输入 | 每个文件一个 Run（`runId`），共享 `batchId` |
| `segmentMode=auto` | 使用模板默认 `split.chunk` 参数 | 不产生覆盖 |
| `segmentMode=custom` + `segmentLength` | `split.chunk.length` 覆盖 | 校验范围 100–2000 |
| `preprocessRules` | `clean.normalize.customRules` 覆盖 | 自由文本规则转为规则项（P0 存为自定义说明，P1 结构化） |
| `embeddingModel` | `embed.vector.model` 覆盖 | 当前仅 `qwen3-embedding` |
| `enhancement` | `enrich.entity` 节点启用开关 + 默认兜底策略 | 关闭时不插入增强节点 |
| `name` / `description` | 知识库主数据 | 不进编排 |

### 10.2 交互

- 弹窗内「分段处理 / Embedding / 知识增强」区域保留（用户习惯不变），但标注"这些参数来自入库编排模板"。
- 提供「查看入库流程」抽屉：只读展示该模板节点链路与本次覆盖项（高亮差异）。
- 高级用户可点「自定义编排」进入编辑器；创建后仍可随时调整并发布新版本。
- 旧知识库无绑定：进入编排页时引导"基于系统模板生成一份本知识库编排"，默认值与现状对齐。

---

## 11. 运行与监控

### 11.1 状态机

```
Run:    queued → running → succeeded
                     ├→ failed
                     ├→ canceled
                     └→ waiting_review → running / rejected
NodeRun: pending → running → succeeded
                     ├→ retrying → running
                     ├→ failed
                     ├→ skipped
                     └→ blocked(等待人工/等待上游)
```

兼容：现有 `pending/running/done/failed` 归一化逻辑保留（[knowledge-service.ts](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/knowledge-base/lib/knowledge-service.ts#L350-L382)），新增 `skipped / canceled / waiting_review`。

### 11.2 运行详情页

布局：左侧文件列表（按批次分组，显示状态与总耗时）；右侧所选文件的执行详情。

- **顶部**：文件名、`fileId`、`runId`、模板版本、总耗时、状态、操作（取消 / 从失败节点重跑 / 下载诊断包）。
- **节点时间线**：按拓扑顺序展示节点，含状态图标、耗时、attempt 次数徽标；失败节点展开错误码与可读原因；跳过节点显示跳过原因。
- **节点详情抽屉**：
  - 概览：状态、开始/结束时间、耗时、attempt、节点配置快照（只读）
  - 入参：上游 Artifact 引用 + 摘要（可展开）
  - 出参：产物预览（清洗文本前 2000 字、切片表、标签分布、向量统计、对账明细）
  - 日志：结构化日志 + `traceId` 跳转
  - 重试记录：每次 attempt 的错误与耗时
- **回放**：按 `fileId` 搜索到全部 Run（含历史版本），可对比两次运行的同节点产物差异（P1）。

### 11.3 重跑

- `从该节点重跑`：复用该节点之前所有成功节点的 Artifact（Checkpoint），生成新 `runId`，`parentRunId` 指向原 Run，便于追溯。
- `仅重跑失败切片`（P2）：向量入库/对账失败时按批次补齐。
- 重跑需二次确认，说明"将复用 N 个上游产物，不会重新解析"。

---

## 12. 失败处理与重试策略

| 场景 | 默认策略 | 兜底 |
| --- | --- | --- |
| 文件上传/MinIO 失败 | 重试 3 次，指数退避（1s/2s/4s） | 标记失败，可手动重跑接入节点 |
| MinerU 解析超时 | 重试 1 次，超时 10min | 可选转 OCR 分支；仍失败进人工工作台 |
| LLM 限流（标注/摘要） | 重试 3 次，退避 + 抖动 | 按节点兜底策略（空标签/默认标签/跳过） |
| Embedding 限流 | 重试 3 次，令牌桶限流 | 熔断并告警，保留已完成批次 |
| Milvus 超时/部分成功 | 重试 3 次 + 对账 | 对账不一致 → 异常分支，按 docId 清理后重跑入库 |
| 向量为空/全 0 | 重试 1 次 | 剔除该切片并计数，占比超阈值终止 |
| 敏感内容命中 | 不重试 | 直接失败分支 + 通知合规负责人 |
| 人工审核超时 | 不重试 | 按配置：自动驳回 / 自动通过 / 转交上级 |

通用要求：

- 重试必须**幂等**：节点须声明幂等性，非幂等节点（如主数据写入）重试前校验目标状态。
- 失败快照：失败时保存节点上下文快照（配置 + 入参引用 + 错误），供人工修正后重跑。
- 告警：连续 N 次失败 / 对账失败 / 合规拦截触发通知（站内 + 可配置 Webhook）。

---

## 13. 权限与多租户

| 权限码 | 说明 |
| --- | --- |
| `kb:pipeline:read` | 查看模板与编排 |
| `kb:pipeline:write` | 创建/编辑草稿、试运行 |
| `kb:pipeline:publish` | 发布、停用、回滚 |
| `kb:pipeline:run` | 触发重跑/取消运行 |
| `kb:review:handle` | 处理人工审核 |

- 所有模板、绑定、Run、Artifact 均带 `tenantId`，跨租户不可见（含日志与产物下载）。
- 系统模板 `scope=system`，仅平台管理员可维护，租户只能「派生副本」。
- 知识库编辑者默认拥有该知识库绑定参数的覆盖权，但结构变更需 `pipeline:write`。
- 审计日志不可删除，保留 ≥180 天；运行日志默认 30 天（可配）。

---

## 14. 数据模型（前端类型草案）

```ts
export type IngestNodeKind =
  | 'input.file' | 'guard.precheck'
  | 'parse.document' | 'parse.ocr' | 'clean.normalize' | 'guard.quality'
  | 'split.chunk' | 'split.dedupe'
  | 'enrich.entity' | 'enrich.summary' | 'enrich.keywords' | 'compliance.review'
  | 'embed.vector' | 'guard.vector' | 'store.vector' | 'guard.reconcile' | 'store.master'
  | 'flow.condition' | 'flow.human-review' | 'store.version' | 'flow.end'

export type NodeFailPolicy =
  | 'abort' | 'retry_then_abort' | 'skip' | 'exception_branch' | 'manual'

export type RetryPolicy = {
  maxAttempts: number      // 0-5
  intervalMs: number
  backoff: 'fixed' | 'exponential'
  timeoutMs: number
  idempotent: boolean
}

export type IngestNodeData = {
  kind: IngestNodeKind
  label: string
  description: string
  enabled: boolean
  config: Record<string, unknown>   // 由节点注册表的 configSchema 约束
  failPolicy: NodeFailPolicy
  retry: RetryPolicy
  advanced?: {
    concurrency?: number
    batchSize?: number
    logLevel?: 'error' | 'warn' | 'info' | 'debug'
    artifactRetention?: 'full' | 'meta_only'
  }
}

export type PipelineDsl = {
  schemaVersion: 1
  nodes: Array<{ id: string; type: 'ingest'; position: { x: number; y: number }; data: IngestNodeData }>
  edges: Array<{ id: string; source: string; target: string; label?: string; branch?: 'default' | 'error' | 'condition' }>
}

export type PipelineTemplate = {
  id: string
  tenantId: string
  name: string
  scope: 'system' | 'tenant'
  dataType: KnowledgeDataType
  status: 'draft' | 'published' | 'archived'
  latestVersion: number
  publishedVersion: number | null
  dsl: PipelineDsl
  createdAt: number
  updatedAt: number
}

export type KnowledgeBaseBinding = {
  kbId: string
  pipelineId: string
  templateVersion: number
  overrides: {
    chunkLength?: number
    preprocessRules?: string
    embeddingModel?: string
    enhancement?: boolean
  }
}

export type IngestRun = {
  id: string                 // runId
  batchId?: string
  kbId: string
  fileId: string
  fileName: string
  pipelineId: string
  templateVersion: number
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled' | 'waiting_review'
  currentNodeId: string | null
  progress: number
  startedAt: number
  endedAt: number | null
  parentRunId?: string
  nodeRuns: NodeRun[]
}

export type NodeRun = {
  nodeId: string
  kind: IngestNodeKind
  label: string
  status: 'pending' | 'running' | 'retrying' | 'succeeded' | 'failed' | 'skipped' | 'blocked'
  attempt: number
  durationMs: number | null
  inputArtifactId?: string
  outputArtifactId?: string
  error?: { code: string; message: string; traceId?: string }
  logsUrl?: string
}
```

兼容：后端 `/status/{task_id}` 映射为 `IngestRun` 的简化视图；`taskId` 与 `runId` 建立映射，保证旧入口可用。

---

## 15. 接口契约（建议）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/py-api/kb-pipelines?scope=&dataType=` | 模板列表 |
| POST | `/py-api/kb-pipelines` | 新建模板（可 `fromTemplateId` 派生） |
| GET | `/py-api/kb-pipelines/{id}` | 模板详情（含草稿 DSL） |
| PUT | `/py-api/kb-pipelines/{id}` | 保存草稿 |
| POST | `/py-api/kb-pipelines/{id}/validate` | 校验，返回问题列表（阻断/警告） |
| POST | `/py-api/kb-pipelines/{id}/publish` | 发布，入参 `{ note, version }` |
| GET | `/py-api/kb-pipelines/{id}/versions` / `/{version}` | 版本列表 / 快照 |
| POST | `/py-api/kb-pipelines/{id}/dry-run` | 试运行（`fileId`、`stopAtNodeId`、`writeVector=false`） |
| GET | `/py-api/knowledge-base/{kbId}/pipeline` | 绑定详情（模板 + overrides） |
| PUT | `/py-api/knowledge-base/{kbId}/pipeline` | 更新绑定/覆盖参数 |
| GET | `/py-api/ingest-runs?kbId=&fileId=&batchId=&status=` | 运行列表（分页） |
| GET | `/py-api/ingest-runs/{runId}` | 运行详情（含 nodeRuns） |
| GET | `/py-api/ingest-runs/{runId}/nodes/{nodeId}/artifacts` | 产物预览/下载 |
| GET | `/py-api/ingest-runs/{runId}/nodes/{nodeId}/logs` | 节点日志（分页） |
| POST | `/py-api/ingest-runs/{runId}/retry` | 重跑，入参 `{ fromNodeId, onlyFailedChunks? }` |
| POST | `/py-api/ingest-runs/{runId}/cancel` | 取消 |
| GET | `/py-api/ingest-runs/{runId}/diagnostics` | 下载诊断包（配置快照 + 日志 + 指标） |
| POST | `/py-api/kb-reviews/{reviewId}/approve` / `/reject` | 人工审核 |

改造点：

- `POST /py-api/knowledge-base` 入参新增 `pipelineId?`、`templateVersion?`、`overrides?`；旧字段（`segmentMode`/`segmentLength`/`preprocessRules`/`enhancement`/`embeddingModel`）保留，服务端折叠为 overrides，保证前端灰度期间兼容。
- `POST /py-api/import` 返回值增加 `runs: [{ runId, fileId, fileName }]`，同时保留 `task_id`。

---

## 16. 非功能性需求

| 维度 | 要求 |
| --- | --- |
| 规模 | 单文件 ≤15MB、单次 ≤50 文件（沿用现状）；单文档切片 1000+；单批次可并行 10 个 Run |
| 稳定性 | 节点失败可恢复；重试不产生重复向量（幂等 upsert by `docId+chunkHash`）；对账兜底 |
| 性能 | 编辑器 80 节点内拖拽/缩放流畅（≥45fps）；保存草稿 P95 < 500ms；运行详情首屏 < 1s |
| 实时性 | 运行详情轮询 2s（沿用），P1 支持 SSE 推送；单节点状态更新延迟 < 3s |
| 可观测 | 每节点强制记录耗时/入参摘要/出参摘要/异常/traceId/attempt；支持按 fileId 回放 |
| 安全 | 多租户隔离、产物下载鉴权、日志脱敏（手机号/身份证/密钥）、模板不允许脚本 |
| 兼容 | DSL 带 `schemaVersion`，新增节点类型向后兼容；旧知识库无绑定可自动派生模板 |
| 容量 | 运行日志 30 天、审计 180 天、产物按策略保留（默认 7 天，可配） |

---

## 17. 埋点与审计

- 页面埋点：编辑器打开、节点新增/删除、校验失败原因分布、发布、试运行、重跑点击、运行详情查看。
- 业务埋点：每节点耗时 P50/P95、失败率、平均 attempt、跳过率、对账不一致率、合规拦截数、人工审核时长。
- 审计事件：模板创建/编辑/发布/停用/回滚、绑定变更、试运行、重跑/取消、产物下载、审核操作，记录操作人、租户、IP、前后版本。

---

## 18. 验收标准

**编排编辑器**

1. 可拖拽/点击添加节点、连线、删除；无环校验能定位到具体节点。
2. 节点配置面板可按节点类型渲染参数，必填校验生效，未通过校验不可发布。
3. 保存草稿后刷新页面内容不丢失；发布生成 vN，历史版本只读且可查看。
4. 系统模板只读，租户可派生副本并发布。

**创建知识库联动**

5. 创建弹窗可查看本次入库流程（只读）；选择自定义分段后，对应切片节点参数在编排中体现为 override。
6. 不进入编辑器也能按 `dataType` 默认模板一键创建，行为与现状一致。
7. 旧接口字段仍可用，新旧字段同时存在时以 overrides 为准。

**运行与异常**

8. 运行详情按文件展示节点时间线，失败节点展示错误码与原因，跳过节点展示跳过原因。
9. 按 `fileId` 能检索到历史 Run，并能看到使用的模板版本。
10. 从失败节点重跑时复用上游产物（日志中可见"复用 checkpoint"），生成新 `runId` 且关联 `parentRunId`。
11. 向量空值、对账不一致能触发对应分支与告警，且不会把脏向量留在正式 collection。

**权限与多租户**

12. 无发布权限用户看不到发布按钮，接口返回 403。
13. 跨租户访问模板/Run/产物均被拒绝。

---

## 19. 分期范围

| 阶段 | 范围 |
| --- | --- |
| P0（可用） | 模板列表 + 编辑器（节点库/画布/配置/校验/保存/发布）+ 绑定关系 + 默认模板（标准/表格/多模态）+ 运行详情（节点时间线/错误/日志）+ 从失败节点重跑 + 幂等与对账节点 |
| P1（好用） | 试运行、版本对比与回滚、SSE 推送、按 fileId 回放与产物 diff、人工审核节点与审核台、敏感审核节点、模板派生 |
| P2（增强） | OCR 兜底、摘要/关键词、增量与版本回溯、仅失败切片重跑、自定义 HTTP 节点（评估后） |

---

## 20. 风险与开放问题

| # | 问题 | 影响 | 建议 |
| --- | --- | --- | --- |
| R1 | 后端现有流水线为硬编码，改造成 DSL 驱动工作量集中在服务端 | 排期风险 | 先做"只读渲染 + 参数覆盖"，再逐步把节点执行器注册化 |
| R2 | 产物存储成本（清洗文本/切片/向量快照） | 成本 | 默认只保留元数据 + 最近一次成功产物，失败产物保留 7 天 |
| R3 | 人工审核台归属（知识库 or 独立工作台） | 信息架构 | P1 先放知识库内，后续如有统一工作台再迁移 |
| R4 | 条件表达式语法与安全 | 稳定性 | 限定白名单函数与变量，服务端解析，禁止任意代码 |
| R5 | 旧知识库无绑定，默认参数可能与历史行为不一致 | 兼容 | 派生模板时按历史字段生成等价 overrides，并做灰度对比 |
| R6 | 多模态/表格入库的解析节点差异大 | 复杂度 | 模板按 `dataType` 分治，节点参数按类型暴露，不追求单模板通吃 |

待确认：

1. OSS 监听触发是否在 P0 落地，还是先只支持上传与批量 zip？
2. 是否允许租户自定义节点执行参数中的模型（Embedding/LLM）白名单？
3. 运行日志与产物保留期是否需要按套餐差异化？
4. 人工审核是否要求"先审后入库"强管控模板默认开启？

---

## 21. 附录：默认模板「标准文档入库」节点链路

```
input.file
  → guard.precheck
  → parse.document
  → clean.normalize
  → guard.quality ──(质量不达标)──→ flow.end(fail)
  → split.chunk
  → split.dedupe
  → enrich.entity ──(失败)──→ 兜底标签 ──→ 继续
  → embed.vector
  → guard.vector
  → store.vector
  → guard.reconcile ──(不一致)──→ 异常分支：告警 + 重跑 store.vector
  → store.master
  → flow.end(success)
```

模板参数默认值（与现有创建弹窗对齐）：

| 参数 | 默认值 |
| --- | --- |
| 格式白名单 | 非结构化：PDF/TXT/DOC/DOCX/MARKDOWN/OFD/WPS/WPT |
| 单文件大小 | 15MB |
| 批量上限 | 50 |
| 切片长度 | 500（自定义范围 100–2000） |
| 切片重叠 | 50 |
| 去重阈值 | 0.95（SimHash） |
| Embedding | qwen3-embedding |
| 知识增强 | 关闭（开启则插入 `enrich.entity`） |
| 质量初检 | 有效文本占比 ≥ 10% |
| 对账容忍误差 | 0 |
