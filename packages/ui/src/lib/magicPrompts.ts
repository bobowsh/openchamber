import { runtimeFetch } from './runtime-fetch';

export type MagicPromptId =
  | 'git.commit.generate.visible'
  | 'git.commit.generate.instructions'
  | 'git.pr.generate.visible'
  | 'git.pr.generate.instructions'
  | 'git.conflict.resolve.visible'
  | 'git.conflict.resolve.instructions'
  | 'git.integrate.cherrypick.resolve.visible'
  | 'git.integrate.cherrypick.resolve.instructions'
  | 'github.pr.review.visible'
  | 'github.pr.review.instructions'
  | 'github.issue.review.visible'
  | 'github.issue.review.instructions'
  | 'github.pr.checks.review.visible'
  | 'github.pr.checks.review.instructions'
  | 'github.pr.comments.review.visible'
  | 'github.pr.comments.review.instructions'
  | 'github.pr.comment.single.visible'
  | 'github.pr.comment.single.instructions'
  | 'plan.todo.visible'
  | 'plan.todo.instructions'
  | 'plan.improve.visible'
  | 'plan.improve.instructions'
  | 'plan.implement.visible'
  | 'plan.implement.instructions'
  | 'session.summary.visible'
  | 'session.summary.instructions'
  | 'session.review.visible'
  | 'session.review.instructions'
  | 'session.reviewHandoff.visible'
  | 'session.reviewHandoff.instructions'
  | 'session.reviewSession.visible'
  | 'session.reviewFeedbackToImplementer.visible'
  | 'session.implementationResponseToReviewer.visible'
  | 'session.plan.visible'
  | 'session.plan.instructions'
  | 'session.catchup.visible'
  | 'session.catchup.instructions'
  | 'session.debug.visible'
  | 'session.debug.instructions'
  | 'session.weigh.visible'
  | 'session.weigh.instructions'
  | 'session.explore.visible'
  | 'session.explore.instructions'
  | 'session.fusion.visible'
  | 'session.fusion.instructions';

export interface MagicPromptDefinition {
  id: MagicPromptId;
  title: string;
  description: string;
  group: 'Git' | 'GitHub' | '规划' | '会话';
  template: string;
  placeholders?: Array<{ key: string; description: string }>;
}

export interface MagicPromptOverridesPayload {
  version: number;
  overrides: Record<string, string>;
}

const API_ENDPOINT = '/api/magic-prompts';

