# CLAUDE.md — Claude Code Instructions for Research Agent Harness

Read `AGENTS.md` first for the full operating model and role boundaries.

This file contains Claude Code-specific rules for empirical research projects.

---

## 1. Work Scope

### What You Do

- Write R, Stata, or Python scripts based on the approved `analysis_plan.md`
- Save scripts to `scripts/` or `analysis/<task>/scripts/`
- Run scripts and save logs to `logs/` or `analysis/<task>/logs/`
- Save cleaned/processed data to `data/processed/` or `data/intermediate/`
- Save tables and figures to `output/` or `analysis/<task>/output/`
- Populate `analysis_plan.md` with evidence paths after each completed task
- Fill in report templates under `reports/`

### What You Must Not Do

- **Never write to `data/raw/`** — this is an absolute prohibition, no exceptions
- **Never invent or estimate numbers** — every coefficient, p-value, sample size, or percentage must come from an actual script run with a log
- **Never mark a task `cc:done`** without verifying a log file exists at the documented path
- **Never use absolute file paths** in scripts — always use paths relative to the project root
- **Never claim a merge is complete** without producing a `merge_report.md` entry with pre/post row counts
- **Never silently drop observations** — every filter must be logged with the reason and count

---

## 2. Script Standards

All scripts must:

- Begin with a header comment: project name, task ID, date, author (Claude Code)
- Use project-relative paths only (e.g., `data/raw/households.csv`, not `/Users/...`)
- Log all operations to a file (not just to stdout)
- Exit with a non-zero code on error so failures are visible in logs
- Be deterministic: same inputs → same outputs (set random seeds if needed)

### Language-specific conventions

**R:** Use `sink()` or `tee` for logs; `here::here()` for paths; `set.seed()` for randomness.

**Stata:** Use `log using`, `quietly`, and `assert` for verification; relative paths via `cd` at script top set once.

**Python:** Use `logging` module to file; `pathlib.Path` for paths; `random.seed()` / `numpy.random.seed()` for reproducibility.

---

## 3. Commit Convention

```
audit:   data audit report for <dataset>
clean:   cleaning script for <task> — N obs in, M obs out
plan:    analysis plan for <study>
analysis: <task-id> <description> — script ran, log saved
review:  review report — APPROVE / REQUEST_CHANGES
release: replication package v<version>
```

---

## 4. Escalation Rules

If a script fails, follow this path:

1. Read the log. Identify the error.
2. Fix the script. Re-run. Save new log.
3. If it fails a second time: check whether the raw data supports the operation. Document what is missing.
4. If it fails a third time: **stop**. Write an infeasibility note in `analysis_plan.md` under the task. Mark the task `cc:infeasible`. Do not invent output or work around a data limitation silently.

**Never** present fabricated or estimated output as if a script produced it.

---

## 5. Data Cleaning Rules

When running `/research-harness-clean`:

- Read source files only from `data/raw/`
- Write output only to `data/processed/` or `data/intermediate/`
- Every dropped observation: log the filter condition and the count dropped
- Every merge: fill in `merge_report.md` — keys, left count, right count, post-merge count, unmatched counts
- If merge keys are ambiguous or missing: stop, document the problem, and ask the user for clarification
- If two source files contain overlapping variables with different values: report the conflict, do not silently choose one

---

## 6. Task Completion Report（任务完成报告）

**每次任务完成后，必须生成一份中文报告**，保存到 `reports/` 目录，文件名格式为 `report_<task-slug>_<YYYYMMDD>.md`。

报告必须包含以下章节：

| 章节 | 内容 |
|------|------|
| **任务背景** | 任务目标、触发原因、数据或问题描述 |
| **执行过程** | 按步骤列出做了什么，包括脚本名、输入输出、关键参数 |
| **关键结果** | 数量统计（行数、列数、匹配率等）均须来自日志，不得估算 |
| **数据质量说明** | 跳过/合并的文件、缺失率、已知问题 |
| **输出文件清单** | 每个输出文件的路径、行数、列数（来自日志） |
| **证据链** | 每个关键数字对应的脚本路径 → 日志路径 |
| **待办/遗留问题** | 本次未解决或需下一步跟进的事项 |

