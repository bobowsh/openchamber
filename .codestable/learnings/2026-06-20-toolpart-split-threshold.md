# ToolPart.tsx 拆文件阈值

> 类型：knowledge
> 日期：2026-06-20
> 来源场景：collapsible-task-nodes feature 验收

## 观察

`packages/ui/src/components/chat/message/parts/ToolPart.tsx` 行数约 2928 行。

## 判断依据

- 文件中包含了 `ToolPart` 主组件、`TaskToolSummary`、`ToolOutput`、`ToolResultCard`、折叠逻辑、是否逻辑等多个独立渲染单元
- 单个文件超过 500 行后，AI 改代码时上下文窗口容易漏看不相邻分支
- 本次改动 3 个分支点分散在第 1030 / 1130 / 2244 行附近，单文件阅读和 grep 定位成本高

## 建议做法

拆为以下文件（设计不做，记作后置 refactor）：

| 文件 | 内容 |
|---|---|
| `toolPart.tsx` | 主组件编排 + 分支路由 |
| `taskToolSummary.tsx` | `TaskToolSummary` 子组件 |
| `toolOutputPanel.tsx` | `ToolOutput`、`ToolResultCard` |
| `collapsibleContainer.tsx` | 折叠状态 + 动画容器（如需复用） |
| `toolPartUtils.ts` | 工具函数：`shouldRenderTaskSummary`、`getReasoningProps` 等 |

## 适用条件

- 任一组件文件 > 800 行
- 组件内部存在 3+ 独立 `if/else` 分支各自渲染不同子树