export const MAGIC_PROMPT_DEFINITIONS: readonly MagicPromptDefinition[] = [
  {
    id: 'git.commit.generate.visible',
    title: '提交生成可见提示',
    group: 'Git',
    description: '用于生成提交消息的可见用户提示。',
    template: '你正在根据会话上下文和所选文件路径生成 Conventional Commits 主题行。',
  },
  {
    id: 'git.commit.generate.instructions',
    title: '提交生成指令',
    group: 'Git',
    description: '用于生成提交消息的隐藏指令。',
    placeholders: [
      { key: 'selected_files', description: '当前所选文件路径的列表。' },
    ],
    template: `只返回一个 JSON 对象，不包含其他任何内容。不要包含散文、markdown、解释或代码围栏。

JSON 对象必须具有以下精确结构：
{"subject": string, "highlights": string[]}

规则：
- subject 格式：<type>: <summary>
- 允许的类型：feat, fix, refactor, perf, docs, test, build, ci, chore, style, revert
- subject 中不包含 scope
- 保持 subject 简洁且面向用户
- highlights：0-3 个简洁的面向用户的要点
- 所有 JSON 字符串使用双引号
- 不要包含尾随逗号或注释

所选文件：
{{selected_files}}`,
  },
  {
    id: 'git.pr.generate.visible',
    title: 'PR 生成可见提示',
    group: 'Git',
    description: '用于生成 PR 标题/正文的可见用户提示。',
    template: '你正在根据会话上下文、提交列表和变更文件起草 GitHub Pull Request 标题和正文。',
  },
  {
    id: 'git.pr.generate.instructions',
    title: 'PR 生成指令',
    group: 'Git',
    description: '用于生成 PR 标题/正文的隐藏指令。',
    placeholders: [
      { key: 'base_branch', description: '目标分支名称。' },
      { key: 'head_branch', description: '源分支名称。' },
      { key: 'commits', description: 'base...head 范围内的提交列表。' },
      { key: 'changed_files', description: 'base...head 范围内的变更文件列表。' },
      { key: 'additional_context_block', description: '可选的附加上下文块（已格式化）。' },
    ],
    template: `只返回一个 JSON 对象，不包含其他任何内容。不要在 JSON 之外包含散文、markdown、解释或代码围栏。

JSON 对象必须具有以下精确结构：
{"title": string, "body": string}

规则：
- title：简洁、结果优先、常规风格
- body：带章节的 markdown：## Summary、## Why、## Testing
- 输出要具体且面向用户
- 所有 markdown 放在 body 字符串内
- 所有 JSON 字符串使用双引号，换行符转义为 \\n
- 不要包含尾随逗号或注释

目标分支：{{base_branch}}
源分支：{{head_branch}}

范围内的提交（base...head）：
{{commits}}

这些提交中变更的文件：
{{changed_files}}{{additional_context_block}}`,
  },
  {
    id: 'github.pr.review.visible',
    title: 'PR 审查可见提示',
    group: 'GitHub',
    description: '从 GitHub 上下文创建 PR 审查请求时使用的可见用户提示。',
    placeholders: [
      { key: 'pr_number', description: '拉取请求编号。' },
    ],
    template: '根据提供的 PR 上下文审查此拉取请求 #{{pr_number}}',
  },
  {
    id: 'github.pr.review.instructions',
    title: 'PR 审查指令',
    group: 'GitHub',
    description: '生成 PR 审查回复时附加的隐藏指令。',
    template: `你正在起草一条将发回给 PR 作者的拉取请求审查评论。你不是实施者；不要提议编写代码或运行命令。

起草前：
- 先阅读 PR 标题和正文以理解作者的意图。评估实现是否匹配该意图——遗漏的部分、与意图不符的行为、范围蔓延。
- PR diff 是变更的唯一真实来源；磁盘上的仓库可能尚未反映这些变更。仔细阅读 diff。仅在需要验证特定声明时，才将仓库用作辅助上下文（导入、调用点、现有模式、附近代码）——而不是用于发现变更本身。
- 不要推测：每个报告的问题必须基于你实际读过的 diff 加上辅助仓库证据。如果某个声明无法验证，则放弃——不要含糊其辞或猜测。
- 澄清性问题：如果 PR 本身意图不明确（标题/正文没有说明"为什么"，diff 故意模棱两可），请就此意图向我提出一个聚焦的问题，然后停止。不要开启发现循环——这是审查，不是规划会议。

高信号门槛——只报告满足以下所有条件的问题：
- 客观且可通过 diff 加辅助仓库证据验证。
- 由本 PR 引入（不是预先存在的）。
- 实质性：会导致运行时行为不正确的 bug、安全/隐私风险、正确性边界情况、向后兼容性破坏、跨模块/目标的实现缺失、边界违反，或者明确的 CLAUDE.md / AGENTS.md 违规（你可引用具体规则）。

不要报告：
- 与 diff 无关的预先存在的问题。
- 高级工程师不会指出的迂腐吹毛求疵。
- linter 能发现的问题。
- CLAUDE.md / AGENTS.md 未明确要求的主观风格偏好。
- 没有具体证据的"可能"/"也许"/"潜在"担忧。
- CLAUDE.md / AGENTS.md 中提及但代码中明确静默的规则（例如通过忽略注释或记录的例外）。
- 缺失的测试/覆盖率缺口，除非 CLAUDE.md / AGENTS.md 明确要求变更区域需要。

验证环节：在编写最终评论前，对照 diff + 辅助仓库证据重新检查每个候选问题。放弃任何你不确定的内容。误报会浪费作者的时间。

输出规则：
- 生成一条发给 PR 作者的单一审查评论，使用以下精确格式。
- 不使用 emoji。不使用代码片段。不使用围栏块。简短的内联代码标识符可以。
- 引用基于 diff 的文件路径和行范围（例如 path/to/file.ts:120-138）。仅当 diff 未暴露确切行时，才作为最后手段使用"approx"。
- 每个独特问题一个要点；不要跨章节重复问题。
- 整条评论保持在 ~300 词以内。

精确格式：
<1-2 句意图和总体结论摘要>

Must-fix：
- <问题> - <简要原因> - <文件:行范围> - 操作：<一行操作>
Nice-to-have：
- <问题> - <简要原因> - <文件:行范围> - 操作：<一行操作>

如果没有问题达到高信号门槛，则写：
Must-fix：
- None
Nice-to-have：
- None`,
  },
  {
    id: 'github.issue.review.visible',
    title: 'Issue 审查可见提示',
    group: 'GitHub',
    description: '从 GitHub 上下文创建 Issue 审查请求时使用的可见用户提示。',
    placeholders: [
      { key: 'issue_number', description: 'Issue 编号。' },
    ],
    template: '根据提供的 Issue 上下文审查此 Issue #{{issue_number}}',
  },
  {
    id: 'github.issue.review.instructions',
    title: 'Issue 审查指令',
    group: 'GitHub',
    description: '生成 Issue 审查回复时附加的隐藏指令。',
    template: `使用提供的 Issue 上下文审查此 Issue。

流程：
- 首先分类 Issue 类型（bug / feature request / question/support / refactor / ops）并说明：类型：<一个标签>。
- 收集所需的仓库上下文（代码、配置、文档）以验证假设。
- 收集后，如果仍有任何不明确或无法验证的内容，不要推测——说明缺失了什么并提出有针对性的问题。

按类型选择模式：
- Bug / Question/Support / Ops：直接使用下方的匹配模板给出回复。对于直接诊断，不要用问题轰炸我；改用"缺失信息"/"需要复现/诊断"字段。
- Feature request / Refactor 且存在实质性未知项：这实际上是一个规划会议。不要在第一轮就输出 Feature 模板。而是分批向我提出聚焦的澄清性问题，每批最多 3 个，一次一个主题（范围、约束、权衡、UX 等），等待回答，放弃已不相关的问题，重复直到没有更多实质性问题。然后才输出 Feature 模板。

输出规则：
- 紧凑输出；选择下方一个模板，省略其他。
- 不使用 emoji。不使用代码片段。不使用围栏块。
- 简短的内联代码标识符可以。
- 引用基于 diff 的文件路径和行范围；如果确切行不可用，引用文件并说明"approx"及原因。
- 整个回复保持在 ~300 词以内（适用于最终模板输出，不适用于澄清性问题的轮次）。

模板（选择一个）：
Bug：
- 摘要（1-2 句）
- 可能原因（最多 2 个）
- 需要复现/诊断（最多 3 个）
- 修复方案（最多 4 步）
- 验证（最多 3 个）

Feature：
- 摘要（1-2 句）
- 需求（最多 4 个）
- 未知项/问题（最多 4 个）
- 建议方案（最多 5 步）
- 验证（最多 3 个）

Question/Support：
- 摘要（1-2 句）
- 回答/指导（最多 6 行）
- 缺失信息（最多 4 个）

在我确认之前不要实施变更；结束时写上："后续操作：<1 句话>"。`,
  },
  {
    id: 'github.pr.checks.review.visible',
    title: 'PR 检查失败可见提示',
    group: 'GitHub',
    description: '用于 PR 检查失败分析的可见用户提示。',
    template: '审查这些 PR 检查失败项并提出可能的修复方案。在我确认之前不要实施。',
  },
  {
    id: 'github.pr.checks.review.instructions',
    title: 'PR 检查失败指令',
    group: 'GitHub',
    description: '用于 PR 检查失败分析的隐藏指令。',
    template: `使用附带的检查结果数据。
- 总结正在失败的内容。
- 优先检查注释/错误信息而非通用状态文本。
- 确定可能的根本原因。
- 提出最小修复方案和验证步骤。
- 不要推测：需要时询问缺失信息。`,
  },
  {
    id: 'github.pr.comments.review.visible',
    title: 'PR 评论审查可见提示',
    group: 'GitHub',
    description: '用于 PR 评论分析的可见用户提示。',
    template: '审查这些 PR 评论并提出所需的变更和后续操作。在我确认之前不要实施。',
  },
  {
    id: 'github.pr.comments.review.instructions',
    title: 'PR 评论审查指令',
    group: 'GitHub',
    description: '用于 PR 评论分析的隐藏指令。',
    template: `使用附带的评论数据。
- 区分必须修改和可选修改。
- 如果存在意图/实现不匹配，指出来。
- 在提出方案前：如果评论的意图不明确，或者所需的修改取决于只有我能决定的权衡，请分批向我提出聚焦的澄清性问题，每批最多 3 个，等待回答。不要推测。
- 一旦意图明确，提出最小方案和验证步骤。`,
  },
  {
    id: 'github.pr.comment.single.visible',
    title: '单条 PR 评论可见提示',
    group: 'GitHub',
    description: '用于单条 PR 评论分析的可见用户提示。',
    template: '回应此 PR 评论并提出所需的变更。在我确认之前不要实施。',
  },
  {
    id: 'github.pr.comment.single.instructions',
    title: '单条 PR 评论指令',
    group: 'GitHub',
    description: '用于单条 PR 评论分析的隐藏指令。',
    template: `使用附带的单条评论数据。
- 说明审查者要求什么。
- 确定可能受影响的确切代码区域。
- 在提出方案前：如果审查者的意图不明确，或者所需的修改取决于只有我能决定的权衡，请分批向我提出聚焦的澄清性问题，每批最多 3 个，等待回答。不要推测。
- 一旦意图明确，提出最小实施方案和验证步骤。`,
  },
  {
    id: 'git.conflict.resolve.visible',
    title: '合并/变基冲突可见提示',
    group: 'Git',
    description: '用于合并/变基冲突解决的可见用户提示。',
    placeholders: [
      { key: 'operation_label', description: '操作标签，小写（merge/rebase）。' },
      { key: 'head_ref', description: '用于保留意图的源引用。' },
    ],
    template: '调查 {{operation_label}} 冲突并简洁地报告预期的解决策略，不做任何修改。等待确认后再解决、暂存或继续 {{operation_label}}。保留来自 {{head_ref}} 的变更意图。',
  },
  {
    id: 'git.conflict.resolve.instructions',
    title: '合并/变基冲突指令',
    group: 'Git',
    description: '用于合并/变基冲突解决的隐藏指令。',
    placeholders: [
      { key: 'operation_label', description: '操作标签，小写（merge/rebase）。' },
      { key: 'directory', description: '仓库目录路径。' },
      { key: 'operation', description: '操作名称。' },
      { key: 'head_info', description: '头部元数据（如有）。' },
      { key: 'continue_cmd', description: '继续操作的命令。' },
    ],
    template: `Git {{operation_label}} 操作正在进行中，存在冲突。
- 目录：{{directory}}
- 操作：{{operation}}
- 头部信息：{{head_info}}

确认前必须完成的步骤：
1. 阅读每个冲突文件以理解冲突标记（<<<<<<< HEAD、=======、>>>>>>> ...）
2. 检查双方的相关周围代码和变更
3. 报告每个文件的简洁解决策略以及任何假设或权衡
4. 等待用户明确确认后再编辑文件、暂存文件或运行：{{continue_cmd}}

重要事项：
- 在用户确认建议策略前不要修改文件
- 在用户确认建议策略前不要暂存文件
- 在用户确认建议策略前不要继续 {{operation_label}}
- 从文件中删除所有冲突标记（<<<<<<< HEAD、=======、>>>>>>>）
- 确保最终代码语法正确并保留双方的意图
- 不要留下任何包含未解决冲突标记的文件
- 完成所有步骤后，确认 {{operation_label}} 已成功`,
  },
  {
    id: 'git.integrate.cherrypick.resolve.visible',
    title: 'Cherry-pick 冲突可见提示',
    group: 'Git',
    description: '用于 cherry-pick 冲突解决的可见用户提示。',
    placeholders: [
      { key: 'current_commit', description: '当前正在应用的提交哈希。' },
      { key: 'target_branch', description: '目标分支名称。' },
    ],
    template: '解决 cherry-pick 冲突，暂存已解决的文件并继续 cherry-pick。保留提交 {{current_commit}} 到分支 {{target_branch}} 的意图。',
  },
  {
    id: 'git.integrate.cherrypick.resolve.instructions',
    title: 'Cherry-pick 冲突指令',
    group: 'Git',
    description: '用于 cherry-pick 冲突解决的隐藏指令。',
    placeholders: [
      { key: 'repo_root', description: '仓库根路径。' },
      { key: 'temp_worktree_path', description: '临时工作树路径。' },
      { key: 'source_branch', description: '源分支名称。' },
      { key: 'target_branch', description: '目标分支名称。' },
      { key: 'current_commit', description: '当前正在应用的提交哈希。' },
    ],
    template: `工作树提交集成（cherry-pick）正在进行中，存在冲突。
- 仓库根：{{repo_root}}
- 临时目标工作树：{{temp_worktree_path}}
- 源分支：{{source_branch}}
- 目标分支：{{target_branch}}
- 当前提交：{{current_commit}}

所需步骤：
1. 阅读临时工作树中的每个冲突文件以理解冲突标记（<<<<<<< HEAD、=======、>>>>>>> ...）
2. 编辑每个文件以解决冲突——选择正确的代码或适当地合并双方的变更
3. 使用 git add <file> 暂存所有已解决的文件
4. 使用 git cherry-pick --continue 完成 cherry-pick

重要事项：
- 在临时工作树目录内工作：{{temp_worktree_path}}
- 从文件中删除所有冲突标记（<<<<<<< HEAD、=======、>>>>>>>）
- 保留正在应用的提交的意图
- 确保最终代码语法正确
- 不要留下任何包含未解决冲突标记的文件
- 完成所有步骤后，确认 cherry-pick 已成功`,
  },
  {
    id: 'plan.todo.visible',
    title: '待办事项规划可见提示',
    group: '规划',
    description: '将待办事项发送到新规划会话时使用的可见用户提示。',
    placeholders: [
      { key: 'todo_text', description: '用户选择的待办事项文本。' },
    ],
    template: '{{todo_text}}',
  },
  {
    id: 'plan.todo.instructions',
    title: '待办事项规划指令',
    group: '规划',
    description: '将项目待办事项发送到新规划会话的隐藏指令。',
    placeholders: [
      { key: 'todo_text', description: '用户选择的待办事项文本。' },
    ],
    template: `你从一个项目待办事项开始。
待办事项：{{todo_text}}
你现在的任务是为这个待办事项生成一个全面的实施方案，而不是立即实施。目标是得到一个深思熟虑的方案，而不是一个快速的方案。

与我进行来回对话。不要一次性抛出大量问题。不要直接跳到完整方案。

发现——每批最多 3 个问题：
1. 首先，检查仓库——相关文件、模块文档、现有模式、附近代码、约束、依赖——足够形成有根据的问题，但不足以猜测方案。
2. 每轮最多问我 3 个问题。每批应一次聚焦一个主题（例如范围、架构、数据模型、UX、边界情况）。选择当前最阻碍方案的主题。
3. 等待我的回答。用它们来完善你的理解，必要时重新阅读代码，并准备下一批问题。
4. 在我之前的回答后已不相关的问题——放弃它们，不要问。
5. 重复直到没有更多实质性问题。

对齐：
6. 分享简短大纲：受影响的区域、建议的方法、主要风险。等待我的确认或修正。在大纲上迭代直到我确认。

最终方案：
7. 一旦对齐，交付基于仓库上下文的实施方案。明确说明剩余的假设和缺失的上下文。`,
  },
  {
    id: 'plan.improve.visible',
    title: '改进计划可见提示',
    group: '规划',
    description: '将已保存的计划发送到改进流程时使用的可见用户提示。',
    placeholders: [
      { key: 'plan_title', description: '当前计划标题。' },
    ],
    template: '改进此计划：{{plan_title}}',
  },
  {
    id: 'plan.improve.instructions',
    title: '改进计划指令',
    group: '规划',
    description: '从项目上下文改进已保存计划的隐藏指令。',
    placeholders: [
      { key: 'plan_title', description: '当前计划标题。' },
      { key: 'plan_path', description: '已保存计划文件的绝对路径。' },
    ],
    template: `你从一个已有的实施方案开始。
计划标题：{{plan_title}}
此计划存储在文件：{{plan_path}}
先读取该文件，将其当前内容视为计划的唯一真实来源。
你现在的任务是改进这个计划，使其更好地基于实际的仓库状态。不要实施。目标是得到一个深思熟虑的改进方案，而不是一个快速的方案。

与我进行来回对话。不要一次性抛出大量问题。不要直接跳到完整的改进方案。

发现——每批最多 3 个问题：
1. 首先，检查仓库并将其与计划对照——相关文件、模块文档、现有模式、附近代码、约束、依赖。识别差距、与仓库不匹配的计划假设、缺失的上下文和风险。
2. 每轮最多问我 3 个问题。每批应一次聚焦一个主题（例如范围差异、架构假设、数据模型、UX、边界情况、方法间的权衡）。选择当前最阻碍信心十足的改进的主题。
3. 等待我的回答。用它们来完善你的理解，必要时重新阅读代码，并准备下一批问题。
4. 在我之前的回答后已不相关的问题——放弃它们，不要问。
5. 重复直到没有更多实质性问题。

对齐：
6. 分享建议变更的简短摘要——计划的哪些部分变更及原因、未解决的问题、建议。不要内联重写整个计划，也不要将完整计划作为代码块返回。只引用小的目标片段或描述需要变更的确切章节。等待我的确认或修正。迭代直到我确认。

最后一步：
7. 一旦对齐，明确提供编辑此文件（{{plan_path}}）以应用已同意的变更。明确说明剩余的假设和缺失的上下文。`,
  },
  {
    id: 'plan.implement.visible',
    title: '实施计划可见提示',
    group: '规划',
    description: '将已保存的计划发送到实施流程时使用的可见用户提示。',
    placeholders: [
      { key: 'plan_title', description: '当前计划标题。' },
    ],
    template: '实施此计划：{{plan_title}}',
  },
  {
    id: 'plan.implement.instructions',
    title: '实施计划指令',
    group: '规划',
    description: '从项目上下文实施已保存计划的隐藏指令。',
    placeholders: [
      { key: 'plan_title', description: '当前计划标题。' },
      { key: 'plan_path', description: '已保存计划文件的绝对路径。' },
    ],
    template: `你从一个已有的实施方案开始。
计划标题：{{plan_title}}
此计划存储在文件：{{plan_path}}
先读取该文件，将其当前内容视为计划的唯一真实来源。计划已达成一致；从头到尾实施它，不要偏离。

在实施之前和实施过程中，深入理解项目——相关文件、模块文档、现有模式、附近代码、约定——以便你的选择符合仓库的风格。

持续进行实施工作。当计划步骤不明确时，不要停下来询问——做出与计划意图和仓库约定一致的最佳判断，并在内联中简要说明该决定，以便审查时可见。优先向前推进，而不是打扰我。

不要超出计划范围。如果在实施过程中发现计划本身有误或确实阻碍完成（不仅仅是模棱两可），停下来，准确说明问题所在及原因，并在此文件（{{plan_path}}）中提议计划调整以保存回去，然后再继续。`,
  },
  {
    id: 'session.summary.visible',
    title: '会话摘要可见提示',
    group: '会话',
    description: '由 /summary 命令发送的可见用户提示。',
    placeholders: [
      { key: 'topic_line', description: '预格式化的主题子句（例如" focused on: <topic>"）或空字符串。' },
    ],
    template: '总结此会话{{topic_line}}。',
  },
  {
    id: 'session.summary.instructions',
    title: '会话摘要指令',
    group: '会话',
    description: '附加到 /summary 命令的隐藏指令。生成可用于交接的非破坏性摘要。',
    placeholders: [
      { key: 'topic_block', description: '预格式化的主题聚焦段落，或未提供主题提示时的空字符串。' },
    ],
    template: `生成此会话的非破坏性摘要。不要压缩或变更会话历史——你的输出是一条用户将阅读并可能用于交接给新会话的额外助理消息。

涵盖对继续此工作有用的信息：
- 已完成的工作（已完成的工作，按顺序）
- 当前正在进行的工作
- 修改的文件——每个文件的简要说明和原因
- 未解决的问题和后续步骤
- 需要延续的用户请求、约束或偏好
- 重要的技术决策及其原因

{{topic_block}}

格式：
- 简洁的 markdown，带简短章节和列表
- 不要使用"以下是摘要"之类的开场白——直接进入内容
- 不要回答会话中发现的问题——只做总结
- 长度与会话长度成比例，不要填充

使用用户在该会话中最常用的语言回复。`,
  },
  {
    id: 'session.review.visible',
    title: '工作区审查可见提示',
    group: '会话',
    description: '由 /workspace-review 命令发送的可见用户提示。',
    template: '审查此工作区中的变更。',
  },
  {
    id: 'session.review.instructions',
    title: '工作区审查指令',
    group: '会话',
    description: '附加到 /workspace-review 命令的隐藏指令。按意图、正确性和充分性审查工作区差异，附带严重程度分类的发现。',
    template: `审查此工作区中的变更，判断它们是否正确和充分——不仅仅看是否包含灾难性错误。

diff 是唯一真实来源。也要阅读 diff 周围的代码，而不仅仅是 diff 本身，以便在上下文中理解变更。

首先，理解意图以及是否已达成：
- 从 diff 和周围代码弄清这些变更试图做什么——它们背后的意图。
- 判断实现是否真的达成了该意图，以及它是否是最小化的正确方式。指出变更不完整、仅部分解决了目标、遗漏了明显要处理的情况，或解决方案不可靠的地方。

然后寻找具体问题。报告真实的失败模式，而不是抽象怀疑，不要没有影响地吹毛求疵。

正确性关注点：
- 竞态条件、过时的异步结果、事件顺序
- 数据丢失或写入失败
- 生命周期和清理（监听器、定时器、订阅、资源）
- 不可传递的比较器或不稳定的排序
- 状态/存储扇出和渲染性能
- 乐观状态回滚和对账
- 可访问性语义
- 由变更引入的回归
- 当 diff 明显引入了缺口时，受影响模块或目标中缺失的实现
- 针对高风险或易回归变更的缺失的针对性测试
- 明确适用于已变更文件的 CLAUDE.md 或 AGENTS.md 违规

安全和供应链关注点（当 diff 涉及这些时）：
- 依赖、构建/发布/CI 脚本
- 认证、令牌、密钥、凭据
- 文件系统边界和路径遍历
- shell 执行
- 网络调用、遥测、数据外泄
- IPC、原生桥接、更新器、桌面 shell
- 小 diff 或广泛重构背后的隐藏行为

不要报告：
- 与 diff 无关的预先存在的问题
- 高级工程师不会指出的迂腐吹毛求疵，或 linter 能发现的问题
- CLAUDE.md 或 AGENTS.md 未要求的主观风格偏好
- 无法与具体失败关联的推测性担忧
- CLAUDE.md 或 AGENTS.md 中提及但代码中明确静默的规则

验证环节：
- 报告问题前，对照 diff 加上你实际读过的上下文重新检查。
- 对于 CLAUDE.md 或 AGENTS.md 违规，验证规则是否适用于受影响的文件路径并引用具体规则。
- 如果你不能将发现与具体影响关联，放弃它。

对每个发现进行分类：
- blocker：可能是回归、数据丢失、安全问题、不变性破坏或严重的正确性问题——或者变更实际上未达成其意图
- non-blocker：真实但轻微的问题、测试缺口或可维护性担忧
- nit：仅在有帮助时提及，绝不视为阻塞

这只是审查——除非用户要求，否则不要编辑、修复或提交任何内容。

输出：
- 以一或两句话开头：变更做了什么以及是否达成了意图。
- 然后按严重程度分组列出发现。每个发现包括：简短标题、为什么是真实问题、受影响的文件路径和类别（正确性/安全/规则违规/充分性缺口）。
- 如果没有发现真实问题，直说而不是编造发现。

保持审查简洁实用。使用用户使用的语言回复。`,
  },
  {
    id: 'session.reviewHandoff.visible',
    title: '审查交接可见提示',
    group: '会话',
    description: '由 /handoff-review 命令发送的可见用户提示。',
    template: '准备交接信息供另一个代理审查此工作。',
  },
  {
    id: 'session.reviewHandoff.instructions',
    title: '审查交接指令',
    group: '会话',
    description: '附加到 /handoff-review 命令的隐藏指令。生成供独立审查代理使用的交接信息。',
    template: `为另一个代理生成审查交接信息。不要压缩或变更会话历史。你的输出是一条 OpenChamber 将发送给独立审查代理的助理消息。

包括：
- 用户的原始意图以及后来改变意图的任何澄清
- 实现了什么及原因
- 变更的文件，每个文件的简要目的
- 重要的设计决策和权衡
- 已运行的验证/测试（如已知）
- 已知的缺口、不确定性或审查者应仔细检查的领域

格式：
- 简洁的 markdown，带清晰的章节
- 不要使用"以下是交接信息"之类的开场白
- 不要提及 OpenChamber 元数据、链接的会话、会话 ID 或路由
- 使用用户在该会话中最常用的语言回复`,
  },
  {
    id: 'session.reviewSession.visible',
    title: '审查会话启动提示',
    group: '会话',
    description: '发送到生成的审查会话的可见用户提示。',
    placeholders: [
      { key: 'handoff', description: '生成的实施交接信息。' },
    ],
    template: `请审查此交接信息中描述的变更。

关注正确性、回归、缺失的实现、缺失的测试以及实现是否满足所述意图。为实施变更的代理提供简洁、可操作的反馈。

{{handoff}}`,
  },
  {
    id: 'session.reviewFeedbackToImplementer.visible',
    title: '审查反馈传递提示',
    group: '会话',
    description: '从审查会话发送回实施代理的可见用户提示。',
    placeholders: [
      { key: 'review_feedback', description: '审查助理反馈文本。' },
    ],
    template: `另一个代理审查了你的变更并留下以下反馈。

请审查反馈，解决相关问题，并说明你做了什么修改。

{{review_feedback}}`,
  },
  {
    id: 'session.implementationResponseToReviewer.visible',
    title: '实施回复传递提示',
    group: '会话',
    description: '从实施代理发送回审查会话的可见用户提示。',
    placeholders: [
      { key: 'implementation_response', description: '实施助理回复文本。' },
    ],
    template: `实施变更的代理已回复了先前的审查反馈。

请再次审查最新状态并报告任何剩余问题。

{{implementation_response}}`,
  },
  {
    id: 'session.plan.visible',
    title: '功能规划可见提示',
    group: '会话',
    description: '由 /plan-feature 命令发送的可见用户提示。',
    template: '我想开始规划一个功能。',
  },
  {
    id: 'session.plan.instructions',
    title: '功能规划指令',
    group: '会话',
    description: '附加到 /plan-feature 命令的隐藏指令。运行引导式分批提问对话，在生成实施计划前研究代码。',
    template: `用户希望通过引导式的来回对话规划一个功能。他们会描述一个想法——通常简短且非正式。你的工作是将该想法转化为具体、经过验证的实施方案，而不进行猜测。

以对话方式运行，而不是一次性答案。

1. 在提问前先理解。用户描述想法后，首先自己研究代码库——阅读相关文件、现有模式、数据流和约束。将每个问题建立在代码实际显示的内容上，而不是假设上。

2. 小批量提问。一次最多问 3 个澄清性问题——一个人可以在一次回复中舒适回答的数量。首选具体、面向决策的问题（选项 A/B/C、边界情况、范围边界）而非模糊的开放式问题。给它们编号。

3. 持续直到解决。每批答案后，整合它们，根据答案做进一步的代码研究，然后问下一批。持续直到没有未解决的决策或实施细节。不要提前停止或过早开始总结。

4. 揭示用户未考虑的事项。主动提出边界情况、陷阱、受影响的模块、迁移/向后兼容性问题以及用户可能未想到的权衡。将这些融入你的问题中让用户决定——永远不要默默替他们决定。

5. 在此阶段不要编写代码或开始实施。规划仅用于理解和决策。

6. 一切确定后，生成最终的实施方案：清晰、有序的工作分解、受影响的文件和领域、已做的决策（及其原因）、已知的风险以及明确标记的剩余假设。方案必须反映用户的实际回答——永远不要用猜测填补空白。

使用用户使用的语言回复。`,
  },
  {
    id: 'session.catchup.visible',
    title: '快速跟上可见提示',
    group: '会话',
    description: '由 /catch-up 命令发送的可见用户提示。',
    template: '告诉我当前项目的进展情况。',
  },
  {
    id: 'session.catchup.instructions',
    title: '快速跟上指令',
    group: '会话',
    description: '附加到 /catch-up 命令的隐藏指令。检查 git 状态和分支：进行中的差异、开放的 PR 审查状态或最近的提交。',
    template: `用户离开项目后返回，希望快速了解情况——一个快速易懂的"你当前在哪里以及从哪里继续"，而不是状态报告。先调查实际的仓库状态，然后以对话方式引导他们。不要假设；检查。

先静默检查 git 状态，静默完成这项工作——用户想要结论，而不是你运行命令的逐步回放。查看：当前分支是否是仓库的默认分支（main/master 或该仓库使用的任何名称）、未提交的变更（状态和 diff）、最近的提交以及分支相对于其远程的位置。

分层构建上下文——它们相互结合，不是二选一。未提交的变更（存在时）是焦点，但通过周围上下文来理解它们，因为进行中的工作通常是更大工作的一部分。

首先，获取分支上下文：
- 如果这不是默认分支（功能分支）：整体理解该分支的目的。读取其最近的提交和它们的 diff——不需要全部，足够多直到意图和实施方式变得清晰即可。还要检查该分支是否有自己的开放 PR，即使存在未提交的变更——PR 说明了当前 diff 服务于什么（继续功能，或处理审查反馈），并帮助你判断工作是看起来已完成还是仍进行中。如果分支落后于其远程（有人推送了），作为提醒提及。
- 如果这是默认分支：快速浏览最近几个提交（不深入）以查看未提交的工作是否是近期工作的延续，以及是什么。

然后聚焦并综合：
- 如果存在未提交的变更，以它们为主导——它们之前在做什么及原因、什么看起来已完成与仍进行中、以及推测在何处停止——通过上述分支上下文来解读（这是在完成功能？回应审查？新方向？）。以此开头，例如"看起来你正在做 X 的过程中……"。
- 如果工作树是干净的，从分支自身的工作和 PR（功能分支）或最近提交（默认分支）来引导。

以清晰的下一步结束，并使其关于继续实际工作，而不是做杂务。他们运行此命令的事实意味着他们离开了——如果工作已完成，他们很可能已经交付了，所以假设还有更多工作要做，指出实质性的下一步工作（"接下来你需要将 X 接入 Y 并处理 Z"）。仅当真的没有需要构建的内容，或者这确实是下一步最有用的行动时，才建议做杂务——推送、打开 PR、运行检查。

硬性规则：
- 只讨论当前分支及其自身的工作。永远不要提及不相关的分支、其他人的 PR、分配给用户的审查请求或属于其他分支的 PR——这里不需要这些噪音。
- 使用 ahead/behind 和提交历史来理解意图，而不是作为 dump 的内容。不要填充原始的 git 机制（确切的提交数量、"ahead of origin by N"、远程跟踪细节），除非它确实是唯一最有用的信息。
- 深度体现在你的理解中，而不是回复的长度。保持输出简短、易读、可扫描——几句定位的话加上清晰的下一步。像队友在快速介绍情况一样写，而不是 CI 摘要。

使用用户使用的语言回复。`,
  },
  {
    id: 'session.debug.visible',
    title: '调试可见提示',
    group: '会话',
    description: '由 /debug 命令发送的可见用户提示。',
    template: '我想调试一个问题。',
  },
  {
    id: 'session.debug.instructions',
    title: '调试指令',
    group: '会话',
    description: '附加到 /debug 命令的隐藏指令。在提出修复方案之前运行引导式根因调查。',
    template: `用户需要帮助调试一个问题。将其作为聚焦的根因调查来驱动——不是方案，也不是立即修复。

1. 获取症状。当用户描述问题时，准确记录观察到什么与预期什么——错误消息、堆栈跟踪、失败行为以及何时开始。如果连开始都需要关键细节，简短地询问。

2. 形成假设。列出最可能的原因，根据症状和代码按概率排序，并明确说明你的推理。

3. 调查以确认或排除。阅读相关代码，跟踪数据和控制流，对照代码实际执行的操作检查主要假设。优先选择代码中的证据而非推测。

4. 只问你需要的。如果你需要复现、日志、环境细节或特定值来缩小范围，要求最低限度的信息——小批量——而不是猜测。

5. 识别根因。在修改任何代码前，说明实际原因及其证据，并区分根因与其症状。

6. 然后才提出修复方案——解决根因的最小变更，以及如何验证。在原因确认或用户要求之前，不要开始编辑代码。

使用用户使用的语言回复。`,
  },
  {
    id: 'session.weigh.visible',
    title: '权衡选项可见提示',
    group: '会话',
    description: '由 /weigh 命令发送的可见用户提示。',
    template: '帮我决定如何处理这个问题。',
  },
  {
    id: 'session.weigh.instructions',
    title: '权衡选项指令',
    group: '会话',
    description: '附加到 /weigh 命令的隐藏指令。研究代码，然后比较不同方法及其权衡，给出建议——不制定计划，不编写代码。',
    template: `用户知道他们想做什么，但不知道如何做。帮助他们选择方向——这是关于权衡选项并推荐一个，而不是制定详细计划或编写代码。

首先，调查。用户描述目标后，阅读相关代码、现有模式和约束，以便你的选项基于此代码库，而不是泛泛的建议。确保你实际理解了他们试图实现什么以及为什么。仅在关键约束缺失且确实会改变选项时，才问澄清性问题。

然后提出 2-3 个真正不同的方法——真正的替代方案，而不是一个想法的微小变体。包括那些即使更复杂也能正确交付用户所需的方法；永远不要因为某个强有力的选项更难构建就排除它。对每个方法涵盖：
- 它涉及什么，一两句话
- 它在多大程度上实际满足用户的目标——是完全解决还是仅部分解决？
- 它如何适应（或违抗）此代码库中的现有模式
- 权衡和后果：复杂度、风险、影响范围、工作量、长期可维护性
- 何时是正确的选择

然后给出明确的建议。以最能服务用户实际需求和意图为基础——而不是基于什么最快、最简单或阻力最小的路径。工作量和复杂度是你要诚实说明的后果，绝不是引导用户走向较弱选项的理由。永远不要因为正确的方法工作量更大就推荐打了折扣或部分的解决方案：如果真正适合的方法也是困难的，推荐它并坦诚说明代价。仅当较简单的选项确实能同样好地实现目标时才选择它。说明你会选哪个及原因，并说明什么会改变你的想法（例如"选择 A，除非你预期 X，那样就选 B"）。

保持具体和可扫描。不要开始实施，也不要编写逐步方案——一旦用户选择了方向，他们可以将其带入规划或直接构建。

使用用户使用的语言回复。`,
  },
  {
    id: 'session.explore.visible',
    title: '代码库导览可见提示',
    group: '会话',
    description: '由 /explore 命令发送的可见用户提示。',
    template: '给我一个这个代码库的高层概览。',
  },
  {
    id: 'session.explore.instructions',
    title: '代码库导览指令',
    group: '会话',
    description: '附加到 /explore 命令的隐藏指令。研究仓库并给出结构化概览，而非逐文件的列表。',
    template: `用户希望了解这个代码库——一个高层导览，就像你正在引导新贡献者入职一样。先调查，然后解释；不要仅从文件名或符号名称猜测。

探索实际仓库：入口点、顶层结构、如何构建和运行、主要模块及其连接方式。阅读足够多的实际代码以确保准确。

然后给出清晰的导览，涵盖：
- 大局观：这个项目是什么以及它的高层结构。
- 主要部分：关键模块、包或目录，每个的职责以及它们的位置。
- 如何协同工作：主要流程——请求或动作如何在系统中流转，各部分如何相互通信。
- 值得了解的约定：值得注意的模式、共享代码/类型/配置的位置以及新人会遇到的任何不明显的陷阱。
- 从哪里开始：一些具体的指引，用于找到方向或进行第一个变更。

保持可读的导览，而不是详尽的逐文件列表——优先展示结构和思维模型而非列出所有内容。以大局观开始，然后深入。如果用户指定了特定区域，将导览聚焦在那里。

使用用户使用的语言回复。`,
  },
  {
    id: 'session.fusion.visible',
    title: '融合可见提示',
    group: '会话',
    description: '用于多轮融合会话的可见用户提示。',
    template: '从多轮运行结果中创建最佳的综合回答。',
  },
  {
    id: 'session.fusion.instructions',
    title: '融合指令',
    group: '会话',
    description: '在融合会话中用于多轮源输出的隐藏指令。',
    template: `你正在对来自同一原始任务的多个模型输出执行融合。

目标：通过组合互补信息、解决冲突、消除重复和保留有用的细微差别，生成最强大的最终答案。

将以下结果用作源材料。不要提及输入是隐藏部分。如果来源有分歧，首选最具体、最受支持和内部一致的答案。

--- 融合输入开始 ---`,
  },
] as const;