**报告规则：**
- 全文中文
- 所有数字必须可追溯到日志文件，不得凭记忆填写
- 报告本身不包含任何数据内容（无行内数据、无样本记录）
- 报告完成后提交到 git（`git add reports/report_*.md`）

---

## 7. Data Protection and Version Control

The following directories contain survey microdata or derived individual-level data and are subject to data protection requirements. They **must never be committed to git or pushed to any remote repository (including GitHub)**:

| Directory | Reason |
|-----------|--------|
| `input/data/` | Raw CHNS survey microdata — licensed, individual-level |
| `data/raw/` | Raw data mirror — same protection as above |
| `data/intermediate/` | Derived individual-level datasets during processing |
| `data/processed/` | Final merged panel and codebook — individual-level |
| `logs/` | May contain row counts and identifiers from data runs |

These paths are listed in `.gitignore`. Do not remove them from `.gitignore` under any circumstance.

**Enforcement rules for Claude Code:**

- **Never `git add`** any file under the above directories, even if explicitly asked
- **Never commit** `chns_merged_panel.csv`, `chns_codebook.csv`, or any `.parquet` file
- **Never push** data files to any remote; if a user asks, explain the data protection requirement and refuse
- Before any `git add .` or `git add -A`, verify no data files are staged
- Replication packages (for sharing) include **scripts and reports only** — never the data itself

---

## 8. Research Integrity Rules

Full canonical list: [`docs/INTEGRITY-RULES.md`](docs/INTEGRITY-RULES.md)

Short reference:

1. Never modify `data/raw/`
2. Never fabricate results, citations, sample sizes, coefficients, p-values, or robustness checks
3. Never claim an analysis ran without a corresponding script and log on disk
4. Never silently drop observations
5. Always use project-relative paths
6. Mark all causal claims with identification strength: `[descriptive]` / `[correlational]` / `[quasi-experimental: DiD/IV/RD]` / `[experimental]`
7. If data are insufficient, stop and report infeasibility — never invent a workaround
8. Every merge must report pre/post row counts, match rates, and duplicate diagnostics
9. If merge keys are ambiguous or missing, stop and ask — never guess
10. Preserve an evidence trail for every table, figure, and number: script path + log path + output path
11. Keep code execution separate from narrative interpretation

---

## 9. Survey Microdata Pipeline — Engineering Rules

Lessons distilled from CHNS (2026-05-29) and CHARLS (2026-06-02) pipeline runs. Apply these rules to any new survey dataset pipeline.

### 9.1 Codebook Requirements

**Every codebook CSV must include a `description` column** populated from the source data's native variable labels.

- For Stata `.dta` files: read labels via `pyreadstat` metadata — `meta.column_labels` (list aligned with `meta.column_names`)
- Write a dedicated enrichment script (e.g., `*_08_enrich_codebook.py`) that scans all raw `.dta` files with `metadataonly=True` and back-fills descriptions into the codebook after export
- Pipeline-derived columns (e.g., `WAVE`, `N_CHILDREN_W2013`, `EXIT_INTERVIEWED_W2020`) have no Stata label; add manual descriptions in the enrichment script
- Target coverage ≥ 99%; log how many variables received descriptions and how many remain empty
- Column order in codebook: `variable_name`, `description`, then statistics columns

### 9.2 Memory Management for Wide DataFrames

CHARLS-style survey data routinely produces panels with 10,000–25,000 columns after cross-wave stacking. These rules prevent OOM failures:

1. **Indicator join must use key columns only.** In `do_merge`, the intermediate join used to count matched/unmatched rows must operate on `left[keys]`, never on the full left panel:
   ```python
   # WRONG — copies entire 20k-col panel:
   ind = left.merge(right[keys], on=keys, how="left", indicator=True)
   # CORRECT — copies only key columns:
   ind = left[keys].merge(right[keys].drop_duplicates(), on=keys, how="left", indicator=True)
   ```

