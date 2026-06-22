# 时间序列分析

> 时间序列数据在经济金融中广泛应用：GDP增长、通胀、股价、汇率等。
> 核心特征：观测值之间不独立，存在序列相关。

---

## 1. 前置检验

### 平稳性检验

在建模前必须做单位根检验，否则可能伪回归。

| 检验 | 适用 | H0 | 说明 |
|---|---|---|---|
| ADF检验 | 单变量 | 存在单位根 | 最常用 |
| PP检验 | 单变量 | 存在单位根 | 允许异方差 |
| KPSS检验 | 单变量 | 序列平稳 | ADF的互补 |
| DF-GLS | 单变量 | 存在单位根 | 功效更高 |

Python:
```python
from statsmodels.tsa.stattools import adfuller, kpss

# ADF检验
adf_result = adfuller(series, maxlag='AIC')
print(f'ADF统计量: {adf_result[0]}, p值: {adf_result[1]}')

# KPSS检验
kpss_result = kpss(series, regression='c')
print(f'KPSS统计量: {kpss_result[0]}, p值: {kpss_result[1]}')
```

### 差分阶数确定
- 如果非平稳 → 取一阶差分 → 再次检验
- 一阶差分后平稳 → I(1)
- 二阶差分后平稳 → I(2)

## 2. 模型选择框架

```
时间序列
    │
    ▼
平稳性检验
    │
    ├─ 单变量平稳
    │   ├─ ARMA(p,q)
    │   └─ ARIMA(p,1,q) ← 如果差分后平稳
    │
    └─ 多变量
        ├─ 同阶单整 → 协整检验 → VECM 或 VAR
        └─ 非同阶单整 → 差分后 VAR
```

### ARIMA(p,d,q)

| 参数 | 含义 | 识别 |
|---|---|---|
| p | 自回归阶数 | PACF在p阶后截尾 |
| d | 差分阶数 | 单位根检验确定 |
| q | 移动平均阶数 | ACF在q阶后截尾 |

### 模型诊断
```python
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
from statsmodels.tsa.arima.model import ARIMA
import matplotlib.pyplot as plt

# 拟合
model = ARIMA(series, order=(1,1,1))
result = model.fit()

# 残差诊断
result.plot_diagnostics()
plt.tight_layout()

# Ljung-Box检验（残差是否为白噪声）
from statsmodels.stats.diagnostic import acorr_ljungbox
lb = acorr_ljungbox(result.resid, lags=[10])
```

## 3. 协整与VECM

如果两个或多个 I(1) 变量存在协整关系（长期均衡关系）：
- **Engle-Granger两步法**：适用于两个变量
- **Johansen检验**：适用于多个变量
- 协整存在 → 用 VECM（误差修正模型）
- 协整不存在 → 差分后 VAR

## 4. 预测与评估

| 指标 | 公式 | 说明 |
|---|---|---|
| MSE | mean((y - y_hat)²) | 均方误差 |
| RMSE | sqrt(MSE) | 均方根误差 |
| MAE | mean(|y - y_hat|) | 平均绝对误差 |
| MAPE | mean(|(y-y_hat)/y|) | 平均绝对百分比误差 |

## 5. 常见陷阱

| 陷阱 | 表现 | 避免方法 |
|---|---|---|
| 伪回归 | R²高，t统计量显著但无经济意义 | 先做单位根检验 |
| 数据透视 | 过度优化样本内，预测差 | 留出检验集 |
| 结构突变 | 模型在某个时点后失效 | 做Chow检验，分段建模 |
| 季节效应 | 季节性波动被误认为周期 | 做季节调整（X-13ARIMA） |
| 预测区间过窄 | 低估不确定性 | 用模拟或bootstrap |

## 6. Stata 命令速查

```stata
* 设定时间序列
tsset datevar, monthly

* 单位根检验
dfuller y, lags(4)
dfuller y, trend lags(4)
pperron y

* 自相关图
ac y, lags(20)
pac y, lags(20)

* ARIMA
arima y, arima(p,d,q)
arima y, ar(1) ma(1)

* 残差诊断
predict res, residuals
wntestq res, lags(10)

* VAR
varsoc y x         // 确定滞后阶数
var y x, lags(1/4) // 估计VAR
varbasic, impulse  // 脉冲响应
```