const MAGIC_PROMPT_DEFINITION_BY_ID = new Map<MagicPromptId, MagicPromptDefinition>(
  MAGIC_PROMPT_DEFINITIONS.map((definition) => [definition.id, definition])
);

const LEGACY_PROMPT_KEY_MAP: Record<string, { visible: MagicPromptId; instructions: MagicPromptId }> = {
  'git.commit.generate': {
    visible: 'git.commit.generate.visible',
    instructions: 'git.commit.generate.instructions',
  },
  'git.pr.generate': {
    visible: 'git.pr.generate.visible',
    instructions: 'git.pr.generate.instructions',
  },
};

let cachedOverrides: Record<string, string> | null = null;
let inFlightOverridesRequest: Promise<Record<string, string>> | null = null;

const replaceTemplateVariables = (template: string, variables: Record<string, string>) => {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    if (!Object.prototype.hasOwnProperty.call(variables, key)) {
      return '';
    }
    return variables[key] ?? '';
  });
};

const normalizeOverridesPayload = (payload: unknown): Record<string, string> => {
  const overridesRaw = (payload as { overrides?: unknown } | null)?.overrides;
  if (!overridesRaw || typeof overridesRaw !== 'object' || Array.isArray(overridesRaw)) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(overridesRaw as Record<string, unknown>)) {
    if (typeof value !== 'string') {
      continue;
    }
    result[key] = value;
  }

  for (const [legacyKey, splitKeys] of Object.entries(LEGACY_PROMPT_KEY_MAP)) {
    const legacyValue = result[legacyKey];
    if (typeof legacyValue !== 'string') {
      continue;
    }

    const firstNewlineIndex = legacyValue.indexOf('\n');
    const visible = (firstNewlineIndex === -1 ? legacyValue : legacyValue.slice(0, firstNewlineIndex)).trim();
    const instructions = (firstNewlineIndex === -1 ? '' : legacyValue.slice(firstNewlineIndex + 1)).trim();

    if (!(splitKeys.visible in result) && visible.length > 0) {
      result[splitKeys.visible] = visible;
    }
    if (!(splitKeys.instructions in result) && instructions.length > 0) {
      result[splitKeys.instructions] = instructions;
    }
  }

  return result;
};

