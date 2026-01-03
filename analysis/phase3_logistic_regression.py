"""
===============================================================================
PHASE 3: LOGISTIC REGRESSION (Main Analysis)
===============================================================================
Swiss Ballot Chatbot Study - Measurement Analysis
2x2 Factorial Design: Transparency (T0/T1) x Control (C0/C1)

This script performs:
    Model 1: Donation ~ T (Transparency)           - H1 main effect
    Model 2: Donation ~ C (Control)                - H2 main effect
    Model 3: Donation ~ T + C                      - Joint main effects
    Model 4: Donation ~ T + C + T×C                - H3 interaction
    Model 5: Donation ~ T + C + T×C + covariates   - Full model

Outputs per model:
    - Coefficient table: OR with 95% CI, p-value, direction
    - Model fit: log-likelihood, AIC
    - Overall model test: Wald χ² with p-value
    - Model comparisons: Likelihood Ratio Tests (nested models)
    - Effect sizes: Cohen's d (group differences), Phi coefficient (2×2)
    - Visualization: predicted probabilities for A/B/C/D

Author: Chatbot Study Analysis Pipeline
Date: January 2025
===============================================================================
"""

import os
import numpy as np
import pandas as pd
from scipy import stats
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

# Statsmodels for logistic regression
import statsmodels.api as sm
from statsmodels.discrete.discrete_model import Logit
from statsmodels.stats.outliers_influence import variance_inflation_factor

# Import from Phase 1
from phase1_descriptive_statistics import (
    AnalysisConfig,
    get_db_connection,
    load_participant_data,
    prepare_variables,
    compute_sample_flow,
    wilson_ci
)

# =============================================================================
# CONFIGURATION
# =============================================================================

# Significance threshold
ALPHA = 0.05

# =============================================================================
# EFFECT SIZE FUNCTIONS
# =============================================================================

def cohens_d(group1: np.ndarray, group2: np.ndarray) -> Tuple[float, str]:
    """
    Calculate Cohen's d for two independent groups.

    Cohen's d = (M1 - M2) / pooled_SD

    Returns: (d, interpretation)

    Interpretation thresholds (Cohen, 1988):
        |d| < 0.2: negligible
        0.2 ≤ |d| < 0.5: small
        0.5 ≤ |d| < 0.8: medium
        |d| ≥ 0.8: large
    """
    n1, n2 = len(group1), len(group2)
    var1, var2 = group1.var(ddof=1), group2.var(ddof=1)

    # Pooled standard deviation
    pooled_std = np.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2))

    # Cohen's d
    d = (group1.mean() - group2.mean()) / pooled_std if pooled_std > 0 else 0

    # Interpretation
    abs_d = abs(d)
    if abs_d < 0.2:
        interpretation = "negligible"
    elif abs_d < 0.5:
        interpretation = "small"
    elif abs_d < 0.8:
        interpretation = "medium"
    else:
        interpretation = "large"

    return d, interpretation


def phi_coefficient(contingency_table: np.ndarray) -> Tuple[float, str]:
    """
    Calculate Phi coefficient for a 2×2 contingency table.

    Phi = (ad - bc) / sqrt((a+b)(c+d)(a+c)(b+d))

    For a table:
        |  a  |  b  |
        |  c  |  d  |

    Returns: (phi, interpretation)

    Interpretation thresholds:
        |φ| < 0.1: negligible
        0.1 ≤ |φ| < 0.3: small
        0.3 ≤ |φ| < 0.5: medium
        |φ| ≥ 0.5: large
    """
    a, b = contingency_table[0, 0], contingency_table[0, 1]
    c, d = contingency_table[1, 0], contingency_table[1, 1]

    numerator = (a * d) - (b * c)
    denominator = np.sqrt((a + b) * (c + d) * (a + c) * (b + d))

    phi = numerator / denominator if denominator > 0 else 0

    # Interpretation
    abs_phi = abs(phi)
    if abs_phi < 0.1:
        interpretation = "negligible"
    elif abs_phi < 0.3:
        interpretation = "small"
    elif abs_phi < 0.5:
        interpretation = "medium"
    else:
        interpretation = "large"

    return phi, interpretation


