# 创建知识库编排PRD

> **Workspace:** /Users/wangzijie/Documents/wx/wisecloud-admin

---

**User**

我现在要新建一个编排 查看一下创建知识库 中给的信息 写一个 编排的PRD 里 我给个例子参考

### 1. 文件接收 & 入队（异步队列）

> 
> 你原来没有队列，大文件、批量导入很容易崩

- 支持单文件上传、批量 zip 导入、OSS 监听触发导入
- 生成全局唯一 `fileId / docId`，**幂等键（文件 md5 指纹）**：同一个文件重复提交不会重复入库，避免向量库脏数据
- 绑定 `租户ID、知识库ID、上传人`（多租户必加）
- 状态机：等待解析 → 解析中 → 切分中 → 向量中 → 入库中 → 成功 / 失败

### 2. 前置校验节点（编排第一个强校验节点）

- 文件格式白名单：只允许 pdf /md；拦截 exe、压缩包、非法后缀
- 文件大小上限、病毒 / 恶意文件预扫（可选）
- 文件 md5 指纹计算
- 权限校验：当前用户是否有权限导入到这个知识库
- 文档是否已经存在（幂等判断）：存在可以策略选择【覆盖 / 跳过 / 拒绝】

### 3. 文档清洗 & 过滤节点（非常关键，MinerU 输出很脏）

MinerU 输出不是完美的，经常有：多余换行、OCR 识别噪声、页眉页脚反复出现、乱码、分隔符垃圾文本

- 规则清洗：剔除页码、页眉、页脚、广告文字
- 文本归一化：全角半角、特殊不可见字符清理
- 表格规整：MinerU 输出的 markdown 表格经常断行，修复表格格式
- 过滤：纯空白切片、只有符号无有效内容的切片直接丢弃，不进入后续 LLM 打标 + 向量（省成本）

### 4. 文档质量初检

统计有效文本占比；如果解析后几乎是空文档、乱码占比过高，直接终止流程，不浪费 LLM 和向量资源。

### 5. 切片去重节点

同一篇文档里经常有重复的说明段落、重复参数。

> 
> 不是全局知识库去重，是**同一份文档内部切片去重**；
> 可选：SimHash / 简单相似度阈值，合并高度重复切片，减少冗余向量，提升检索质量、降低存储成本。

### 6. 实体标注增强（商品识别）

你现在是纯 LLM 识别，生产一般会做混合：

1. 优先走本地商品白名单字典匹配（快、稳定、省钱）
2. 字典匹配不到再丢 LLM 识别
3. 输出标签支持多标签，标签写入元数据，后面检索时可以做**标签过滤检索（过滤指定设备 / 商品）**
4. 增加兜底策略：识别失败时，可配置【保留空标签】或者【打默认标签】，而不是整个流程失败

### 7. 向量校验节点

BGE-M3 偶尔会输出全 0 向量、向量为空；入库前拦截，而不是脏数据进 Milvus，检索时出诡异问题。

### 8. 入库后置校验（对账）

写入 Milvus 之后，根据 docId 反查，对比：本地切片总数 VS Milvus 里面该文档下的向量数量。

> 
> 很多时候网络抖动、Milvus 超时，返回成功但部分切片丢了，这一步就是对账。
> 对账失败 → 进入异常分支，告警、支持重试。

### 9. 知识库主数据更新 + 缓存更新

向量库只管向量；业务库要有文档主表：文档名称、上传时间、状态、标签、总切片数。
Redis 缓存：知识库文档列表、文档统计，避免每次都查 Milvus。

### 10. 审计、埋点、链路日志（编排的核心价值）

每个节点输出：耗时、入参、出参、异常信息；
支持：按 fileId 回放整条导入流程，看卡在哪个环节。

### 11. 失败分支 + 重试策略（编排最强能力）

每个节点可以单独配置：

- 重试次数、重试间隔（比如 MinIO 上传失败、Milvus 超时、LLM 调用限流）
- 重试耗尽之后，走失败分支：保存快照、告警、人工工作台，人工修正文档后**从任意节点重新启动流程**（比如图片上传失败，不用重新跑 MinerU 解析）

> 
> 这个就是硬编码很难做、编排天然擅长的。