export const fetchMagicPromptOverrides = async (): Promise<Record<string, string>> => {
  if (cachedOverrides) {
    return cachedOverrides;
  }

  if (!inFlightOverridesRequest) {
    inFlightOverridesRequest = runtimeFetch(API_ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load magic prompts');
        }
        const payload = await response.json().catch(() => ({}));
        const normalized = normalizeOverridesPayload(payload);
        cachedOverrides = normalized;
        return normalized;
      })
      .finally(() => {
        inFlightOverridesRequest = null;
      });
  }

  return inFlightOverridesRequest;
};

export const invalidateMagicPromptOverridesCache = () => {
  cachedOverrides = null;
  inFlightOverridesRequest = null;
};

export const getMagicPromptDefinition = (id: MagicPromptId): MagicPromptDefinition => {
  const definition = MAGIC_PROMPT_DEFINITION_BY_ID.get(id);
  if (!definition) {
    throw new Error(`Unknown magic prompt id: ${id}`);
  }
  return definition;
};

export const getDefaultMagicPromptTemplate = (id: MagicPromptId): string => {
  return getMagicPromptDefinition(id).template;
};

export const getEffectiveMagicPromptTemplate = async (id: MagicPromptId): Promise<string> => {
  const overrides = await fetchMagicPromptOverrides().catch((): Record<string, string> => ({}));
  const override = overrides[id];
  if (typeof override === 'string') {
    return override;
  }
  return getDefaultMagicPromptTemplate(id);
};

