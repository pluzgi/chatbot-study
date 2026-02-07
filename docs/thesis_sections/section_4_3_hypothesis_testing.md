## 4.3 Hypothesis Testing

This section presents the statistical tests for the three primary hypotheses. Following the measurement plan, the analysis proceeds in two stages: chi-square tests for bivariate associations, followed by logistic regression models that test main effects, interactions, and control for covariates.

### Chi-Square Analysis

Chi-square tests of independence were conducted to examine the relationship between experimental conditions and data donation decisions. Three tests were performed with Bonferroni-corrected significance threshold (α = .05/3 = .017).

**Table 10**
*Chi-Square Tests: Data Donation by Experimental Condition*

| Test | Comparison | χ² | df | p | Cramér's V | 95% CI | Significant |
|------|------------|----|----|---|------------|--------|-------------|
| 1 | Transparency (T0 vs T1) | 0.00 | 1 | 1.000 | 0.000 | [0.000, 0.134] | No |
| 2 | Control (C0 vs C1) | 0.24 | 1 | .627 | 0.034 | [0.000, 0.166] | No |
| 3 | Condition (A vs B vs C vs D) | 0.56 | 3 | .905 | 0.052 | [0.038, 0.212] | No |

*Note.* Bonferroni-corrected α = .017. Effect size interpretation: V < 0.1 = negligible, 0.1–0.3 = small, 0.3–0.5 = medium, >= 0.5 = large.

None of the three chi-square tests reached statistical significance. The transparency effect (Test 1) showed virtually no association, χ²(1) = 0.00, p = 1.000, V = 0.000. The control effect (Test 2) was also non-significant, χ²(1) = 0.24, p = .627, V = 0.034. The omnibus condition effect (Test 3) was non-significant, χ²(3) = 0.56, p = .905, V = 0.052. All effect sizes were negligible, consistent with the ceiling effect observed in the descriptive statistics (overall donation rate: 91.7%).

### Logistic Regression Analysis

To test all three hypotheses simultaneously while controlling for potential confounds, a series of nested logistic regression models were estimated: Model 1 (Transparency only), Model 2 (Control only), Model 3 (Main effects: T + C), Model 4 (Interaction: T + C + T×C), and Model 5 (Full model with covariates).

**Table 11**
*Logistic Regression Model Comparison*

| Model | Parameters | Log-Likelihood | AIC | LRT χ² | df | p |
|-------|------------|----------------|-----|--------|----|----|
| M1 (T only) | 2 | -58.60 | 121.2 | — | — | — |
| M2 (C only) | 2 | -58.33 | 120.7 | — | — | — |
| M3 (T + C) | 3 | -58.33 | 122.7 | 0.55 | 1 | .460 |
| M4 (T + C + T×C) | 4 | -58.32 | 124.6 | 0.01 | 1 | .908 |
| M5 (Full) | 7 | -52.42 | 118.8 | 11.80 | 3 | .008 |

*Note.* LRT compares each model to the preceding simpler model.

Model comparison reveals that neither adding control to transparency (M3 vs M1, χ²(1) = 0.55, p = .460) nor the interaction term (M4 vs M3, χ²(1) = 0.01, p = .908) significantly improves model fit. However, adding demographic covariates (M5 vs M4) significantly improves fit, χ²(3) = 11.80, p = .008, suggesting that demographic variables explain more variance in donation behavior than the experimental manipulations. Based on AIC, **Model 5** (full model) provides the best fit (AIC = 118.8).

**Table 12**
*Logistic Regression Coefficients: Main Effects Model (M3)*

| Predictor | β | SE | OR | 95% CI | p |
|-----------|------|-------|-------|-----------|------|
| Intercept | 2.20 | 0.38 | 8.99 | — | — |
| Transparency (T1) | 0.01 | 0.51 | 1.02 | [0.38, 2.75] | .977 |
| Control (C1) | 0.38 | 0.51 | 1.46 | [0.53, 4.00] | .463 |

*Note.* OR = odds ratio. Reference categories: Transparency = T0, Control = C0.

**Hypothesis Test Results.**

- **H1 (Transparency Effect)**: Not supported. Transparency did not significantly predict donation, β = 0.01, OR = 1.02, 95% CI [0.38, 2.75], p = .977. The odds ratio is essentially 1.0, indicating no effect of the Data Nutrition Label on donation behavior.

- **H2 (Control Effect)**: Not supported. Control did not significantly predict donation, β = 0.38, OR = 1.46, 95% CI [0.53, 4.00], p = .463. Although the direction favors higher donation in the high-control condition, the wide confidence interval spanning 1.0 precludes meaningful interpretation.

- **H3 (Interaction Effect)**: Not supported. The interaction term was not significant in M4, OR = 0.89, 95% CI [0.12, 6.73], p = .908. No synergistic or antagonistic interaction between transparency and control was detected.

**Effect Sizes.**

**Table 13**
*Effect Sizes for Hypothesis Tests*

| Hypothesis | Effect | OR | Cohen's d | Phi (φ) | Interpretation |
|------------|--------|----|-----------|---------|-----------------
| H1 | Transparency | 1.02 | 0.01 | 0.00 | Negligible |
| H2 | Control | 1.46 | 0.10 | 0.05 | Negligible |
| H3 | Interaction | 0.89 | — | — | Negligible |

*Note.* Cohen's d converted from log-odds using d = β × (√3/π). Phi computed from chi-square: φ = √(χ²/N).

**Predicted Probabilities.**

**Table 14**
*Predicted Donation Probabilities by Condition (Model 4)*

| Condition | Transparency | Control | Predicted P(Donate) | Observed |
|-----------|--------------|---------|---------------------|----------|
| A | T0 | C0 | 90.0% | 90.0% |
| B | T1 | C0 | 90.6% | 90.6% |
| C | T0 | C1 | 93.3% | 93.3% |
| D | T1 | C1 | 93.0% | 93.0% |

The predicted probabilities closely match the observed rates, reflecting the model's near-perfect fit to a dataset with minimal between-condition variance. The 3.3 percentage point range across conditions (90.0%–93.3%) is substantially smaller than the within-condition confidence intervals, confirming the absence of meaningful treatment effects.

**Covariate Effects (Model 5).** The full model including demographic covariates significantly improved fit over Model 4 (LRT χ² = 11.80, p = .008). Age was the only significant predictor (OR = 0.53, p = .005), indicating that older participants were less likely to donate. Education approached significance (p = .055). The experimental variables remained non-significant in the full model.

**Summary of Hypothesis Tests.**

**Table 15**
*Summary of Hypothesis Test Results*

| Hypothesis | Prediction | OR | 95% CI | p | Decision |
|------------|------------|----|---------|----|----------|
| H1 | Transparency → Donation | 1.02 | [0.38, 2.75] | .977 | Not supported |
| H2 | Control → Donation | 1.46 | [0.53, 4.00] | .463 | Not supported |
| H3 | T × C Interaction | 0.89 | [0.12, 6.73] | .908 | Not supported |

None of the three hypotheses were supported. The high baseline donation rate (91.7%) created a ceiling effect that severely limited statistical power to detect treatment differences. The negligible effect sizes across all tests suggest that the experimental manipulations — while the control manipulation successfully increased perceived control (Section 4.2) — did not translate into measurable differences in data donation behavior.