### 12. 可选扩展节点（按需加到编排面板）

- 【OCR 兜底节点】MinerU 识别扫描版 PDF 效果差，可分支调用 OCR
- 【摘要生成节点】给整篇文档生成摘要，存入元数据，用于知识库列表展示
- 【关键词提取节点】
- 【敏感内容审核节点】切片级内容安全审核，违规文档拦截不入向量库（合规刚需）
- 【增量更新 / 版本节点】文档更新时，旧版本切片软删除，新版本入库，支持文档版本回溯
- 【人工审核节点（Human in loop）】解析 / 打标完成后，先到人工审核台，审核通过才向量化入库（强管控场景，比如内部涉密资料）

**Assistant**

PRD 已经写好：[知识库入库编排 PRD](computer:///Users/wangzijie/Documents/wx/wisecloud-admin/.trae/documents/knowledge-base-ingestion-orchestration-prd.md)

核心结论：

- **定位**：这项编排只负责知识库的文档入库流水线，不用于通用的 DAG 调度；执行由后端负责，前端只负责定义和观测。
- **单一事实来源**：我查看了[创建知识库弹窗](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/knowledge-base/components/create-knowledge-base-dialog.tsx#L60-L77)，其中分段长度、预处理规则、Embedding 模型、知识增强等参数全部归入编排 DSL 的参数中。知识库表只保存 `pipelineId + version + overrides`，避免表单字段和编排两处各存一份配置。
- **复用现有能力**：画布交互、节点库和配置面板沿用 [Agent 编排](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/agent/flow/index.tsx)，但节点体系独立（`input.file`、`guard.precheck`、`parse.document`、`clean.normalize`、`split.chunk`、`embed.vector`、`store.vector`、`guard.reconcile` 等）。审计埋点不设为可拖拽节点，而作为平台内置能力，防止被误删。
- **你给的 12 条全部转化为节点**：包含入队与幂等、前置校验、清洗、质量初检、文档内去重、字典+LLM 混合标注、向量校验、入库对账、主数据与 Redis、节点级重试、从任意节点重跑，以及 OCR/摘要/关键词/敏感审核/版本/人工审核扩展节点。
- **关键机制**：版本不可变，运行会锁定启动时的版本；从失败节点重跑时复用上游产物（`parentRunId` 追溯）；支持按 fileId 回放；兼容现有 `/status/{task_id}` 与旧入参字段。
- **分期**：P0 为可用，包含编辑器、绑定、默认模板、运行详情和从失败节点重跑；P1 包含试运行、版本对比、人工审核和敏感审核；P2 包含 OCR 兜底、增量版本和 HTTP 节点。

文末列了 4 个待确认项：OSS 监听是否进 P0、模型白名单、日志保留期套餐化、人工审核是否默认强管控。需要我先按 P0 把前端页面骨架和节点注册表落成代码吗？

---

**User**

产考这个 修改一下编排页面 满足这个要求 后面还有其他的prd 也要满足 可以改吗

**Assistant**

可以改。不过改造方式有两种，对现有功能的影响差别很大，需要先确认一下。

目前尚未写入代码。我会先确认现有实现细节，再开始搭建通用编排层。

---

**User**


/compact 

**User**

继续

**Assistant**

Error: SSE finish

---

**User**


/compact 

**User**

继续

**User**

继续

**Assistant**

现在开始构建代码。先创建通用编排框架层。

P0 已经全部实现，`npm run build` 通过、诊断为空。

**通用编排框架**（`src/features/flow/`，不含业务代码，后续 PRD 可直接复用）
- [types.ts](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/flow/types.ts)：`FlowRegistry`、`FlowDsl`、`ConfigFieldSchema`
- [flow-canvas.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/flow/flow-canvas.tsx)：画布，以及节点库、配置面板和工具栏
- [node-palette.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/flow/node-palette.tsx)、[flow-node.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/flow/flow-node.tsx)、[node-inspector.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/flow/node-inspector.tsx)

**入库编排（PRD 落地）**
- [ingest-node-registry.ts](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/knowledge-base/pipeline/data/ingest-node-registry.ts)：包含 21 种节点、6 个分组和 schema 驱动的配置字段
- [pipeline-service.ts](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/knowledge-base/pipeline/lib/pipeline-service.ts)：使用 localStorage 存储，并提供三个数据类型对应的默认链路
- [validate-pipeline.ts](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/knowledge-base/pipeline/lib/validate-pipeline.ts)：实现 PRD 8.4 的 9 条规则（6 条阻断、3 条警告）
- [pipeline/index.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/knowledge-base/pipeline/index.tsx) 提供模板列表，[editor.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/knowledge-base/pipeline/editor.tsx) 提供编辑器，包括失败处理与重试的配置区块和发布按钮
- 入口：[knowledge-base/index.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/knowledge-base/index.tsx) 增加「知识库」和「编排模板」两个 Tab，卡片新增「入库编排」按钮

后续如果还有三个 PRD 要接入，也只需要新增三样东西：注册表、默认模板和校验函数，然后套用 `<FlowCanvas />`，不需要改动通用编排框架。

下一步，你想先处理哪项？

现在编写发布逻辑和工具栏按钮。

本地服务已启动：http://localhost:9101/（9100 被占用，Vite 自动用了 9101）。

走查前先做了一遍代码级核对，发现并修掉两个问题：

**1. 发布没有拦截校验（PRD 8.4「发布前强校验」、8.5「未通过校验不可发布」）**
原来「发布」按钮在 [editor.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/knowledge-base/pipeline/editor.tsx) 里直接调接口，绕过校验。现在把发布收进通用画布：新增 `onPublish` 属性，[flow-canvas.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/flow/flow-canvas.tsx#L356-L378) 里点击先跑 `validate`，有阻断项就弹校验详情并 toast 拒绝；有未保存改动也拒绝并提示先保存。后续其他 PRD 的编排页接 `onPublish` 即自动获得同一套门禁。

**2. 节点「+」菜单能挂入口节点**
[flow-node.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/flow/flow-node.tsx#L42-L46) 的下游节点列表原来包含「文件接收」这类不能接收连线的节点，选了下游会得到一个连不上的孤立节点。现在按注册表 `canReceive === false` 过滤。

`npm run build` 通过，`npm run lint` 仍是 11 项（1 个既有的 sign-in error + 10 个 fast-refresh warning，均与本次无关），诊断为空。

请在浏览器里按这条路径点一遍，我根据结果继续修：
1. 知识库页 →「编排模板」Tab，应看到 3 个系统模板
2. 新建编排（任选数据类型）→ 自动进画布，默认链路已生成
3. 拖节点、连一条线、改一个参数 → 点「校验」→ 点「保存」
4. 改完不保存直接点「发布」→ 应提示先保存；保存后发布 → 版本号 +1
5. 刷新页面 → 改动仍在；返回列表看「最近更新/状态」

还有三处 PRD 要求但目前没做，走查完你定优先级：
- **系统模板只读**（PRD 8.3/10.2）：现在点进系统模板能直接改并保存，需要加只读态 + 「派生副本」
- **版本下拉**（PRD 8.1）：只能看 `vN`，看不到历史版本
- **试运行 dry run**（PRD 8.1）

---

**User**

报错export function useFlowRegistry() {
  const context = useContext(FlowRegistryContext)
  if (!context) throw new Error('useFlowRegistry 必须在 FlowRegistryProvider 内使用')
  return context
}

**Assistant**

`NodePalette` 在 Provider 外层读取了 context，所以一进编辑器就抛这个错。改为显式传入注册表。

这个报错的根因是 `NodePalette` 在 `FlowRegistryProvider` **外面**调用了 `useFlowRegistry()`：画布的 Provider 只包住了 ReactFlow 区域，而节点库是它的兄弟节点，所以一进编辑器就会抛出这个错误。

已修复：
- [node-palette.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/flow/node-palette.tsx#L9-L17)：把注册表改成显式传入的 `registry` 属性，不再依赖 context
- [flow-canvas.tsx](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/flow/flow-canvas.tsx#L474)：传入 `runtime`

`npm run build` 通过，诊断为空。dev 仍在 http://localhost:9101/ 运行，Vite 已热更新，直接刷新编辑器页面再点一次「编排模板 → 新建编排」即可。

如果还有其它报错，把错误信息或截图发我。

---

**User**


/compact 

**User**

- 系统模板只读 （PRD 8.3/10.2）：现在点进系统模板能直接改并保存，需要加只读态 + 「派生副本」
- 版本下拉 （PRD 8.1）：只能看`vN` ，看不到历史版本
- 试运行 dry run （PRD 8.1）

**User**

如果现在后端要写节点nodes  怎么写 之前是entry_node.py  pdf_to_md_node.py          # PDF转Markdown md_img_node.py             # 图片提取 document_spliter_node.py   # 文档分块 item_name_recognition_node.py  # 商品名识别 embedding_chunks_node.py   # 向量化 milvus_import_node.py      # Milvus导入 这7个节点 如果按照标准文档入库 它的节点 怎么设计节点

**Assistant**

Error: WebSocket error: Network IO error: error sending request for url (https://api.deepseek.com/chat/completions) (HTTP Status: 500)

---

**User**

继续

**Assistant**

后端没有 Python 代码在本仓库，我按前端已落地的注册表（[ingest-node-registry.ts](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/knowledge-base/pipeline/data/ingest-node-registry.ts)）和 DSL 结构（[types.ts](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/flow/types.ts)）给你一套后端节点设计。**核心原则：节点 `kind` 是前后端唯一契约，后端注册表的 key 必须和前端完全一致，否则画布保存的编排执行不了。**

## 一、旧 7 个节点 → 标准节点怎么落

| 旧文件 | 落到哪个 kind | 说明 |
|---|---|---|
| `entry_node.py` | `input.file` + `guard.precheck` | entry 原本只是入口壳，标准链路把「格式白名单/大小上限/批量入队」归 `input.file`，「文件头校验/重复文件」拆到 `guard.precheck` |
| `pdf_to_md_node.py` | `parse.document` | 不要按文件格式造节点，改为**一个节点 + 多 handler**，`engine` 配置决定走 pdf/docx/txt 分支 |
| `md_img_node.py` | 不新增 kind | 图片提取是 `parse.document` 的**产物**（`assets` artifact）；需要识别图片文字时接 `parse.ocr` |
| `document_spliter_node.py` | `split.chunk` | 保留 `chunkLength/overlap/strategy` |
| `item_name_recognition_node.py` | `enrich.entity` | 业务特化用 `config.profile = 'item_name'` 区分，不新造 kind；真要独立再同步前端注册表 |
| `embedding_chunks_node.py` | `embed.vector` + `guard.vector` | 生成向量与「维度/空向量校验」分离，校验可关 |
| `milvus_import_node.py` | `store.vector` + `guard.reconcile` | Milvus 是 `store.vector` 的一个 adapter；写入条数对账独立成节点 |

标准「文档入库」链路（对齐 PRD 21 章与前端默认模板）**净增 4 个节点**：`clean.normalize`（清洗归一）、`guard.quality`（质量初检）、`split.dedupe`（切片去重）、`store.master`（主数据/缓存）。所以是 7 → 11 个实现，其余 10 种 kind 先留空桩。

## 二、后端节点契约（这三件套定死，后面所有节点都一样）

关键设计：**节点之间不传正文和向量，只传 Artifact 句柄**，这样重试、断点续跑、dry run、产物清理都能统一做。

```python
# app/nodes/base.py
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Literal

@dataclass(frozen=True)
class ArtifactRef:
    id: str
    kind: Literal["file", "markdown", "text", "chunks", "vectors", "assets", "report"]
    uri: str              # s3://bucket/key
    checksum: str
    size: int
    meta: dict[str, Any] = field(default_factory=dict)  # ext / pageCount / chunkCount ...

@dataclass
class NodeContext:
    run_id: str
    node_id: str
    kb_id: str
    pipeline_version: int
    config: dict[str, Any]        # 已合并节点默认值
    inputs: list[ArtifactRef]
    attempt: int = 1
    dry_run: bool = False
    trace_id: str = ""
    storage: Any = None           # 对象存储
    milvus: Any = None
    llm: Any = None

@dataclass
class NodeResult:
    status: Literal["succeeded", "failed", "skipped"] = "succeeded"
    outputs: list[ArtifactRef] = field(default_factory=list)
    metrics: dict[str, float] = field(default_factory=dict)  # qualityRatio / chunkCount，供条件分支
    branch: str | None = None     # flow.condition 的出边 handle
    message: str = ""
    error: dict[str, str] | None = None   # {code, message}

class BaseNode(ABC):
    kind: str                     # 必须等于前端 IngestNodeKind
    idempotent: bool = True       # False 时执行器禁止自动重试
    side_effect: bool = False     # True 时 dry_run 跳过或 mock
    defaults: dict[str, Any] = {}

    def resolve_config(self, raw: dict[str, Any]) -> dict[str, Any]:
        return {**self.defaults, **(raw or {})}

    @abstractmethod
    def run(self, ctx: NodeContext) -> NodeResult: ...
```

```python
# app/nodes/registry.py
_REGISTRY: dict[str, BaseNode] = {}

def register(cls):
    _REGISTRY[cls.kind] = cls()
    return cls

def get_node(kind: str) -> BaseNode:
    if kind not in _REGISTRY:
        raise KeyError(f"未知节点类型: {kind}")
    return _REGISTRY[kind]
```

## 三、目录结构

```
app/nodes/
  base.py            # ArtifactRef / NodeContext / NodeResult / BaseNode
  registry.py        # @register + get_node
  io/                input_file.py      guard_precheck.py
  parse/             parse_document.py  parse_ocr.py   handlers/{pdf,docx,txt}.py
  process/           clean_normalize.py guard_quality.py split_chunk.py split_dedupe.py
  enrich/            enrich_entity.py   enrich_summary.py enrich_keywords.py
  store/             embed_vector.py    guard_vector.py  store_vector.py
                     guard_reconcile.py store_master.py  adapters/milvus.py
  control/           flow_condition.py  flow_human_review.py store_version.py flow_end.py
app/engine/
  executor.py        # 图遍历 / 并发 / 重试 / 断点
  state.py           # node_run 落库 + 事件推送
```

## 四、典型节点实现（`parse.document` 吸收旧 pdf_to_md / md_img）

```python
@register
class ParseDocumentNode(BaseNode):
    kind = "parse.document"
    idempotent = True
    side_effect = False
    defaults = {
        "engine": "auto",              # auto | pdfbox | tika
        "keepHeaderFooter": False,
        "tableRecognition": True,
        "extractImages": True,         # 旧 md_img_node 的开关
    }

    def run(self, ctx: NodeContext) -> NodeResult:
        src = ctx.inputs[0]
        handler = pick_handler(src.meta["ext"], ctx.config["engine"])
        md_text, assets, metrics = handler(src, ctx)      # pdf -> md；docx/pdfbox -> md；txt 直通

        md = ctx.storage.put_text(f"{ctx.run_id}/{ctx.node_id}/doc.md", md_text)
        asset_refs = [ctx.storage.put_binary(a.name, a.data) for a in assets]
        return NodeResult(
            outputs=[md, *asset_refs],
            metrics={"charCount": len(md_text), **metrics},
        )
```

`split.chunk` 无非就是读 `md` 产物、按 `strategy` 切片、写 `chunks.jsonl`，`metrics={"chunkCount": n}`；`embed.vector` 读 chunks、写向量 parquet 产物；`store.vector` 是唯一 `side_effect=True` 的节点，通过 `adapters/milvus.py` 写库，返回 `metrics={"written": n}` 供 `guard.reconcile` 比对。

## 五、后端要吃的 DSL（字段和前端一一对应）

```json
{
  "nodes": [
    {
      "id": "n_parse", "type": "flow",
      "position": { "x": 320, "y": 160 },
      "data": {
        "kind": "parse.document",
        "label": "文档解析",
        "description": "解析文档正文、表格与层级结构",
        "enabled": true,
        "config": { "engine": "auto", "keepHeaderFooter": false, "tableRecognition": true },
        "failPolicy": "abort",
        "retry": { "maxAttempts": 2, "intervalMs": 3000, "backoff": "fixed", "timeoutMs": 0, "idempotent": true }
      }
    }
  ],
  "edges": [{ "id": "e1", "source": "n_input", "target": "n_parse", "sourceHandle": null }]
}
```

后端注意三点：`data.enabled === false` 的节点要**跳过但保留在链路里**（知识增强默认关闭）；`failPolicy`/`retry` 属于执行器策略，不进节点代码；节点不认识 `config` 里多出来的键要**忽略而不是报错**（版本兼容）。

## 六、执行器必须具备的 6 件事

1. **入口识别**：`input.file` 是唯一入口（`canReceive=false`），`flow.end` 是终点。
2. **分支**：`flow.condition` 用 `edge.sourceHandle`（`true`/`false`）+ `defaultBranch` 选下一跳。
3. **幂等复用**：幂等键 = `run_id + node_id + input_checksum`；`node_run` 已 `succeeded` 且产物存在则直接复用，实现断点续跑。`idempotent=false` 的节点拒绝自动重试。
4. **重试**：按 `retry.maxAttempts/backoff/timeoutMs` 包一层，`retry_then_abort` 耗尽后走失败策略。
5. **状态上报**：`node_run` 落库字段要能直接喂前端 `NodeRun`（`status/attempt/durationMs/outputArtifactId/error.code`），并通过 SSE 推进度。
6. **dry run**：`dry_run=True` 时只跑 `side_effect=False` 的节点，`store.*` 返回 `metrics` 里的预估条数、不真写；前端「试运行」直接调这个模式。

## 七、落地顺序建议

先实现 6 个就能覆盖你现有 7 个脚本的能力：`input.file` → `parse.document` → `split.chunk` → `embed.vector` → `store.vector` → `flow.end`，跑通「DSL 存库 → 执行 → 状态回传」闭环；再补 `guard.precheck / clean.normalize / guard.quality / guard.reconcile / store.master`；控制类和增强类最后做。

需要我把这套骨架（`base.py` + `registry.py` + 6 个节点 + `executor.py`）直接写成可运行代码吗？需要你给一下后端仓路径和框架（FastAPI 是否已有 Celery/RQ 队列）。

---

**User**

现在有一个疑问 前端编排的节点 是动态的 后端拿到这些节点 怎么动态匹配这些节点 

**Assistant**

一句话结论：**动态的是「图结构」，不是节点实现**。节点实现永远是后端启动时注册好的一张静态表，`kind` 是这张表的主键；后端拿着 DSL 里的 `kind` 去查表，查得到就执行，查不到是**编排发布期的错误**，不该拖到运行期。

## 一、动态匹配的三个环节

| 环节 | 时机 | 做什么 |
|---|---|---|
| 发现 | 后端启动 | 扫描 `app/nodes/**` 自动 import，装饰器把 `kind → 实例` 注册进表 |
| 校验 | 发布编排时 | DSL 里每个 `kind` 必须在表里，且 `config` 能被该节点的 schema 校验通过；不通过拒绝发布 |
| 执行 | 运行入库时 | `get_node(data.kind)` 取实例，把 `data.config` 合并默认值后塞进 `NodeContext` |

这样「前端加了新节点」在后端表现为一次**发布校验失败**，而不是跑起来了才 500。

## 二、节点自动发现（不用手写 import 清单）

```python
# app/nodes/discovery.py
import importlib
import pkgutil
from app.nodes import registry

def load_all(package: str = "app.nodes") -> None:
    """扫描 app/nodes 下所有模块，触发 @register 注册。进程启动时调一次。"""
    pkg = importlib.import_module(package)
    for mod in pkgutil.walk_packages(pkg.__path__, prefix=f"{package}."):
        if ".handlers" in mod.name or ".adapters" in mod.name:
            continue          # 纯工具模块，不注册节点
        importlib.import_module(mod.name)
```

节点侧只写一个装饰器，新增节点等于新增文件，不用改任何中心配置：

```python
@register
class SplitChunkNode(BaseNode):
    kind = "split.chunk"          # 必须与前端 IngestNodeKind 完全一致
    label = "切片"
    group = "处理"
    defaults = {"chunkLength": 500, "overlap": 50, "strategy": "recursive"}

    CONFIG_SCHEMA = {
        "chunkLength": {"type": "number", "min": 100, "max": 2000, "required": True},
        "overlap":     {"type": "number", "min": 0, "max": 500},
        "strategy":    {"type": "select", "options": ["recursive", "fixed", "semantic"]},
    }

    def run(self, ctx: NodeContext) -> NodeResult: ...
```

`CONFIG_SCHEMA` 是后端版的 `configSchema`，不是给前端用的表单，而是**后端自己的入参校验与文档来源**。

## 三、发布期校验（关键的一道闸）

```python
# app/engine/validate.py
def validate_dsl(dsl: dict) -> list[dict]:
    errors = []
    known = registry.known_kinds()

    for node in dsl["nodes"]:
        data = node["data"]
        if data.get("enabled") is False:
            continue                      # 停用节点允许保留未知类型（灰度/降级）
        kind = data["kind"]
        if kind not in known:
            errors.append({"level": "error", "node": node["id"],
                           "message": f"后端不支持的节点类型: {kind}"})
            continue
        impl = registry.get_node(kind)
        errors += impl.validate_config(data.get("config") or {})
    return errors
```

前端已经有一层同名校验（[validate-pipeline.ts](file:///Users/wangzijie/Documents/wx/wisecloud-admin/src/features/knowledge-base/pipeline/lib/validate-pipeline.ts)），后端这层**不能省**：前端只保证「kind 拼写对、必填有值」，后端要保证「这个 kind 在当前部署版本里真的实现了」。

## 四、执行期怎么取节点

```python
# app/engine/executor.py（核心十几行）
def run_node(run, node, ctx_inputs):
    data = node["data"]
    try:
        impl = registry.get_node(data["kind"])
    except KeyError:
        # 只在「编排发布后被下线节点」时可能出现，按 failPolicy 走
        return handle_unknown_kind(run, node)

    cfg = impl.resolve_config(data.get("config") or {})   # 默认值由节点侧兜
    ctx = NodeContext(run_id=run.id, node_id=node["id"], config=cfg,
                      inputs=ctx_inputs, dry_run=run.dry_run,
                      storage=run.storage, milvus=run.milvus)
    return with_retry(impl, ctx, data.get("retry") or {}, data.get("failPolicy", "abort"))
```

图结构完全由 DSL 的 `edges` 驱动，跟节点的具体类型无关——这就是「动态」的落点：**遍历是数据驱动，节点调用是查表**。

## 五、查不到 kind 时怎么办

| 场景 | 建议处理 |
|---|---|
| 发布时 `enabled=true` 的未知 kind | 直接拒绝发布，返回具体 nodeId + kind |
| 发布时 `enabled=false` 的未知 kind | 警告放行（模板可能来自更高版本） |
| 运行时节点被下线（已发布的旧编排） | 按该节点 `failPolicy`：`skip` 跳过并告警 / `abort` 中止本文件 |
| 历史 DSL 的旧命名 | 维护别名表 `KIND_ALIAS = {"pdf.to_md": "parse.document"}`，在 `get_node` 入口归一 |

## 六、前后端两套定义的收敛（重要）

现在前端注册表是**硬编码** 21 种 kind，后端再写一份，就存在漂移风险。推荐加一个能力清单接口：

```
GET /api/ingest/node-kinds
→ [{ kind, label, group, canReceive, canEmit, defaults, configSchema }]
```

后端直接由注册表序列化产出（`configSchema` 用跟你前端 `ConfigFieldSchema` 同构的字段：`key/label/type/options/min/max/unit`）。前端节点库改为「接口优先、本地注册表兜底」，这样后端加节点前端自动出现，也不用手改两处。这一步属于后续优化，不阻塞当前闭环。

## 七、版本兼容（避免一改参数就打挂历史编排）

节点 `kind` 保持不变的前提下，参数演进用「节点内迁移」而不是新 kind：

```python
class SplitChunkNode(BaseNode):
    CONFIG_VERSION = 2

    def migrate(self, config: dict) -> dict:
        if "chunkSize" in config:                      # v1 旧键 → v2 新键
            config.setdefault("chunkLength", config.pop("chunkSize"))
        return config
```

执行时先 `migrate` 再 `resolve_config`；编排发布时快照整份 DSL（前端 `latestVersion/publishedVersion` 已有），所以「老版本编排 + 新版本后端」也能跑。

**一句话总结**：`kind` 是契约，注册表是主键索引，发布期校验拦住不匹配，执行期只做查表调用；图怎么连是 DSL 的事，跟节点实现无关。

---