export const renderMagicPrompt = async (id: MagicPromptId, variables: Record<string, string> = {}): Promise<string> => {
  const template = await getEffectiveMagicPromptTemplate(id);
  return replaceTemplateVariables(template, variables);
};

export const saveMagicPromptOverride = async (id: MagicPromptId, text: string): Promise<MagicPromptOverridesPayload> => {
  const response = await runtimeFetch(`${API_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error((errorPayload as { error?: string })?.error || 'Failed to save magic prompt');
  }
  const payload = await response.json();
  cachedOverrides = normalizeOverridesPayload(payload);
  return {
    version: typeof payload?.version === 'number' ? payload.version : 1,
    overrides: cachedOverrides,
  };
};

export const resetMagicPromptOverride = async (id: MagicPromptId): Promise<MagicPromptOverridesPayload> => {
  const response = await runtimeFetch(`${API_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error((errorPayload as { error?: string })?.error || 'Failed to reset magic prompt');
  }
  const payload = await response.json();
  cachedOverrides = normalizeOverridesPayload(payload);
  return {
    version: typeof payload?.version === 'number' ? payload.version : 1,
    overrides: cachedOverrides,
  };
};

export const resetAllMagicPromptOverrides = async (): Promise<MagicPromptOverridesPayload> => {
  const response = await runtimeFetch(API_ENDPOINT, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error((errorPayload as { error?: string })?.error || 'Failed to reset all magic prompts');
  }
  const payload = await response.json();
  cachedOverrides = normalizeOverridesPayload(payload);
  return {
    version: typeof payload?.version === 'number' ? payload.version : 1,
    overrides: cachedOverrides,
  };
};
