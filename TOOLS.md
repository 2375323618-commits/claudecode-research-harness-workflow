# TOOLS.md - 环境与工具配置

> 记录小马工作站的工具链配置，OpenClaw 调度时参考。

---

## 🤖 Claude Code

| 项目 | 内容 |
|---|---|
| 版本 | 2.1.170 (Claude Code) |
| 路径 | `C:\Program Files\ClaudeCode\claude.exe` |
| 认证 | ✅ 已登录（OAuth，第一方 API） |
| CLI 调用 | `claude -p "你的指令"`（非交互模式，用于 OpenClaw 调度） |

### 常用调度命令

```powershell
# 单次任务（非交互，返回结果）
claude -p "分析这个数据文件并生成报告"

# 指定模型
claude -p "任务" --model sonnet

# 指定工作目录
cd C:\path\to\project && claude -p "任务"

# 附加系统提示
claude -p "任务" --append-system-prompt "你是经济学研究助手"

# 跳过权限确认（本地可信环境）
claude -p "任务" --dangerously-skip-permissions
```

### 使用原则

- **绝大多数任务**：`claude -p "指令" --dangerously-skip-permissions`
- **涉及隐私数据/系统修改**：不加 `--dangerously-skip-permissions`，先问小马
- 隐私数据的判断：小马的研究数据、论文草稿、个人凭证、系统配置变更

## 🐍 Python 环境

| 项目 | 内容 |
|---|---|
| 版本 | Python 3.11.15 |
| 路径 | 系统 PATH 中 |

### 已安装关键包

| 包 | 版本 | 用途 |
|---|---|---|
| pandas | 3.0.3 | 数据处理 |
| statsmodels | 0.14.6 | 统计建模 |
| matplotlib | 3.11.0 | 基础可视化 |
| seaborn | 0.13.2 | 统计图表 |
| plotly | — | 交互式图表（需安装） |
| scikit-learn | 1.6.1 | 机器学习 |
| scipy | 1.17.1 | 科学计算 |
| openpyxl | 3.1.5 | Excel 读写 |
| xlsxwriter | 3.2.9 | Excel 写入 |
| fastapi | 0.133.1 | API 服务搭建 |
| openai | 2.24.0 | OpenAI API 调用 |

> plotly 未安装，如需交互式图表可以 `pip install plotly`

## 📊 Stata

| 项目 | 内容 |
|---|---|
| 版本 | Stata 18 (MP) |
| 路径 | `C:\Program Files\Stata18\StataMP-64.exe` |
| CLI 模式 | `StataMP-64.exe /e do script.do` |

### Stata 调度示例
```powershell
# 批处理模式运行 do 文件
& "C:\Program Files\Stata18\StataMP-64.exe" /e do analysis.do

# 带日志输出
& "C:\Program Files\Stata18\StataMP-64.exe" /e do analysis.do /o output.log
```

## 🖥️ 其他已安装工具

| 工具 | 版本 | 路径 | 作用 |
|---|---|---|---|
| **Cursor** | 3.7.21 | `C:\Users\admin\AppData\Local\Programs\cursor` | AI 原生编辑器，内置 AI 对话+代码补全 |
| **Opencode** | 1.17.4 | `C:\Users\admin\AppData\Roaming\npm\opencode.ps1` | 开源 coding agent CLI，Claude Code 替代品 |
| **Git** | — | `C:\Program Files\Git\cmd\git.exe` | 版本控制 |
| **Node.js** | — | `C:\Program Files\nodejs\node.exe` | JavaScript 运行时 |
| **Miniconda** | — | `C:\Users\admin\miniconda3` | Python 环境管理 |
| **Claude Desktop** | — | `C:\Users\admin\AppData\Local\Claude` | Claude 桌面版 |
| **WSL** | — | `C:\Windows\system32\wsl.exe` | Linux 子系统 |
| **npm** | — | 系统 PATH | Node 包管理器 |

### 各工具在 AI 工作流中的作用

| 工具 | 在 AI 工作流中的角色 |
|---|---|
| **Claude Code** | ⭐ 主力 coding agent。负责写代码、跑模型、做复杂分析。由 OpenClaw 通过 CLI 调度（非交互模式） |
| **Cursor** | 当需要手动写/改代码时使用。AI 内嵌编辑器，写代码时自动补全/对话 |
| **Opencode** | Claude Code 的开源替代。如果 Claude Code 遇到问题可以切过来试 |
| **Git** | 版本控制，所有项目文件进 git，方便回滚和协作 |
| **Node.js** | Claude Code 运行依赖；后续可能用于搭建 API 服务 |
| **Miniconda** | Python 环境管理器。可以创建隔离的 Python 环境避免包冲突 |
| **WSL** | 如果需要 Linux 环境（有些 Stata/Python 包 Windows 不支持） |

## 💻 云电脑基本信息

| 项目 | 内容 |
|---|---|
| 操作系统 | Windows Server 2022 / Windows 10+ |
| Shell | PowerShell |
| 工作区 | C:\Users\admin\.openclaw\workspace |
