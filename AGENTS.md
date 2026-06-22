# AGENTS.md — 实证研究 Agent 体系

> 基于「Claude Code 实证研究全流程」视频思路 + 社区最佳实践（ARS/academic-research-skills）提炼。

---

## 一、8 阶段研究流水线

实证研究的标准流程，每个阶段由对应 Agent + Skill 协作完成：

```
Stage 1   Stage 2    Stage 3       Stage 4-5    Stage 6     Stage 7     Stage 8
文献发现 → 缺口定位 → 研究设计 →   构建+执行 → 可视化解读 → 论文撰写 → 审稿修订
  │          │          │           │           │           │           │
  ▼          ▼          ▼           ▼           ▼           ▼           ▼
lit-      lit-       task-        model-      viz-        paper-      paper-
reviewer  reviewer   organizer    runner      maker       polisher    polisher
data-                           data-                    viz-maker
searcher                        cleaner
```

### 各阶段产出物

| 阶段 | Agent | 输入 | 产出 |
|------|-------|------|------|
| 1. 文献发现 | `lit-reviewer` | 研究方向关键词 | `.research/literature-map.md` |
| 2. 缺口定位 | `lit-reviewer` | 文献地图 | `.research/gap-analysis.md` |
| 3. 研究设计 | `task-organizer` | 缺口分析 + 数据 | `.research/empirical-strategy.md` |
| 4. 数据构建 | `data-cleaner` | 原始数据 | `data/clean/` + 清洗报告 |
| 5. 模型执行 | `model-runner` | 清洗数据 + 策略 | `results/tables/` + `results/figures/` |
| 6. 可视化 | `viz-maker` | 回归结果 | 学术规范图表 |
| 7. 论文撰写 | `paper-polisher` | 所有产出 | `manuscript/draft.md` |
| 8. 审稿修订 | `paper-polisher` | 审稿意见 | `manuscript/revision.md` |

---

## 二、Agent 角色定义

### 1. `lit-reviewer` — 文献侦探
- **职责**：搜索文献 → 构建文献地图 → 定位研究缺口
- **调用 Skill**：`literature-review`, `data-search`
- **输出质量闸门**：文献地图必须覆盖 ≥3 个数据库，≤5% 幻觉引用（Semantic Scholar 校验）

### 2. `data-searcher` — 数据猎手
- **职责**：定位可复现的公开/商用数据集
- **调用 Skill**：`data-search`
- **约束**：优先真实数据，模拟数据必须标注 `⚠ SYNTHETIC`

### 3. `task-organizer` — 研究架构师
- **职责**：接收研究缺口 → 设计识别策略 → 拆解任务 → 编排执行顺序
- **调用 Skill**：`task-execution`, `subagent-dispatch`, `mcp-orchestration`
- **关键规则**：
  - 每个任务产出独立可验证
  - 依赖关系明示（DAG 图）
  - 向用户确认关键决策点后再派发

### 4. `data-cleaner` — 数据工兵
- **职责**：合并、清洗、标准化、构造变量
- **调用 Skill**：`data-overview`
- **自动执行的检查**：缺失值报告、异常值检测、类型推断、合并键验证

### 5. `model-runner` — 计量引擎
- **职责**：执行基准回归 → 稳健性检验 → 机制分析 → 异质性分析
- **调用 Skill**：`statistical-modeling`
- **自动化流程**：
  1. 描述统计表
  2. 基准回归（OLS → FE → IV）
  3. 诊断检验报告（异方差、共线性、弱IV、Hausman）
  4. 稳健性检验序列
  5. 系数解读（经济意义 + 统计显著性）

### 6. `viz-maker` — 图表工匠
- **职责**：学术规范图表
- **调用 Skill**：`data-viz`
- **标准**：中文字体自动适配、高清导出（PNG/PDF/SVG）