def compute_effect_sizes(df: pd.DataFrame) -> Dict:
    """
    Compute effect sizes for the main experimental factors.

    Returns dictionary with:
        - Cohen's d for T (comparing T0 vs T1)
        - Cohen's d for C (comparing C0 vs C1)
        - Phi coefficient for donation × transparency
        - Phi coefficient for donation × control
    """
    results = {}

    # Cohen's d for Transparency effect
    t0_donations = df[df['transparency_level'] == 0]['donation_decision'].values
    t1_donations = df[df['transparency_level'] == 1]['donation_decision'].values
    d_t, interp_t = cohens_d(t1_donations, t0_donations)
    results['cohens_d_transparency'] = {
        'd': d_t,
        'interpretation': interp_t,
        'n_t0': len(t0_donations),
        'n_t1': len(t1_donations),
        'mean_t0': t0_donations.mean(),
        'mean_t1': t1_donations.mean()
    }

    # Cohen's d for Control effect
    c0_donations = df[df['control_level'] == 0]['donation_decision'].values
    c1_donations = df[df['control_level'] == 1]['donation_decision'].values
    d_c, interp_c = cohens_d(c1_donations, c0_donations)
    results['cohens_d_control'] = {
        'd': d_c,
        'interpretation': interp_c,
        'n_c0': len(c0_donations),
        'n_c1': len(c1_donations),
        'mean_c0': c0_donations.mean(),
        'mean_c1': c1_donations.mean()
    }

    # Phi coefficient for Donation × Transparency
    ct_t = pd.crosstab(df['donation_decision'], df['transparency_level']).values
    phi_t, interp_phi_t = phi_coefficient(ct_t)
    results['phi_transparency'] = {
        'phi': phi_t,
        'interpretation': interp_phi_t,
        'contingency_table': ct_t
    }

    # Phi coefficient for Donation × Control
    ct_c = pd.crosstab(df['donation_decision'], df['control_level']).values
    phi_c, interp_phi_c = phi_coefficient(ct_c)
    results['phi_control'] = {
        'phi': phi_c,
        'interpretation': interp_phi_c,
        'contingency_table': ct_c
    }

    return results


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def calculate_vif(X: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate Variance Inflation Factor for multicollinearity check.
    VIF > 5 indicates potential multicollinearity issues.
    """
    vif_data = []

    # Only calculate VIF for numeric columns (excluding constant)
    numeric_cols = [col for col in X.columns if col != 'const']

    for i, col in enumerate(numeric_cols):
        # Get position in full X matrix (accounting for const if present)
        col_idx = list(X.columns).index(col)
        vif = variance_inflation_factor(X.values, col_idx)
        vif_data.append({'Variable': col, 'VIF': vif})

    return pd.DataFrame(vif_data)


def likelihood_ratio_test(model_reduced, model_full) -> Tuple[float, int, float]:
    """
    Perform likelihood ratio test between nested models.

    H0: Reduced model is adequate
    H1: Full model provides significantly better fit

    Returns: (chi2 statistic, df, p-value)
    """
    ll_reduced = model_reduced.llf
    ll_full = model_full.llf

    chi2 = 2 * (ll_full - ll_reduced)
    df = model_full.df_model - model_reduced.df_model
    p_value = 1 - stats.chi2.cdf(chi2, df) if df > 0 else 1.0

    return chi2, int(df), p_value


# =============================================================================
# MODEL FITTING
# =============================================================================

def fit_logistic_model(y: np.ndarray, X: pd.DataFrame,
                        model_name: str) -> Dict:
    """
    Fit logistic regression model and return comprehensive results.

    Args:
        y: Binary outcome (donation_decision)
        X: Predictor matrix (with constant term)
        model_name: Name for identification

    Returns:
        Dictionary with model results
    """
    # Fit model
    model = Logit(y, X)
    result = model.fit(disp=0)  # disp=0 suppresses convergence output

    # Extract coefficients as odds ratios
    coef_table = pd.DataFrame({
        'Variable': X.columns,
        'Coef (B)': result.params,
        'SE': result.bse,
        'OR': np.exp(result.params),
        'OR_CI_Lower': np.exp(result.conf_int()[0]),
        'OR_CI_Upper': np.exp(result.conf_int()[1]),
        'z': result.tvalues,
        'p': result.pvalues
    })

    # Add direction interpretation
    coef_table['Direction'] = coef_table['OR'].apply(
        lambda x: 'Increases' if x > 1 else 'Decreases' if x < 1 else 'No effect'
    )

    # VIF (multicollinearity check) - only if more than 1 predictor
    vif_df = None
    if X.shape[1] > 2:  # More than just constant + 1 predictor
        try:
            vif_df = calculate_vif(X)
        except:
            pass

    # Predicted probabilities
    y_pred_prob = result.predict(X)

    return {
        'name': model_name,
        'result': result,
        'coef_table': coef_table,
        'n': len(y),
        'll': result.llf,
        'll_null': result.llnull,
        'aic': result.aic,
        'bic': result.bic,
        'wald_chi2': result.llr,  # Likelihood ratio chi2 (overall model test)
        'wald_p': result.llr_pvalue,
        'df_model': result.df_model,
        'converged': result.mle_retvals['converged'],
        'vif': vif_df,
        'y_pred_prob': y_pred_prob
    }


def prepare_covariates(df: pd.DataFrame) -> pd.DataFrame:
    """
    Prepare demographic covariates for Model 5.
    Handles missing values and creates dummy variables.
    """
    df_covariates = df.copy()

    # Age: Create ordinal coding (if categorical)
    # Assuming age categories like: '18-24', '25-34', etc.
    if df_covariates['age'].dtype == 'object':
        age_order = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+']
        age_map = {age: i for i, age in enumerate(age_order)}
        df_covariates['age_ordinal'] = df_covariates['age'].map(age_map)
        # Fill missing with median
        df_covariates['age_ordinal'] = df_covariates['age_ordinal'].fillna(
            df_covariates['age_ordinal'].median()
        )
    else:
        df_covariates['age_ordinal'] = df_covariates['age'].fillna(
            df_covariates['age'].median()
        )

    # Gender: Binary coding (female=1, male=0, other=0.5)
    gender_map = {'female': 1, 'male': 0, 'other': 0.5, 'prefer-not-to-say': 0.5}
    df_covariates['gender_coded'] = df_covariates['gender'].map(gender_map)
    df_covariates['gender_coded'] = df_covariates['gender_coded'].fillna(0.5)

    # Education: Ordinal coding
    edu_order = ['no-formal', 'primary', 'secondary', 'vocational',
                  'bachelor', 'master', 'doctorate']
    edu_map = {edu: i for i, edu in enumerate(edu_order)}
    df_covariates['education_ordinal'] = df_covariates['education'].map(edu_map)
    df_covariates['education_ordinal'] = df_covariates['education_ordinal'].fillna(
        df_covariates['education_ordinal'].median()
    )

    return df_covariates


# =============================================================================
# PREDICTED PROBABILITIES
# =============================================================================

def compute_predicted_probabilities(model_result, df: pd.DataFrame,
                                     model_type: str) -> pd.DataFrame:
    """
    Compute predicted probabilities for each condition A/B/C/D.

    Args:
        model_result: Fitted statsmodels result
        df: DataFrame with data
        model_type: 'model4' or 'model5' to determine predictors

    Returns:
        DataFrame with predicted probabilities and 95% CI per condition
    """
    conditions = ['A', 'B', 'C', 'D']
    results = []

    for condition in conditions:
        # Get mean values for this condition
        condition_df = df[df['condition'] == condition]

        if model_type == 'model4':
            # Model 4: T + C + T×C
            T = condition_df['transparency_level'].mean()
            C = condition_df['control_level'].mean()
            TxC = T * C
            X_pred = np.array([[1, T, C, TxC]])  # with constant
        else:
            # Model 5: T + C + T×C + covariates
            T = condition_df['transparency_level'].mean()
            C = condition_df['control_level'].mean()
            TxC = T * C
            age = condition_df['age_ordinal'].mean()
            gender = condition_df['gender_coded'].mean()
            edu = condition_df['education_ordinal'].mean()
            X_pred = np.array([[1, T, C, TxC, age, gender, edu]])

        # Predict probability
        pred_prob = model_result.predict(X_pred)[0]

        # Calculate SE for prediction using delta method (simplified)
        # For more accurate CI, would use bootstrap
        se = np.sqrt(pred_prob * (1 - pred_prob) / len(condition_df))
        ci_lower = max(0, pred_prob - 1.96 * se)
        ci_upper = min(1, pred_prob + 1.96 * se)

        # Observed rate for comparison
        observed_rate = condition_df['donation_decision'].mean()
        obs_ci = wilson_ci(int(condition_df['donation_decision'].sum()),
                           len(condition_df))

        results.append({
            'Condition': condition,
            'n': len(condition_df),
            'Observed Rate (%)': round(observed_rate * 100, 1),
            'Obs 95% CI': f"[{round(obs_ci[0]*100, 1)}, {round(obs_ci[1]*100, 1)}]",
            'Predicted Prob (%)': round(pred_prob * 100, 1),
            'Pred 95% CI': f"[{round(ci_lower*100, 1)}, {round(ci_upper*100, 1)}]"
        })

    return pd.DataFrame(results)


# =============================================================================
# PHASE 3 MAIN ANALYSIS
# =============================================================================

def run_phase3_analysis(df: pd.DataFrame) -> Dict:
    """
    Run all Phase 3 logistic regression models.

    Returns dictionary with results for all five models.
    """
    results = {}

    print("\n" + "="*70)
    print("PHASE 3: LOGISTIC REGRESSION (MAIN ANALYSIS)")
    print("="*70)
    print(f"Sample size: N = {len(df)}")

    # Prepare outcome and predictors
    y = df['donation_decision'].values

    # -------------------------------------------------------------------------
    # Model 1: Donation ~ T (Transparency main effect - H1)
    # -------------------------------------------------------------------------
    print("\n" + "-"*70)
    print("MODEL 1: Donation ~ Transparency (H1 main effect)")
    print("-"*70)

    X1 = sm.add_constant(df[['transparency_level']])
    results['model1'] = fit_logistic_model(y, X1, 'Model 1: Donation ~ T')
    print_model_results(results['model1'])

    # -------------------------------------------------------------------------
    # Model 2: Donation ~ C (Control main effect - H2)
    # -------------------------------------------------------------------------
    print("\n" + "-"*70)
    print("MODEL 2: Donation ~ Control (H2 main effect)")
    print("-"*70)

    X2 = sm.add_constant(df[['control_level']])
    results['model2'] = fit_logistic_model(y, X2, 'Model 2: Donation ~ C')
    print_model_results(results['model2'])

    # -------------------------------------------------------------------------
    # Model 3: Donation ~ T + C (Joint main effects)
    # -------------------------------------------------------------------------
    print("\n" + "-"*70)
    print("MODEL 3: Donation ~ T + C (Joint main effects)")
    print("-"*70)

    X3 = sm.add_constant(df[['transparency_level', 'control_level']])
    results['model3'] = fit_logistic_model(y, X3, 'Model 3: Donation ~ T + C')
    print_model_results(results['model3'])

    # -------------------------------------------------------------------------
    # Model 4: Donation ~ T + C + T×C (Interaction - H3)
    # -------------------------------------------------------------------------
    print("\n" + "-"*70)
    print("MODEL 4: Donation ~ T + C + T×C (H3 interaction)")
    print("-"*70)

    X4 = sm.add_constant(df[['transparency_level', 'control_level', 'T_x_C']])
    results['model4'] = fit_logistic_model(y, X4, 'Model 4: Donation ~ T + C + T×C')
    print_model_results(results['model4'])

    # -------------------------------------------------------------------------
    # Model 5: Full model with covariates
    # -------------------------------------------------------------------------
    print("\n" + "-"*70)
    print("MODEL 5: Donation ~ T + C + T×C + age + gender + education")
    print("-"*70)

    # Prepare covariates
    df_with_cov = prepare_covariates(df)

    X5 = sm.add_constant(df_with_cov[['transparency_level', 'control_level', 'T_x_C',
                                        'age_ordinal', 'gender_coded', 'education_ordinal']])
    results['model5'] = fit_logistic_model(y, X5, 'Model 5: Full model')
    print_model_results(results['model5'])

    # Store df_with_cov for predictions
    results['df_with_cov'] = df_with_cov

    # -------------------------------------------------------------------------
    # Effect Sizes (Cohen's d and Phi coefficient)
    # -------------------------------------------------------------------------
    print("\n" + "="*70)
    print("EFFECT SIZES")
    print("="*70)

    effect_sizes = compute_effect_sizes(df)
    results['effect_sizes'] = effect_sizes

    print("\nCohen's d (Group Differences):")
    print("-"*50)
    es_t = effect_sizes['cohens_d_transparency']
    print(f"  Transparency (T1 vs T0): d = {es_t['d']:.3f} ({es_t['interpretation']})")
    print(f"    Mean T0: {es_t['mean_t0']:.3f}, Mean T1: {es_t['mean_t1']:.3f}")

    es_c = effect_sizes['cohens_d_control']
    print(f"  Control (C1 vs C0): d = {es_c['d']:.3f} ({es_c['interpretation']})")
    print(f"    Mean C0: {es_c['mean_c0']:.3f}, Mean C1: {es_c['mean_c1']:.3f}")

    print("\nPhi Coefficient (2×2 Association):")
    print("-"*50)
    phi_t = effect_sizes['phi_transparency']
    print(f"  Donation × Transparency: φ = {phi_t['phi']:.3f} ({phi_t['interpretation']})")

    phi_c = effect_sizes['phi_control']
    print(f"  Donation × Control: φ = {phi_c['phi']:.3f} ({phi_c['interpretation']})")

    # -------------------------------------------------------------------------
    # Model Comparisons (Likelihood Ratio Tests)
    # -------------------------------------------------------------------------
    print("\n" + "="*70)
    print("MODEL COMPARISONS (Likelihood Ratio Tests)")
    print("="*70)

    comparisons = []

    # M1 vs M3 (Does adding C improve over T alone?)
    lrt = likelihood_ratio_test(results['model1']['result'], results['model3']['result'])
    comparisons.append({
        'Comparison': 'M1 → M3 (adding C)',
        'Δχ²': round(lrt[0], 3),
        'Δdf': lrt[1],
        'p': f"{lrt[2]:.4f}",
        'ΔAIC': round(results['model1']['aic'] - results['model3']['aic'], 1),
        'Significant': 'Yes' if lrt[2] < ALPHA else 'No'
    })

    # M3 vs M4 (Does adding interaction improve fit?)
    lrt = likelihood_ratio_test(results['model3']['result'], results['model4']['result'])
    comparisons.append({
        'Comparison': 'M3 → M4 (adding T×C)',
        'Δχ²': round(lrt[0], 3),
        'Δdf': lrt[1],
        'p': f"{lrt[2]:.4f}",
        'ΔAIC': round(results['model3']['aic'] - results['model4']['aic'], 1),
        'Significant': 'Yes' if lrt[2] < ALPHA else 'No'
    })

    # M4 vs M5 (Do covariates improve fit?)
    lrt = likelihood_ratio_test(results['model4']['result'], results['model5']['result'])
    comparisons.append({
        'Comparison': 'M4 → M5 (adding covariates)',
        'Δχ²': round(lrt[0], 3),
        'Δdf': lrt[1],
        'p': f"{lrt[2]:.4f}",
        'ΔAIC': round(results['model4']['aic'] - results['model5']['aic'], 1),
        'Significant': 'Yes' if lrt[2] < ALPHA else 'No'
    })

    comparisons_df = pd.DataFrame(comparisons)
    print(comparisons_df.to_string(index=False))
    results['model_comparisons'] = comparisons_df

    # -------------------------------------------------------------------------
    # Predicted Probabilities
    # -------------------------------------------------------------------------
    print("\n" + "="*70)
    print("PREDICTED PROBABILITIES BY CONDITION")
    print("="*70)

    print("\nFrom Model 4 (T + C + T×C):")
    pred_m4 = compute_predicted_probabilities(
        results['model4']['result'], df, 'model4'
    )
    print(pred_m4.to_string(index=False))
    results['predicted_m4'] = pred_m4

    print("\nFrom Model 5 (with covariates - robustness check):")
    pred_m5 = compute_predicted_probabilities(
        results['model5']['result'], df_with_cov, 'model5'
    )
    print(pred_m5.to_string(index=False))
    results['predicted_m5'] = pred_m5

    # -------------------------------------------------------------------------
    # Corrected Summary Table (All Relevant Models)
    # -------------------------------------------------------------------------
    print("\n" + "="*70)
    print("MODEL SUMMARY TABLE")
    print("="*70)

    summary_data = []
    for model_key in ['model1', 'model2', 'model3', 'model4', 'model5']:
        m = results[model_key]

        # Get T significance from coefficient table
        t_sig = '-'
        c_sig = '-'
        txc_sig = '-'

        for _, row in m['coef_table'].iterrows():
            if row['Variable'] == 'transparency_level':
                t_sig = 'Yes' if row['p'] < ALPHA else 'No'
            elif row['Variable'] == 'control_level':
                c_sig = 'Yes' if row['p'] < ALPHA else 'No'
            elif row['Variable'] == 'T_x_C':
                txc_sig = 'Yes' if row['p'] < ALPHA else 'No'

        summary_data.append({
            'Model': m['name'].replace('Model ', 'M').replace('Donation ~ ', '').replace(': ', ': '),
            'AIC': round(m['aic'], 1),
            'T sig.': t_sig,
            'C sig.': c_sig,
            'T×C sig.': txc_sig,
            'Wald χ²': round(m['wald_chi2'], 2),
            'Wald p': f"{m['wald_p']:.4f}"
        })

    summary_df = pd.DataFrame(summary_data)
    print(summary_df.to_string(index=False))
    results['summary'] = summary_df

    # -------------------------------------------------------------------------
    # Effect Size Summary Table
    # -------------------------------------------------------------------------
    print("\n" + "-"*70)
    print("EFFECT SIZE SUMMARY")
    print("-"*70)

    effect_summary = pd.DataFrame([
        {
            'Effect': 'Transparency (T)',
            "Cohen's d": f"{effect_sizes['cohens_d_transparency']['d']:.3f}",
            'd Interpretation': effect_sizes['cohens_d_transparency']['interpretation'],
            'Phi (φ)': f"{effect_sizes['phi_transparency']['phi']:.3f}",
            'φ Interpretation': effect_sizes['phi_transparency']['interpretation']
        },
        {
            'Effect': 'Control (C)',
            "Cohen's d": f"{effect_sizes['cohens_d_control']['d']:.3f}",
            'd Interpretation': effect_sizes['cohens_d_control']['interpretation'],
            'Phi (φ)': f"{effect_sizes['phi_control']['phi']:.3f}",
            'φ Interpretation': effect_sizes['phi_control']['interpretation']
        }
    ])
    print(effect_summary.to_string(index=False))
    results['effect_summary'] = effect_summary

    # -------------------------------------------------------------------------
    # Validation Criteria Check
    # -------------------------------------------------------------------------
    print("\n" + "="*70)
    print("VALIDATION CRITERIA CHECK")
    print("="*70)

    # Check model convergence
    all_converged = all(results[f'model{i}']['converged'] for i in range(1, 6))
    print(f"Model convergence: {'✓ All models converged' if all_converged else '✗ Some models failed to converge'}")

    # Check VIF for Model 5
    if results['model5']['vif'] is not None:
        max_vif = results['model5']['vif']['VIF'].max()
        print(f"Multicollinearity (VIF): {'✓ All VIF < 5' if max_vif < 5 else f'⚠ Max VIF = {max_vif:.2f}'}")
        print(results['model5']['vif'].to_string(index=False))

    # Best model by AIC
    aics = {f'model{i}': results[f'model{i}']['aic'] for i in range(1, 6)}
    best_model = min(aics, key=aics.get)
    print(f"\nBest model by AIC: {results[best_model]['name']} (AIC = {aics[best_model]:.1f})")

    return results


def print_model_results(model: Dict):
    """Print formatted model results."""
    print(f"\nCoefficients (Odds Ratios):")
    coef_display = model['coef_table'][['Variable', 'OR', 'OR_CI_Lower', 'OR_CI_Upper', 'p', 'Direction']].copy()
    coef_display['OR'] = coef_display['OR'].round(3)
    coef_display['OR_CI_Lower'] = coef_display['OR_CI_Lower'].round(3)
    coef_display['OR_CI_Upper'] = coef_display['OR_CI_Upper'].round(3)
    coef_display['p'] = coef_display['p'].apply(lambda x: f"{x:.4f}")
    coef_display['95% CI'] = '[' + coef_display['OR_CI_Lower'].astype(str) + ', ' + coef_display['OR_CI_Upper'].astype(str) + ']'
    print(coef_display[['Variable', 'OR', '95% CI', 'p', 'Direction']].to_string(index=False))

    print(f"\nModel Fit:")
    print(f"  Log-likelihood: {model['ll']:.2f}")
    print(f"  AIC: {model['aic']:.1f}")
    print(f"  Overall test: Wald χ² = {model['wald_chi2']:.2f}, p = {model['wald_p']:.4f}")
    print(f"  Converged: {'Yes' if model['converged'] else 'No'}")


# =============================================================================
# VISUALIZATION
# =============================================================================

def create_phase3_visualizations(results: Dict, df: pd.DataFrame,
                                   output_dir: str = './output/phase3'):
    """Create visualizations for Phase 3 analysis."""
    import matplotlib.pyplot as plt

    os.makedirs(output_dir, exist_ok=True)

    plt.style.use('seaborn-v0_8-whitegrid')

    # -------------------------------------------------------------------------
    # Figure 1: Predicted Probabilities by Condition (Model 4)
    # -------------------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10, 6))

    pred = results['predicted_m4']
    x = range(len(pred))
    colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']

    # Plot observed and predicted
    width = 0.35

    # Parse CI strings for error bars
    obs_rates = pred['Observed Rate (%)'].values
    pred_rates = pred['Predicted Prob (%)'].values

    bars1 = ax.bar([i - width/2 for i in x], obs_rates, width,
                    label='Observed', color=colors, alpha=0.7, edgecolor='black')
    bars2 = ax.bar([i + width/2 for i in x], pred_rates, width,
                    label='Predicted (Model 4)', color=colors, alpha=1.0,
                    edgecolor='black', hatch='///')

    ax.set_xticks(x)
    ax.set_xticklabels(['A (T0C0)', 'B (T1C0)', 'C (T0C1)', 'D (T1C1)'])
    ax.set_ylabel('Donation Rate (%)', fontsize=12)
    ax.set_xlabel('Condition', fontsize=12)
    ax.set_ylim(0, 100)
    ax.legend()

    # Add value labels
    for bar in bars1:
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 2,
                f'{bar.get_height():.1f}%', ha='center', fontsize=9)
    for bar in bars2:
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 2,
                f'{bar.get_height():.1f}%', ha='center', fontsize=9)

    ax.set_title('Observed vs Predicted Donation Rates by Condition\n(Model 4: T + C + T×C)',
                 fontsize=12, fontweight='bold')

    plt.tight_layout()
    plt.savefig(f'{output_dir}/fig_predicted_probabilities.png', dpi=150, bbox_inches='tight')
    plt.close()

    # -------------------------------------------------------------------------
    # Figure 2: Odds Ratios Forest Plot (Model 4)
    # -------------------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10, 6))

    coef = results['model4']['coef_table']
    # Exclude constant
    coef = coef[coef['Variable'] != 'const'].copy()

    y_pos = range(len(coef))

    # Plot OR with CI
    ax.errorbar(coef['OR'], y_pos,
                xerr=[coef['OR'] - coef['OR_CI_Lower'],
                      coef['OR_CI_Upper'] - coef['OR']],
                fmt='o', color='#2c3e50', markersize=10, capsize=5, capthick=2)

    # Add vertical line at OR = 1
    ax.axvline(x=1, color='red', linestyle='--', linewidth=2, alpha=0.7)

    ax.set_yticks(y_pos)
    ax.set_yticklabels(coef['Variable'].replace({
        'transparency_level': 'Transparency (T)',
        'control_level': 'Control (C)',
        'T_x_C': 'T × C Interaction'
    }))
    ax.set_xlabel('Odds Ratio (95% CI)', fontsize=12)
    ax.set_title('Model 4: Odds Ratios for Predictors\n(OR > 1 = increased donation odds)',
                 fontsize=12, fontweight='bold')

    # Add OR values as text
    for i, row in coef.iterrows():
        ax.text(row['OR_CI_Upper'] + 0.1, list(y_pos)[coef.index.get_loc(i)],
                f"OR={row['OR']:.2f}", va='center', fontsize=10)

    plt.tight_layout()
    plt.savefig(f'{output_dir}/fig_odds_ratios.png', dpi=150, bbox_inches='tight')
    plt.close()

    # -------------------------------------------------------------------------
    # Figure 3: Interaction Plot
    # -------------------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(8, 6))

    # Calculate mean donation rate for each combination
    interaction_data = df.groupby(['transparency_level', 'control_level'])['donation_decision'].mean() * 100

    # Plot
    c0_rates = [interaction_data.get((0, 0), 0), interaction_data.get((1, 0), 0)]  # Control = 0
    c1_rates = [interaction_data.get((0, 1), 0), interaction_data.get((1, 1), 0)]  # Control = 1

    x_labels = ['T0 (Low)', 'T1 (High)']

    ax.plot(x_labels, c0_rates, 'o-', label='C0 (Low Control)',
            color='#3498db', linewidth=2, markersize=10)
    ax.plot(x_labels, c1_rates, 's-', label='C1 (High Control)',
            color='#e74c3c', linewidth=2, markersize=10)

    ax.set_ylabel('Donation Rate (%)', fontsize=12)
    ax.set_xlabel('Transparency Level', fontsize=12)
    ax.set_ylim(0, 100)
    ax.legend()

    # Add interaction test result
    m4 = results['model4']
    interaction_coef = m4['coef_table'][m4['coef_table']['Variable'] == 'T_x_C']
    if len(interaction_coef) > 0:
        p_interaction = interaction_coef['p'].values[0]
        sig_text = f"Interaction p = {p_interaction:.4f}"
        ax.text(0.5, 0.02, sig_text, transform=ax.transAxes, ha='center',
                fontsize=11, style='italic')

    ax.set_title('Transparency × Control Interaction Effect on Donation',
                 fontsize=12, fontweight='bold')

    plt.tight_layout()
    plt.savefig(f'{output_dir}/fig_interaction_plot.png', dpi=150, bbox_inches='tight')
    plt.close()

    # -------------------------------------------------------------------------
    # Figure 4: Model Comparison (AIC)
    # -------------------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10, 5))

    models = ['M1: T', 'M2: C', 'M3: T+C', 'M4: T+C+T×C', 'M5: Full']
    aics = [results[f'model{i}']['aic'] for i in range(1, 6)]

    colors = ['#95a5a6'] * 5
    min_aic_idx = aics.index(min(aics))
    colors[min_aic_idx] = '#27ae60'  # Highlight best model

    bars = ax.bar(models, aics, color=colors, edgecolor='black')

    ax.set_ylabel('AIC (lower is better)', fontsize=12)
    ax.set_title('Model Comparison by AIC', fontsize=12, fontweight='bold')

    # Add values on bars
    for bar, aic in zip(bars, aics):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
                f'{aic:.1f}', ha='center', fontsize=10)

    plt.tight_layout()
    plt.savefig(f'{output_dir}/fig_model_comparison.png', dpi=150, bbox_inches='tight')
    plt.close()

    # -------------------------------------------------------------------------
    # Figure 5: Effect Sizes
    # -------------------------------------------------------------------------
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    # Cohen's d
    ax1 = axes[0]
    effects = ['Transparency', 'Control']
    d_values = [
        results['effect_sizes']['cohens_d_transparency']['d'],
        results['effect_sizes']['cohens_d_control']['d']
    ]
    colors_d = ['#3498db' if d > 0 else '#e74c3c' for d in d_values]

    bars = ax1.barh(effects, d_values, color=colors_d, edgecolor='black')
    ax1.axvline(x=0, color='black', linewidth=1)
    ax1.axvline(x=0.2, color='gray', linestyle='--', alpha=0.5)
    ax1.axvline(x=-0.2, color='gray', linestyle='--', alpha=0.5)
    ax1.axvline(x=0.5, color='gray', linestyle=':', alpha=0.5)
    ax1.axvline(x=-0.5, color='gray', linestyle=':', alpha=0.5)
    ax1.set_xlabel("Cohen's d", fontsize=12)
    ax1.set_title("Cohen's d Effect Sizes\n(|d|: 0.2=small, 0.5=medium, 0.8=large)", fontsize=11)

    for bar, d in zip(bars, d_values):
        ax1.text(d + 0.02 if d > 0 else d - 0.02, bar.get_y() + bar.get_height()/2,
                f'd={d:.3f}', va='center', ha='left' if d > 0 else 'right', fontsize=10)

    # Phi coefficient
    ax2 = axes[1]
    phi_values = [
        results['effect_sizes']['phi_transparency']['phi'],
        results['effect_sizes']['phi_control']['phi']
    ]
    colors_phi = ['#3498db' if p > 0 else '#e74c3c' for p in phi_values]

    bars = ax2.barh(effects, phi_values, color=colors_phi, edgecolor='black')
    ax2.axvline(x=0, color='black', linewidth=1)
    ax2.axvline(x=0.1, color='gray', linestyle='--', alpha=0.5)
    ax2.axvline(x=-0.1, color='gray', linestyle='--', alpha=0.5)
    ax2.axvline(x=0.3, color='gray', linestyle=':', alpha=0.5)
    ax2.axvline(x=-0.3, color='gray', linestyle=':', alpha=0.5)
    ax2.set_xlabel('Phi (φ)', fontsize=12)
    ax2.set_title("Phi Coefficient (2×2 Association)\n(|φ|: 0.1=small, 0.3=medium, 0.5=large)", fontsize=11)

    for bar, phi in zip(bars, phi_values):
        ax2.text(phi + 0.02 if phi > 0 else phi - 0.02, bar.get_y() + bar.get_height()/2,
                f'φ={phi:.3f}', va='center', ha='left' if phi > 0 else 'right', fontsize=10)

    plt.tight_layout()
    plt.savefig(f'{output_dir}/fig_effect_sizes.png', dpi=150, bbox_inches='tight')
    plt.close()

    print(f"\nVisualizations saved to {output_dir}/")


# =============================================================================
# OUTPUT SAVING
# =============================================================================

def save_results(results: Dict, output_dir: str = './output/phase3',
                  participant_type: str = 'ai'):
    """Save Phase 3 results to files."""
    import json

    os.makedirs(output_dir, exist_ok=True)

    # Save coefficient tables
    for model_key in ['model1', 'model2', 'model3', 'model4', 'model5']:
        m = results[model_key]
        filepath = f"{output_dir}/phase3_{model_key}_coefficients_{participant_type}.csv"
        m['coef_table'].to_csv(filepath, index=False)
        print(f"[INFO] Saved: {filepath}")

    # Save summary
    results['summary'].to_csv(f"{output_dir}/phase3_summary_{participant_type}.csv", index=False)

    # Save model comparisons
    results['model_comparisons'].to_csv(f"{output_dir}/phase3_model_comparisons_{participant_type}.csv", index=False)

    # Save predicted probabilities
    results['predicted_m4'].to_csv(f"{output_dir}/phase3_predicted_m4_{participant_type}.csv", index=False)
    results['predicted_m5'].to_csv(f"{output_dir}/phase3_predicted_m5_{participant_type}.csv", index=False)

    # Save effect sizes summary
    results['effect_summary'].to_csv(f"{output_dir}/phase3_effect_sizes_{participant_type}.csv", index=False)

    # Save JSON summary
    summary_json = {
        'participant_type': participant_type,
        'analysis_phase': 'Phase 3: Logistic Regression',
        'models': {},
        'effect_sizes': {
            'cohens_d_transparency': results['effect_sizes']['cohens_d_transparency']['d'],
            'cohens_d_control': results['effect_sizes']['cohens_d_control']['d'],
            'phi_transparency': results['effect_sizes']['phi_transparency']['phi'],
            'phi_control': results['effect_sizes']['phi_control']['phi']
        }
    }

    for model_key in ['model1', 'model2', 'model3', 'model4', 'model5']:
        m = results[model_key]
        summary_json['models'][model_key] = {
            'name': m['name'],
            'n': int(m['n']),
            'aic': float(m['aic']),
            'wald_chi2': float(m['wald_chi2']),
            'wald_p': float(m['wald_p']),
            'converged': bool(m['converged'])
        }

    with open(f"{output_dir}/phase3_summary_{participant_type}.json", 'w') as f:
        json.dump(summary_json, f, indent=2)

    print(f"[INFO] Saved JSON summary to {output_dir}/phase3_summary_{participant_type}.json")


# =============================================================================
# MAIN EXECUTION
# =============================================================================

def main(is_ai_participant: bool = True):
    """Main execution function for Phase 3 analysis."""

    # Initialize configuration
    config = AnalysisConfig(is_ai_participant=is_ai_participant)

    participant_label = "AI Test Users" if is_ai_participant else "Human Participants"
    print(f"\n{'='*70}")
    print(f"PHASE 3 ANALYSIS: {participant_label.upper()}")
    print(f"{'='*70}")

    # Load and prepare data
    print("\nLoading data...")
    df_raw = load_participant_data(config)
    df = prepare_variables(df_raw, config)

    # Apply exclusions (from Phase 1)
    sample_flow = compute_sample_flow(df)
    df_filtered = sample_flow['df_filtered']

    print(f"Final sample size: N = {len(df_filtered)}")

    # Run Phase 3 analysis
    results = run_phase3_analysis(df_filtered)

    # Create visualizations
    create_phase3_visualizations(results, df_filtered, './output/phase3')

    # Save results
    participant_type = 'ai' if is_ai_participant else 'human'
    save_results(results, './output/phase3', participant_type)

    print("\n" + "="*70)
    print("PHASE 3 ANALYSIS COMPLETE")
    print("="*70)

    return results


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Phase 3: Logistic Regression Analysis')
    parser.add_argument('--participant-type', choices=['ai', 'human'], default='ai',
                        help='Type of participants to analyze (default: ai)')

    args = parser.parse_args()
    is_ai = args.participant_type == 'ai'

    results = main(is_ai_participant=is_ai)
