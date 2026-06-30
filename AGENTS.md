# AGENTS.md V1.1

## Purpose

This document defines a general project record system for AI-assisted work.

The record system should preserve:

- current project state
- task history
- major decisions
- handoff context for the next human or AI agent

Keep this document as a record rule file. Do not turn it into a project README.

## Core Model

```text
PROGRESS.md = 当前状态
ITERATION_LOG.md = 历史过程
DECISIONS.md = 重大决策
AGENTS.md = 记录规则
```

## Required Record Files

If the following files do not exist, create them:

```text
PROGRESS.md
ITERATION_LOG.md
DECISIONS.md
```

## Timestamp Rule

All record entries must keep minute-level timestamps.

Required format:

```text
YYYY/MM/DD HH:mm
```

Example:

```text
2026/06/28 13:22
```

Optional human-readable marker:

```text
2026/06/28 13:22 (PM)
```

Rules:

- Do not downgrade records to date-only timestamps.
- Do not omit hour and minute.
- AM / PM may be added as a human marker, but must not replace the 24-hour timestamp.
- Use the local timezone unless the repository explicitly specifies another timezone.

## AI Handoff Read Order

When taking over a project, read in this order:

1. `AGENTS.md`
2. `PROGRESS.md`
3. `DECISIONS.md`
4. Recent entries in `ITERATION_LOG.md` only when necessary

For retrospective work, read the full `ITERATION_LOG.md` and relevant `DECISIONS.md` entries.

## PROGRESS.md

`PROGRESS.md` is the current project status board.

It should be updated after each task, not appended as historical timeline.

It should answer:

- last updated
- current stage
- active version / mode
- recently completed work
- current limitations
- next recommended step
- handoff notes

Do not use `PROGRESS.md` as a project introduction. Project introduction belongs in `README.md`.

## ITERATION_LOG.md

`ITERATION_LOG.md` is the historical task ledger.

Append one new entry after each task. Do not rewrite old entries unless explicitly requested.

Each entry should include:

- timestamp
- task type
- task goal
- changes made
- files changed
- verification status
- status after task
- rationale / 当时判断
- remaining issues
- next step
- major decision status

If no major decision was made, write:

```text
Major decision: none
```

### Task Types

Use one of these general task types:

```text
research
planning
implementation
content
correction
refactor
test
release
archive
retrospective
```

Meanings:

- `research`: reading, investigation, comparison, source review.
- `planning`: scope, task breakdown, workflow planning.
- `implementation`: code, feature, script, or concrete build work.
- `content`: docs, writing, prompts, design materials, examples.
- `correction`: fixing wrong assumptions, wording, data, or behavior.
- `refactor`: restructuring without changing the intended outcome.
- `test`: verification, experiments, output checks, validation.
- `release`: commit, publish, deploy, package, handoff delivery.
- `archive`: freeze, backup, cleanup, or move old work out of active scope.
- `retrospective`: review, summary, knowledge extraction, project learning.

## DECISIONS.md

`DECISIONS.md` is the major decision index.

Append only when a major product, workflow, or technical decision is made.

Each decision entry should include:

- timestamp
- decision
- reason or context
- expected impact
- status: `active` / `superseded` / `archived`
- supersedes: optional
- outcome: optional

Major decisions include:

- changing the project direction
- adding or removing a major feature
- changing the technical approach
- changing the record system
- changing the data source strategy
- changing the safety boundary
- introducing a new dependency or permission
- archiving or freezing a major project phase

If no major decision was made, do not append to `DECISIONS.md`.
Instead, write `Major decision: none` in the `ITERATION_LOG.md` entry.

## General Rules

- Records should be concise and factual.
- Reports should be written in the project's working language unless the user requests otherwise.
- Documentation content should be written bilingually in Chinese and English unless the user requests otherwise.
- 文档内容应使用中文和英文双语编写，除非用户另有要求。
- If a mature open-source solution exists on GitHub, npm, or another trusted package/source ecosystem, reuse it directly when it fits the project constraints instead of reimplementing it.
- 如果 GitHub、npm 或其他可信开源生态中已有成熟方案，并且符合项目约束，应优先直接复用，不要重复造轮子。
- When analyzing bugs, start from first principles before choosing a fix.
- 分析 bug 的时候，要从第一性原理出发，再决定修复方式。
- Do not read `ITERATION_LOG.md` unless necessary; by default, append new entries without rereading old ones.
- 非必要不要读取 `ITERATION_LOG.md`；默认直接追加新记录，不回读旧内容。
- Prefer reusable record structure over project-specific wording.
- Preserve why a decision was made, not only what changed.
- Do not rewrite history unless explicitly requested.
