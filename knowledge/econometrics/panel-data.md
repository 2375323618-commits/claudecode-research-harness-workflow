# 面板数据模型

> 面板数据（Panel Data）是应用经济学最常用的数据结构之一。同时包含截面个体和时间维度。

---

## 1. 数据类型

| 类型 | 说明 | 处理方式 |
|---|---|---|
| 平衡面板 | 每个个体每期都有数据 | 直接用 |
| 非平衡面板 | 部分个体部分时期缺失 | 检查缺失机制，直接使用（大多数模型支持） |
| 长面板 | T > N（时间维度长） | 注意时序相关性 |
| 短面板 | N > T（截面维度大） | 常见于微观面板 |

## 2. 模型选择流程

```
面板数据
    │
    ▼
[混合OLS vs 固定效应/随机效应]
    │
    ├─ F检验 → H0: 混合OLS可接受
    │   └─ 不拒绝 → 混合OLS（简单）
    │
    ├─ Hausman检验 → H0: 随机效应一致
    │   ├─ 不拒绝 → 随机效应（RE）
    │   └─ 拒绝 → 固定效应（FE）
    │
    └─ BP-LM检验 → H0: 无个体效应
        └─ 不拒绝 → 混合OLS（简单）
```

### 固定效应（FE）
- 移除个体间不随时间变化的异质性
- 适用于只关心随时间变化的变量影响
- **缺点**：不能估计不随时间变化的变量（如性别、行业）
- **扩展**：双向固定效应（个体+时间）

### 随机效应（RE）
- 假设个体效应与解释变量不相关
- 可以用GLS估计
- **优点**：可以估计不随时间变化的变量
- **缺点**：一致性依赖RE假设成立

## 3. 诊断检验

| 检验 | 用途 | 命令（Python statsmodels） |
|---|---|---|
| F检验 | 混合 vs FE | `compare_f_test()` |
| Hausman | FE vs RE | `compare_hausman()` |
| BP-LM | 混合 vs RE | `breusch_pagan_lm()` |
| 组内序列相关 | Wooldridge检验 | `specification.wooldridge_serial()` |
| 组间异方差 | Wald检验 | `compare_wald()` |

## 4. 常见问题与处理

| 问题 | 表现 | 处理 |
|---|---|---|
| 截面相关 | 不同个体残差相关 | Driscoll-Kraay标准误 |
| 组内自相关 | 个体内残差序列相关 | 聚类标准误 |
| 异方差 | 不同个体方差不同 | 聚类稳健标准误 |
| 多重共线性 | VIF > 10 | 删除相关变量 |

## 5. 常用模型扩展

| 模型 | 适用场景 | 关键点 |
|---|---|---|
| 双向固定效应 | 控制个体+时间效应 | 需要足够的时间变化 |
| 个体时点趋势 | 控制个体特有的时间趋势 | 消耗自由度多 |
| 一阶差分FE | 强序列相关时 | 信息损失 |
| Heckman两步法 | 面板选择偏误 | 需要排他变量 |
| 动态面板（GMM） | 包含滞后因变量 | 需要工具变量 |

## 6. Stata 命令速查

```stata
* 设定面板
xtset id year

* 描述性统计
xtsum y x1 x2

* 混合OLS
reg y x1 x2

* 固定效应
xtreg y x1 x2, fe

* 随机效应
xtreg y x1 x2, re
xtreg y x1 x2, re vce(cluster id)

* Hausman检验
hausman fe re

* 双向固定效应
xtreg y x1 x2 i.year, fe

* 交互项
xtreg y c.x1##c.x2, fe

* 聚类标准误
xtreg y x1 x2, fe vce(cluster id)
```

## 7. Python 代码框架

```python
import statsmodels.api as sm
import pandas as pd
from linearmodels.panel import PanelOLS, RandomEffects

# 准备数据
df = pd.read_csv("data/panel_data.csv")
df = df.set_index(['id', 'year'])  # 个体索引在前

# 固定效应
fe = PanelOLS.from_formula('y ~ x1 + x2 + EntityEffects', data=df)
fe_results = fe.fit(cov_type='clustered', cluster_entity=True)
print(fe_results)

# 随机效应
re = RandomEffects.from_formula('y ~ x1 + x2', data=df)
re_results = re.fit(cov_type='clustered', cluster_entity=True)
print(re_results)
```
