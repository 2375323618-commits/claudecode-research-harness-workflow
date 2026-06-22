# 诊断检验清单

> 回归分析后必须跑的诊断检验。不同模型有不同检验要求。

---

## 1. OLS 基准回归

| 检验 | 检验什么 | 命令/方法 | 处理 |
|---|---|---|---|
| **异方差** | Var(ε) 是否恒定 | Breusch-Pagan / White 检验 | 聚类稳健标准误 / HC标准误 |
| **多重共线性** | X之间是否高度相关 | VIF（方差膨胀因子） | VIF > 10 说明存在严重共线性；删除或合并变量 |
| **正态性** | ε是否正态 | J-B检验 / Q-Q图 | 大样本下不是必须的 |
| **拟合优度** | 模型解释力 | R² / adjusted R² | 面板R²看within R² |
| **整体显著性** | 模型是否显著 | F检验 | p < 0.05 |

```python
# 异方差检验（Breusch-Pagan）
from statsmodels.stats.diagnostic import het_breuschpagan
bp_test = het_breuschpagan(results.resid, results.model.exog)
print(f'BP统计量: {bp_test[0]}, p值: {bp_test[1]}')

# VIF
from statsmodels.stats.outliers_influence import variance_inflation_factor
vif = [variance_inflation_factor(X.values, i) for i in range(X.shape[1])]
```

## 2. 面板模型

| 检验 | 检验什么 | 何时做 | 处理 |
|---|---|---|---|
| **F检验** | 混合 vs FE | 每次面板回归 | 拒绝→用FE |
| **Hausman** | FE vs RE | FE回归后 | 拒绝→用FE |
| **BP-LM** | 混合 vs RE | RE回归后 | 拒绝→用RE |
| **Wooldridge序列相关** | 组内自相关 | 短面板（T≥3） | 聚类标准误 |
| **Wald组间异方差** | 组间方差不同 | 长面板 | 聚类标准误 |
| **截面相关** (Pesaran CD) | 个体间相关 | 长面板（T≥N） | Driscoll-Kraay标准误 |

## 3. 时间序列

| 检验 | 检验什么 | 何时做 | 处理 |
|---|---|---|---|
| **ADF/PP** | 单位根（平稳性） | 建模前必须做 | 差分 |
| **KPSS** | 平稳性（互补） | ADF检验后 | 确认ADF结果 |
| **Ljung-Box Q** | 残差自相关 | ARIMA建模后 | 调整p,q阶数 |
| **Jarque-Bera** | 残差正态性 | 任何时序模型 | 大样本不必须 |
| **ARCH-LM** | 条件异方差 | 金融时间序列 | 用GARCH |
| **Chow检验** | 结构突变 | 怀疑有断点时 | 分段建模 |
| **Johansen** | 协整关系 | 多变量I(1) | 用VECM |
| **Granger因果** | 预测关系 | VAR建模后 | 调整模型 |

## 4. Logit/Probit

| 检验 | 检验什么 | 处理 |
|---|---|---|
| **Hosmer-Lemeshow** | 拟合优度 | p > 0.05 拟合好 |
| **McFadden R²** | 伪R² | > 0.2 较好 |
| **混淆矩阵** | 预测准确率 | 看敏感度/特异度 |
| **ROC/AUC** | 区分能力 | AUC > 0.7 可接受 |
| **VIF** | 共线性（同上） | VIF > 10 处理 |

## 5. 快速决策表

```
模型跑完后，按这个顺序检查：

OLS:    异方差 → 多重共线性 → 系数符号 → 显著性
面板:   Hausman → 序列相关 → 截面相关 → 系数
时间序列: 平稳性 → 残差白噪声 → 预测检验 → 稳定性
IV:     第一阶段F → 过度识别 → 弱IV → 系数
Logit:  拟合优度 → 混淆矩阵 → 边际效应
```
