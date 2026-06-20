# 子代理任务节点折叠功能 验收报告

> 阶段：阶段 3（验收闭环）
> 验收日期：2026-06-20
> 关联方案 doc：`.codestable/features/2026-06-20-collapsible-task-nodes/collapsible-task-nodes-design.md`

## 1. 接口契约核对

方案第 2.1 节名词层列出 3 处修改点：

**名词层"现状 → 变化"逐项核对**：

- [x] `!isTaskTool` 守卫取消（line 2820 原 `{!isTaskTool ? (...)}` → 统一渲染容器）
  - 代码改动：移除守卫，`expandedContentRef` div 对所有工具类型渲染 ✓
- [x] `expandedContentRef` useLayoutEffect 中 `isTaskTool` 特判移除
  - 代码改动：block 已删除，task 折叠时正确设置 height/overflow ✓
- [x] `shouldRenderTaskSummary` 加入 `isExpanded` 依赖
  - 代码改动：`isTaskTool && isExpanded && (条件)` ✓
- [x] TaskToolSummary 移入 expandedContentRef 容器
  - 代码改动：`TaskToolSummary` 渲染在统一容器内，受 height/overflow 控制 ✓

**流程图核对**：
- [x] 图中"统一折叠容器"对应 `expandedContentRef` div 的无条件渲染 ✓

**结论：接口契约全部一致，无偏差。**

## 2. 行为与决策核对

**需求摘要逐项验证**：
- [x] task 工具标题行点击可折叠/展开：与普通工具共享同一套 `isExpanded` + `onToggle` + 箭头图标交互 ✓
- [x] 折叠时内容区隐藏：`expandedContentRef` 设 `height: 0` + `overflow: hidden` ✓
- [x] 展开时延迟渲染：`useDeferredExpandedContent` 双 rAF 后挂载 ✓
- [x] 默认展开行为受 `expandedTools`/`collapsedTools` 两集合机制控制 ✓

**明确不做逐项核对**：
- [x] `TaskToolSummary` 内部条目 6 条截断逻辑不变 ✓
- [x] `TaskToolSummary` 内部 output 独立折叠不变 ✓
- [x] 子 session 数据拉取/轮询机制未改动 ✓
- [x] 消息结构和 API 契约未改动 ✓

**关键决策落地**：
- [x] 决策：复用现有折叠机制 → 代码体现：task 与普通工具完全共用同一套 `isExpanded` + `expandedContentRef` + `useLayoutEffect` + `useDeferredExpandedContent` ✓

**编排层"现状 → 变化"逐项核对**：
- [x] 变化 V1：统一渲染路径 → 代码实际落点：两个独立分支合并为一个 `expandedContentRef` 容器，内部条件渲染 `TaskToolSummary` / `ToolExpandedContent` ✓

**流程级约束核对**：
- [x] 延迟渲染一致性：`shouldRenderTaskSummary` 和 `shouldRenderExpandedContent` 均走 `useDeferredExpandedContent` ✓
- [x] 默认展开行为一致性：task 工具状态由 `ChatMessage.tsx` 的 `expandedTools`/`collapsedTools` 管理 ✓
- [x] 动画一致性：`useLayoutEffect` 统一设置 height/overflow ✓
- [x] 布局回调一致性：`shouldNotifyStructuralChange` 在 task 折叠/展开时触发 ✓

**挂载点反向核对**：

方案第 2.3 节列出 4 个挂载点：

| 挂载位置 | 代码实际落点 | 状态 |
|---|---|---|
| ToolPart 渲染分支守卫 | `ToolPart.tsx` 原 `{!isTaskTool ? (...)}` 已移除 | ✓ |
| 延迟渲染控制 | `ToolPart.tsx:2668-2669` | ✓ |
| useLayoutEffect 动画 | `ToolPart.tsx:2002-2014` | ✓ |
| 内容区条件分支 | `ToolPart.tsx:2801-2847` | ✓ |

**反向 grep 核查**：grep `isTaskTool` 在文件中所有 27 处引用，除合法的数据拉取/图标逻辑外，无遗漏的折叠相关守卫 ✓

**拔除沙盘推演**：按清单逆向操作后：
- 删除行 2668 `&& isExpanded` → task 永远展开（回退到改动前）
- 恢复行 2804 的 `{isTaskTool ? null :` 守卫 → 折叠动画失效
- 恢复行 2002 的 `if (isTaskTool) { return; }` → task 无折叠动画

无清单外残留。

## 3. 验收场景核对

- [x] **S1**：渲染包含 task 工具的消息
  - 证据：标题行渲染逻辑不变，`group/tool` div + 箭头图标与普通工具共享
  - 结果：通过

- [x] **S2**：点击 task 标题行/箭头折叠
  - 证据：`useLayoutEffect` 统一设置 `height: 0` + `overflow: hidden`
  - 结果：通过

- [x] **S3**：再次点击展开
  - 证据：`shouldRenderTaskSummary` 走 `useDeferredExpandedContent`，双 rAF 延迟挂载
  - 结果：通过

- [x] **S4**：与普通工具一起切换
  - 证据：`isExpanded` 按 part.id 隔离，task 不影响其他工具
  - 结果：通过（类型系统保证 + code review）

- [x] **S5**：展开状态下有新子代理条目出现
  - 证据：`shouldRenderTaskSummary` 展开时 condition 为真，`TaskToolSummary` 内部实时更新机制不变
  - 结果：通过

- [x] **S6**：全局偏好
  - 证据：task 不依赖 `showExpandedBashTools` 等偏好，默认状态来自 `expandedTools` 两集合机制
  - 结果：通过

- [x] **S7**：消息滚动离开再回来
  - 证据：`expandedTools`/`collapsedTools` 缓存在 `ChatMessage.tsx` 模块级 Map 中，按 messageId 隔离
  - 结果：通过

## 4. 术语一致性

方案第 0 节术语：
- `子代理任务节点` → `normalizedPartTool === 'task'`：代码命中 27 处，全部一致 ✓
- `tool 折叠/展开` → `isExpanded` + `expandedContentRef`：与普通工具共用同一套机制 ✓

**grep 防冲突**：`collapsible-task`、`task-fold`、`task-collapse`、`foldable-task` 均未使用 ✓

## 5. 架构归并

方案第 4 节结论："本 feature 改动局限在 `ToolPart.tsx` 组件内部，无系统级可见变化，不更新架构文档。"

- [x] 架构 doc 无需更新 — 改动纯模块内部，不涉及新增模块/接口/跨模块纪律

## 6. requirement 回写

- [x] `requirement` 字段空 + 纯 UI 重构（不新增用户可感能力）→ 跳过，无 requirement 回写

## 7. roadmap 回写

- [x] `roadmap`/`roadmap_item` 字段均空（非 roadmap 起头）→ 跳过

## 8. attention.md 候选盘点

- [x] 本 feature 未暴露需要补入 attention.md 的内容。纯 UI 组件交互增强，不涉及编译/环境/工具链。

## 9. 遗留

- 后续优化点：无
- 已知限制：无
- 顺手发现：`ToolPart.tsx`（2928 行）显著超限，建议后续走 `cs-refactor` 将内置组件拆为独立文件
