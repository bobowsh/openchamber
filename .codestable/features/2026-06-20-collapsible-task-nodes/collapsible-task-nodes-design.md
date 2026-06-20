---
doc_type: feature-design
feature: 2026-06-20-collapsible-task-nodes
status: approved
summary: 子代理（task 工具）调用节点与普通工具调用一样支持折叠/展开，减少对话中的信息噪音
tags: [ui, chat, task, subagent, collapsible]
---

## 0. 术语约定

| 术语 | 定义 | 防冲突结论 |
|---|---|---|
| 子代理任务节点 | tool type 为 `task` 的 tool part，渲染子代理（subagent）的执行摘要 | 代码中为 `normalizedPartTool === 'task'`，无冲突 |
| tool 折叠/展开 | 点击 tool 标题行箭头切换内容区的显示/隐藏 | 现有模式：`isExpanded` state + `height: 0/auto` 动画 |

## 1. 决策与约束

### 需求摘要

**做什么**：子代理（task 工具）的任务节点内容区，和普通工具（bash/edit/read 等）一样支持整体折叠/展开。折叠时只显示标题行（工具名 + 状态 + 箭头图标），展开时显示工具条目列表和 output。

**为谁**：使用对话式 AI 并频繁触发子代理调用的用户。目前每个子代理的完整内容（工具调用列表 + output）始终展开，多个子代理并发时对话空间被大量占用。

**成功标准**：
- task 工具标题行显示折叠箭头，交互行为与普通工具完全一致（点击箭头/标题切换展开/折叠）
- 折叠时内容区隐藏，展开时内容区显示 + 延迟渲染
- 默认展开行为受全局偏好控制（与普通工具同一套 collapsedTools/expandedTools 机制）

**明确不做**：
- 不改变 `TaskToolSummary` 内部条目的折叠逻辑（已有 6 条截断和独立 output 折叠）
- 不改变子 session 的数据拉取/轮询机制
- 不改变消息结构或 API 契约

### 复杂度档位

走"单层 UI 组件交互增强"默认档位，无偏离。

### 关键决策

| 决策 | 选择 | 原因 |
|---|---|---|
| 复用现有折叠机制 | 同一套 `isExpanded` + 动画 + `expandedContentRef` | 用户期望行为一致；已有延迟渲染、缓存、两集合互斥等成熟方案 |
| `TaskToolSummary` 移入折叠容器 | 包裹到 `expandedContentRef` 的 div 内，与普通工具共用折叠容器 | 消除 `!isTaskTool` 特判分支，让 task 走和普通工具同一渲染路径 |

### 前置依赖

无。

## 2. 名词与编排

### 2.1 名词层

#### 现状

- `ToolPart.tsx:2650-2849` — `ToolPart` 组件的渲染结构
  - 标题行（`div.group/tool`）：工具名 + 状态 + 箭头图标（2682-2802）
  - 普通工具内容区（2820-2849）：包裹在 `expandedContentRef` 的 div 中，受 `isExpanded` 控制折叠/展开动画
  - task 工具内容区（2806-2818）：直接渲染 `TaskToolSummary`，**不在**折叠容器内
- `ToolPart.tsx:2002-2004` — `useLayoutEffect` 中的 `useTaskTool` 特判跳过
- `ToolPart.tsx:2672-2673` — 延迟渲染控制：
  ```typescript
  const shouldRenderTaskSummary = useDeferredExpandedContent(isTaskTool && (条件));
  const shouldRenderExpandedContent = useDeferredExpandedContent(!isTaskTool && isExpanded);
  ```
- `ToolPart.tsx:1219-1389` — `TaskToolSummary` 组件定义

#### 变化

- 移除 `ToolPartContent` 中 `isTaskTool` 的特判，使 task 工具走与普通工具相同的折叠渲染路径
  - 动作：`!isTaskTool` 守卫（line 2820）改为无条件渲染折叠容器
  - 动作：`expandedContentRef` 的 `useLayoutEffect` 中的 `isTaskTool` 特判移除
  - 动作：`shouldRenderTaskSummary` 改为同时依赖 `isExpanded`
  - 动作：`shouldRenderExpandedContent` 改为也覆盖 task 工具

### 2.2 编排层

#### 主流程图

```mermaid
flowchart TD
    A[用户点击 task 标题行/箭头] --> B{isExpanded?}
    B -->|false → true| C[调用 onToggle(part.id)]
    B -->|true → false| C
    C --> D{isTaskTool?}
    D -->|当前: Yes| E[isExpanded 仅控制条目截断<br/>TaskToolSummary 始终可见]
    D -->|当前: No| F[expandedContentRef div<br/>height: 0/auto 动画<br/>useDeferredExpandedContent 延迟渲染]
    D -->|目标: 统一| F
```

#### 现状

ToolPart 当前的渲染拓扑：

```
ToolPart（标题行 + 箭头 + 点击处理）
├── 始终渲染
│   └── TaskToolSummary（isExpanded 仅控制条目截断 6 条）
└── isExpanded 控制
    └── expandedContentRef div（普通工具内容区）
```

