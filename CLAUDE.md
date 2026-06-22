# 经济学研究工作站

## 环境
- **操作系统**: Windows 10/11
- **Stata 18 MP**: `C:\Program Files\Stata18\StataMP-64.exe`
- **Stata 包装脚本**: `./stata.ps1 job.do -Quiet`
- **Python 环境**: 由 Node.js 子进程调用

## 工作约定
1. 所有生成的数据文件、图表、输出放在本项目文件夹下
2. Stata 任务：写 `.do` → `./stata.ps1 job.do -Quiet` → 读 `.log` 文件获取结果
3. 数据分析默认 Python，用户指定 Stata 时用前者
4. 图表输出带中文字体适配

## 常用命令速查
```powershell
# 执行 Stata do 文件
./stata.ps1 analysis.do -Quiet

# 查看 Stata 日志
Get-Content analysis.log
```