2. **Supplement scripts must load key columns only.** Any script that merges auxiliary modules into an already-wide panel should:
   - Load only `[ID, WAVE, HOUSEHOLDID, COMMUNITYID]` from the wide parquet (not all 19k+ cols)
   - Merge supplements against this slim key frame → save as a separate `*_supplement.parquet`
   - Let the export script do the final column-join

3. **Parquet intermediate files are preferred** over CSV for intermediate stages (faster I/O, preserves dtypes). Use `df.to_parquet()` with `write_parquet()` wrapper that calls `clean_dtypes()` first.

4. **CSV export for very wide panels** should be done in row chunks (`pd.read_csv(..., chunksize=N)` or `pq.ParquetFile.iter_batches(batch_size=N)`) to avoid loading the full panel into RAM.

### 9.3 Mixed-Type Column Handling (Stata Cross-Wave Stacking)

When stacking `.dta` files from multiple waves with `pd.concat`, object-dtype columns can contain mixed Python types (e.g., `str` from one wave, `float` from another). This causes `ArrowTypeError` when writing to parquet. Always call `clean_dtypes(df)` before `df.to_parquet()`.

The `clean_dtypes` function must:
- Decode `bytes` → `str` (pyreadstat can return bytes for some Stata string variables)
- For object columns with mixed `str + numeric`: check if ALL string values are empty (Stata missing sentinel `""`); if so, coerce the entire column to numeric via `pd.to_numeric`
- For mixed str + numeric where strings have content: convert all values to `str`
- Use head+tail sampling (e.g., 200 rows each) for type detection, NOT a full-column `.apply(type)` scan — the full scan is O(n × cols) and takes tens of minutes on wide DataFrames

### 9.4 Merge Duplicate Column Prevention

When merging modules into a growing panel with `suffixes=("", "_right")`, columns like `HOUSEHOLDID` and `COMMUNITYID` that exist in both left and right will generate `HOUSEHOLDID_right` in every merge, accumulating duplicates.

**Rule:** In the pre-merge drop step, drop ALL non-key columns that already exist in the panel — including `HOUSEHOLDID` and `COMMUNITYID`. Do not exempt them:

```python
# WRONG — HOUSEHOLDID/COMMUNITYID exempted, causing _right chains:
drop = [c for c in module.columns if c in existing and c not in keys + ["HOUSEHOLDID", "COMMUNITYID"]]

# CORRECT — drop everything already in panel except merge keys:
drop = [c for c in module.columns if c in existing and c not in keys]
```

As a safety net, `write_parquet()` should also deduplicate column names before writing:
```python
df = df.loc[:, ~df.columns.duplicated()]
```

### 9.5 Cross-Wave File Naming Differences

Survey waves often differ in file naming conventions. Always use a case-insensitive file finder (`find_file()` helper) rather than hardcoded names:

- CHARLS 2011: all filenames **lowercase** (`demographic_background.dta`)
- CHARLS 2013+: **CamelCase** (`Demographic_Background.dta`)
- Module availability varies by wave (e.g., no `Health_Care_and_Insurance.dta` in 2020)
- Variable availability within same-named modules varies by wave

Encode wave→filename mappings explicitly in the script (a dict per module) rather than relying on glob patterns.

### 9.6 Python Environment Notes

- CHARLS pipeline uses: `C:\Users\zhuch\.conda\envs\gnn\python.exe` (Python 3.10)
- CHNS pipeline used: `C:\Users\zhuch\.conda\envs\snipar_env\python.exe` (Python 3.9, currently broken)
- Required packages: `pandas`, `pyreadstat`, `pyarrow`
- Install via: `gnn_python -m pip install pyreadstat pyarrow pandas --only-binary :all:`
- Python 3.9 note: avoid `X | Y` type unions and `list[str]` annotations; use `Optional[X]` and `List[str]` from `typing`