普通工具：`isExpanded = false` → 内容区 `height: 0`，折叠
task 工具：`isExpanded` 不影响内容区可见性，`TaskToolSummary` 始终渲染

#### 变化

统一后的渲染拓扑：

```
ToolPart（标题行 + 箭头 + 点击处理）
└── isExpanded 控制（无 isTaskTool 特判）
    └── expandedContentRef div
        ├── isTaskTool ? TaskToolSummary : null
        └── !isTaskTool ? ToolExpandedContent : null
```

task 工具折叠行为与普通工具一致：`isExpanded = false` → `TaskToolSummary` 不渲染，折叠；`isExpanded = true` → 延迟渲染 `TaskToolSummary`。

#### 流程级约束

- **延迟渲染一致性**：普通工具用 `useDeferredExpandedContent` 延迟渲染，task 工具也走同一路径
- **默认展开行为一致性**：task 工具的默认展开/折叠状态由 `expandedTools` / `collapsedTools` 两集合机制决定（与普通工具共享）
- **动画一致性**：task 工具折叠时 `height: 0` + `overflow: hidden` 与普通工具一致
- **布局回调一致性**：`useLayoutEffect` 中 `onContentChangeRef.current?.('structural')` 的触发逻辑对 task 工具也应生效

### 2.3 挂载点清单

| 挂载位置 | 文件 | 动作 |
|---|---|---|
| ToolPart 渲染分支守卫 | `ToolPart.tsx:2820` `{!isTaskTool ? ...}` | 修改 — 移除守卫，统一渲染路径 |
| 延迟渲染控制 | `ToolPart.tsx:2672-2673` `shouldRenderTaskSummary/ExpandedContent` | 修改 — task 也走 `isExpanded` 控制 |
| useLayoutEffect 动画 | `ToolPart.tsx:2002-2004` | 修改 — 移除 `isTaskTool` 特判 |
| 内容区条件分支 | `ToolPart.tsx:2806-2849` | 修改 — task 内容移入 `expandedContentRef` div |

### 2.4 推进策略

1. **编排骨架对齐**：移除 `isTaskTool` 特判守卫，让 task 走统一折叠路径
   退出信号：task 折叠/展开动画与普通工具表现一致

2. **延迟渲染对齐**：`shouldRenderTaskSummary` 改为依赖 `isExpanded`
   退出信号：折叠时 `TaskToolSummary` DOM 不存在，展开后延迟挂载

3. **清理遗留特判**：确认无其他 `isTaskTool` 特判影响折叠行为
   退出信号：grep 零残留

4. **验证**：手动测试折叠/展开/默认展开偏好/滚动恢复/并发子代理
   退出信号：所有验收场景通过

### 2.5 结构健康度与微重构

##### 评估

- 文件级 — `ToolPart.tsx`：2928 行，**单文件严重超限（警戒线 500 行）**。职责尚单一（渲染 tool part），但内置组件（TaskToolSummary / ToolExpandedContent / DiffPreview 等）已超过 5 个内容组件。本次仅在文件中修改 3 个分支点，不增加新组件
- 目录级 — `parts/`：当前文件数约 15+，本次不新增文件

##### 结论：不做微重构

原因：本次改动量小（修改 3 个分支），不新增文件，不改变组件结构。`ToolPart.tsx` 的拆分建议作为"超出范围的观察"记录，不阻塞本 feature。

##### 超出范围的观察

- `ToolPart.tsx`（2928 行）已显著超限，`TaskToolSummary` / `ToolExpandedContent` / `DiffPreview` 等内置组件可拆为独立文件。建议后续走 `cs-refactor` 处理。

## 3. 验收契约

### 关键场景清单

| # | 触发 | 期望结果 |
|---|---|---|
| 1 | 渲染包含 task 工具的消息 | 标题行显示 task 图标 + 工具名，右侧有折叠/展开箭头（默认状态由全局偏好控制） |
| 2 | 点击 task 标题行/箭头折叠 | 内容区（TaskToolSummary）收起，仅标题行可见，箭头变为 arrow-right-s |
| 3 | 再次点击展开 | 内容区延迟渲染后出现，箭头变为 arrow-down-s |
| 4 | 与普通工具一起切换 | task 折叠不影响其他工具的展开状态，反之亦然 |
| 5 | 展开状态下有新子代理条目出现 | 内容区保持展开，新条目实时追加（与现状一致） |
| 6 | `showExpandedBashTools` 等全局偏好 | task 工具不依赖这些偏好，其默认展开行为由两集合机制决定 |
| 7 | 消息滚动离开再回来 | 折叠/展开状态从缓存恢复 |

### 明确不做的反向核对项

- 代码中不应出现 `isTaskTool` 特判跳过折叠动画的路径（`useLayoutEffect` 中的特判）
- `TaskToolSummary` 内部条目 6 条截断和 output 折叠行为不变

## 4. 与项目级架构文档的关系

本 feature 改动局限在 `ToolPart.tsx` 组件内部，无系统级可见变化，不更新架构文档。
