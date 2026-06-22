# TOOLS.md — 研究工具链

> 12 个 Skill + Python/Stata/API 调度 + 数据管道 + 环境配置。保持可复现。

---

## 一、Skill 架构总览

```
                    ┌── task-execution ──┐
                    │ subagent-dispatch  │ ← 编排层
                    │ mcp-orchestration  │
                    └────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   [数据层]              [分析层]              [产出层]
        │                     │                     │
  data-search           data-overview          data-viz
  literature-review     statistical-modeling   paper-polish
  exam-prep             policy-analysis        iterative-refinement
  ai-tools-dispatch
```

### 三层架构

| 层 | Skill | 职责 |
|----|-------|------|
| **编排层** | `task-execution`, `subagent-dispatch`, `mcp-orchestration` | 任务拆解、并行调度、外部 MCP 协调 |
| **数据层** | `data-search`, `literature-review`, `data-overview` | 数据发现、文献检索、质量报告 |
| **分析层** | `statistical-modeling`, `policy-analysis` | 建模、推断、政策评估 |
| **产出层** | `data-viz`, `paper-polish`, `iterative-refinement` | 图表、论文、迭代精修 |
| **辅助层** | `exam-prep`, `ai-tools-dispatch` | 备考、AI 工具选型 |

---

## 二、工具调度决策树

```
任务类型判断
│
├─ 数据清洗/预处理  → Python (pandas)           [data-cleaner Agent]
├─ 描述统计/EDA     → Python (pandas+seaborn)   [data-cleaner Agent]
├─ OLS/面板/IV      → Python (statsmodels) 首选  [model-runner Agent]
│                     Stata 备选（用户明确要求时）
├─ 时间序列 ARIMA   → Python (statsmodels)       [model-runner Agent]
├─ GARCH/波动率     → Python (arch)              [model-runner Agent]
├─ Logit/Probit     → Python (statsmodels)       [model-runner Agent]
├─ DID/RDD/PSM/SCM  → Python (linearmodels)      [model-runner Agent]
├─ 协整/VECM/VAR    → Python (statsmodels)       [model-runner Agent]
├─ SEM/空间计量     → Python (semopy/spreg)      [model-runner Agent]
├─ 图表输出         → Python (matplotlib)        [viz-maker Agent]
└─ 论文表格导出     → Python → CSV/Excel/LaTeX   [paper-polisher Agent]
```

### Python 优先规则

- 默认 `statsmodels` / `linearmodels` / `arch`
- 仅在以下情况用 Stata：
  1. 用户明确说「用 Stata」
  2. Stata 命令在 Python 无等价包（如 `xtabond2` 可用 `linearmodels` 替代）
  3. 用户提供的 `.do` 文件已有复杂逻辑

### Stata 执行流程

```
写 .do 文件 → ./stata.ps1 job.do -Quiet → 读 .log 文件取结果
```

---

## 三、Skill 间集成点

### 数据流契约

```
data-search → data-overview
  │ 产出: 数据源 URL/API/路径
  └→ 输入: 原始数据文件
                │
                ▼
data-overview → statistical-modeling
  │ 产出: 清洗后数据 + 质量报告
  └→ 输入: clean_df + codebook
                │
                ▼
statistical-modeling → data-viz → paper-polish
  │ 产出: 回归结果表 + 诊断统计量
  └→ 输入: 系数矩阵 + 拟合值
```

### 跨 Skill 数据格式

| 传递物 | 格式 | Schema |
|--------|------|--------|
| 数据源清单 | JSON | `{name, url, format, access_date, notes}` |
| 变量字典 | Markdown table | `{variable, type, source, description}` |
| 回归结果 | Python dict → JSON | `{coef, se, t, p, ci_low, ci_high, stars}` |
| 图表规格 | Python dict | `{type, data, title, xlabel, ylabel, note}` |

---

## 四、环境配置

### Python

```python
# 核心包
import pandas as pd
import numpy as np
import statsmodels.api as sm          # OLS, Logit, GLM
import statsmodels.formula.api as smf # R-style formula
from linearmodels import PanelOLS, RandomEffects, IV2SLS
from arch import arch_model           # GARCH
from scipy import stats               # 统计检验
import matplotlib.pyplot as plt
import seaborn as sns
```

### Stata

```
$STATAMP = "C:\Program Files\Stata18\StataMP-64.exe"
$STATA_WRAPPER = "./stata.ps1"   # PowerShell 包装脚本
```

### 中文字体（图表）

```python
import matplotlib.font_manager as fm
# 自动检测: SimHei → Microsoft YaHei → fallback
fonts = [f.name for f in fm.fontManager.ttflist if any(
    keyword in f.name for keyword in ['SimHei', 'YaHei', 'Songti']
)]
plt.rcParams['font.sans-serif'] = [fonts[0]] if fonts else ['sans-serif']
plt.rcParams['axes.unicode_minus'] = False
```

### API 代理

```
claude_proxy/server.js  →  DeepSeek API 代理 (PORT 15721)
                       →  环境变量 DEEPSEEK_API_KEY 读取密钥
```

---

## 五、新增 Skill 规范

添加新 Skill 时遵循：

1. **目录结构**：`skills/<skill-name>/SKILL.md`
2. **命名**：kebab-case，动词优先（如 `data-search`），领域特定则加前缀
3. **SKILL.md 最低内容**：
   - `## 触发条件` — 何时激活
   - `## 输入` — 需要的参数/文件
   - `## 输出` — 产出物格式
   - `## 工具链` — 调用的 Python 包 / Stata 命令
   - `## 示例` — 至少一个完整示例

---

## 六、工作目录约定

| 目录 | 用途 | 权限 |
|------|------|------|
| `data/raw/` | 原始数据 | 只读 |
| `data/clean/` | 清洗后数据 | Agent 写入 |
| `code/` | 分析代码 | Agent 生成，可复现 |
| `results/tables/` | 回归表 | 自动导出 CSV/Excel |
| `results/figures/` | 图表 | 自动导出 PNG/PDF |
| `manuscript/` | 手稿 | paper-polisher 读写 |
| `.research/` | 研究状态 | 跨会话持久化 |
| `memory/` | 长期记忆 | 手动维护 |

---

## 参考来源

- [ARS (6.4k★)](https://github.com/Imbad0202/academic-research-skills) — Skill 编排 + 引用核验体系
- [ai-research-skills](https://github.com/WenyuChiou/ai-research-skills) — 15-skill 目录 + 3-gate 决策
- [Anthropic: Claude Code Expertise Study](https://www.anthropic.com/research/claude-code-expertise) — 专家 vs 新手效能