### 7. `paper-polisher` — 论文打磨师
- **职责**：写初稿 → 润色 → 格式检查 → 审稿回复
- **调用 Skill**：`paper-polish`, `literature-review`
- **规范**：Cochrane 主动语态、LaTeX 结构、显著性标记（`***`/`**`/`*`）

---

## 三、项目制科研管理

### 标准项目结构

```
project-root/
├── .research/              # 研究状态 manifest（跨会话持久化）
│   ├── state.json          # 当前进度：{stage, last_agent, checkpoint_passed}
│   ├── literature-map.md   # 文献地图
│   ├── gap-analysis.md     # 缺口分析
│   └── empirical-strategy.md # 识别策略
├── .paper/                 # 论文 manifest
│   ├── claims.yaml         # 可验证的论文主张
│   └── figures.yaml        # 图表清单
├── data/                   # 数据（不可变）
│   ├── raw/                #   原始数据，永不修改
│   └── clean/              #   清洗后数据
├── code/                   # 代码（可复现）
│   ├── 01_clean.py
│   ├── 02_describe.py
│   ├── 03_regression.py
│   └── 04_viz.py
├── results/                # 结果
│   ├── tables/
│   └── figures/
└── manuscript/             # 手稿
    ├── draft.md
    └── revision.md
```

### Manifest 持久化规则

1. **每个阶段结束时** → 更新 `.research/state.json`
2. **切换会话** → 先读 `.research/state.json` 恢复上下文
3. **跨 Agent 产物** → 用 YAML Schema 约束，确保下游可解析

---

## 四、质量闸门系统

三道不可跳过的检查点，参考 Nature AI 7 项失败模式：

| 闸门 | 位置 | 检查内容 | 通过条件 |
|------|------|----------|----------|
| **Gate 1** | Stage 2.5 | 缺口真实性 | 文献地图覆盖 ≥3 数据库 + ≤5% 幻觉引用 |
| **Gate 2** | Stage 4.5 | 数据完整性 | 缺失率 <5% + 异常值已标注 + 变量构造可复现 |
| **Gate 3** | Stage 7.5 | 结论可靠性 | 稳健性 ≥2 种方法通过 + 系数方向一致 + 无过拟合迹象 |

---

## 五、Agent 调度规则

### 并行 vs 串行

```
可并行：                    必须串行：
lit-reviewer ─┬─→ ...      data-cleaner → model-runner → viz-maker
data-searcher ─┘            （数据→模型→图表，依赖链）
（文献和数据搜索独立）

paper-polisher  ← 所有上游完成后再启动
```

### 人机协作节点

以下决策点**必须**确认后再继续：
1. **研究设计**（Stage 3 结束）：识别策略是否可行？
2. **基准结果**（Stage 5 结束）：系数方向和显著性是否符合预期？
3. **论文初稿**（Stage 7 结束）：结构和论证是否需要调整？

---

## 六、Agent 配置速查

```yaml
agents:
  lit-reviewer:    { skill: literature-review, gate: 1 }
  data-searcher:   { skill: data-search }
  task-organizer:  { skill: [task-execution, subagent-dispatch] }
  data-cleaner:    { skill: data-overview, gate: 2 }
  model-runner:    { skill: statistical-modeling }
  viz-maker:       { skill: data-viz }
  paper-polisher:  { skill: [paper-polish, literature-review], gate: 3 }
```

---

## 参考来源

- 「Claude Code 实证研究全流程讲解」BV14kRjBcEqP
- [ai-research-skills](https://github.com/WenyuChiou/ai-research-skills) — 15-skill 8-stage catalog
- [academic-research-skills](https://github.com/Imbad0202/academic-research-skills) — 6.4k★ ARS
- [luwill/research-skills](https://github.com/luwill/research-skills) — 多 Agent 综述系统
- [Anthropic: Agentic Coding & Expertise](https://www.anthropic.com/research/claude-code-expertise)
- 朱晨「Claude Code 科研手记」
