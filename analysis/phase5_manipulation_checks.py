"""
===============================================================================
PHASE 5: MANIPULATION CHECKS
===============================================================================
Swiss Ballot Chatbot Study - Measurement Analysis
2x2 Factorial Design: Transparency (T0/T1) x Control (C0/C1)

This script verifies that experimental manipulations worked as intended:
    - MC-T (Perceived Transparency): T1 should score higher than T0
    - MC-C (Perceived Control): C1 should score higher than C0

Methods:
    - Independent samples t-test (if normality holds)
    - Mann-Whitney U test (if non-normal)
    - Cohen's d effect size with 95% CI (for t-test)
    - Rank-biserial r effect size with 95% CI (for Mann-Whitney U)

Author: Chatbot Study Analysis Pipeline
Date: January 2025
===============================================================================
"""

import os
import numpy as np
import pandas as pd
from typing import Dict, Tuple
from scipy import stats

# Import from Phase 1
from phase1_descriptive_statistics import (
    AnalysisConfig,
    load_participant_data,
    prepare_variables,
    compute_sample_flow
)

# =============================================================================
# CONFIGURATION
# =============================================================================

ALPHA = 0.05  # Significance threshold


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def cohens_d(group1: np.ndarray, group2: np.ndarray) -> Tuple[float, str, float, float]:
    """
    Calculate Cohen's d effect size for two independent groups.

    Args:
        group1: First group values
        group2: Second group values

    Returns:
        Tuple of (d, interpretation, ci_lower, ci_upper)
    """
    n1, n2 = len(group1), len(group2)
    var1, var2 = group1.var(ddof=1), group2.var(ddof=1)

    # Pooled standard deviation
    pooled_std = np.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2))

    d = (group1.mean() - group2.mean()) / pooled_std if pooled_std > 0 else 0

    # Standard error (Hedges and Olkin, 1985)
    se_d = np.sqrt((n1 + n2) / (n1 * n2) + (d**2) / (2 * (n1 + n2)))

    # 95% CI
    ci_lower = d - 1.96 * se_d
    ci_upper = d + 1.96 * se_d

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

    return d, interpretation, ci_lower, ci_upper


def rank_biserial_r(U: float, n1: int, n2: int) -> Tuple[float, str, float, float]:
    """
    Calculate rank-biserial correlation from Mann-Whitney U with 95% CI.

    r = 1 - (2U)/(n1*n2)
    CI via Fisher z-transformation.

    Args:
        U: Mann-Whitney U statistic
        n1: Size of first group
        n2: Size of second group

    Returns:
        Tuple of (r, interpretation, ci_lower, ci_upper)
    """
    # scipy.mannwhitneyu(x, y) returns U for x: large U = x dominates y
    # r = 2U/(n1*n2) - 1 gives positive r when first group has higher values
    r = (2 * U) / (n1 * n2) - 1

    # 95% CI via Fisher z-transformation
    # Clamp r to avoid arctanh domain errors
    r_clamped = np.clip(r, -0.9999, 0.9999)
    z = np.arctanh(r_clamped)
    se_z = 1.0 / np.sqrt(n1 + n2 - 3)
    z_lo = z - 1.96 * se_z
    z_hi = z + 1.96 * se_z
    ci_lower = np.tanh(z_lo)
    ci_upper = np.tanh(z_hi)

    abs_r = abs(r)
    if abs_r < 0.1:
        interpretation = "negligible"
    elif abs_r < 0.3:
        interpretation = "small"
    elif abs_r < 0.5:
        interpretation = "medium"
    else:
        interpretation = "large"

    return r, interpretation, ci_lower, ci_upper


def check_normality(data: np.ndarray, alpha: float = 0.05) -> Tuple[bool, float, float]:
    """
    Check normality using Shapiro-Wilk test.

    Args:
        data: Array of values
        alpha: Significance level

    Returns:
        Tuple of (is_normal, W_statistic, p_value)
    """
    if len(data) < 3:
        return False, np.nan, np.nan

    if len(data) <= 5000:
        W, p = stats.shapiro(data)
    else:
        subsample = np.random.choice(data, 5000, replace=False)
        W, p = stats.shapiro(subsample)

    return p > alpha, W, p


# =============================================================================
# PHASE 5.1: MC-T (PERCEIVED TRANSPARENCY)
# =============================================================================

def check_mc_transparency(df: pd.DataFrame) -> Dict:
    """
    Manipulation check for perceived transparency: T0 vs T1.

    Expected: T1 (with DNL) > T0 (without DNL)

    Args:
        df: Filtered participant DataFrame

    Returns:
        Dictionary with test results
    """
    print("\n" + "="*70)
    print("PHASE 5.1: MC-T (PERCEIVED TRANSPARENCY)")
    print("="*70)
    print("\nExpected: T1 (with Data Nutrition Label) > T0 (without)")

    # Get groups
    mc_t_t0 = df[df['transparency_level'] == 0]['mc_transparency'].dropna().values
    mc_t_t1 = df[df['transparency_level'] == 1]['mc_transparency'].dropna().values

    # Descriptive statistics
    print(f"\n--- Descriptive Statistics ---")
    print(f"T0 (Low Transparency):  n = {len(mc_t_t0)}, M = {np.mean(mc_t_t0):.2f}, SD = {np.std(mc_t_t0, ddof=1):.2f}")
    print(f"T1 (High Transparency): n = {len(mc_t_t1)}, M = {np.mean(mc_t_t1):.2f}, SD = {np.std(mc_t_t1, ddof=1):.2f}")

    # Check normality
    norm_t0, W_t0, p_t0 = check_normality(mc_t_t0)
    norm_t1, W_t1, p_t1 = check_normality(mc_t_t1)

    print(f"\n--- Normality Check (Shapiro-Wilk) ---")
    print(f"T0: W = {W_t0:.4f}, p = {p_t0:.4f} {'(Normal)' if norm_t0 else '(Non-normal)'}")
    print(f"T1: W = {W_t1:.4f}, p = {p_t1:.4f} {'(Normal)' if norm_t1 else '(Non-normal)'}")

    use_parametric = norm_t0 and norm_t1

    # Statistical test
    print(f"\n--- Statistical Test ---")
    if use_parametric:
        t_stat, p_value = stats.ttest_ind(mc_t_t1, mc_t_t0)
        df_t = len(mc_t_t0) + len(mc_t_t1) - 2
        print(f"Test: Independent samples t-test")
        print(f"t({df_t}) = {t_stat:.3f}, p = {p_value:.4f}")
        test_type = 't-test'
        test_stat = t_stat

        # Effect size: Cohen's d (matches parametric test)
        d, d_interp, ci_lo, ci_hi = cohens_d(mc_t_t1, mc_t_t0)
        print(f"\nEffect size: Cohen's d = {d:.3f} ({d_interp})")
        print(f"95% CI: [{ci_lo:.3f}, {ci_hi:.3f}]")
        effect_size = d
        effect_interp = d_interp
        effect_ci_lo = ci_lo
        effect_ci_hi = ci_hi
        effect_metric = "Cohen's d"
    else:
        U, p_value = stats.mannwhitneyu(mc_t_t1, mc_t_t0, alternative='two-sided')
        print(f"Test: Mann-Whitney U (non-parametric)")
        print(f"U = {U:.1f}, p = {p_value:.4f}")
        test_type = 'Mann-Whitney U'
        test_stat = U

        # Effect size: rank-biserial r (matches non-parametric test)
        r, r_interp, ci_lo, ci_hi = rank_biserial_r(U, len(mc_t_t1), len(mc_t_t0))
        print(f"\nEffect size: rank-biserial r = {r:.3f} ({r_interp})")
        print(f"95% CI: [{ci_lo:.3f}, {ci_hi:.3f}]")
        effect_size = r
        effect_interp = r_interp
        effect_ci_lo = ci_lo
        effect_ci_hi = ci_hi
        effect_metric = "rank-biserial r"

    # Interpretation
    print(f"\n--- Interpretation ---")
    manipulation_worked = (np.mean(mc_t_t1) > np.mean(mc_t_t0)) and (p_value < ALPHA)

    if manipulation_worked:
        print(f"✓ MANIPULATION CHECK PASSED")
        print(f"  Participants in T1 conditions perceived significantly higher transparency.")
        result = "PASSED"
    elif np.mean(mc_t_t1) <= np.mean(mc_t_t0):
        print(f"✗ MANIPULATION CHECK FAILED - Direction wrong")
        print(f"  T1 did not show higher perceived transparency than T0.")
        result = "FAILED (wrong direction)"
    else:
        print(f"⚠ MANIPULATION CHECK INCONCLUSIVE - Not significant")
        print(f"  Difference in expected direction but p = {p_value:.4f} > α = {ALPHA}")
        result = "INCONCLUSIVE"

    return {
        'check': 'MC-T (Perceived Transparency)',
        'n_low': len(mc_t_t0),
        'n_high': len(mc_t_t1),
        'mean_low': np.mean(mc_t_t0),
        'mean_high': np.mean(mc_t_t1),
        'sd_low': np.std(mc_t_t0, ddof=1),
        'sd_high': np.std(mc_t_t1, ddof=1),
        'test': test_type,
        'test_stat': test_stat,
        'p_value': p_value,
        'effect_size': effect_size,
        'effect_metric': effect_metric,
        'effect_interpretation': effect_interp,
        'effect_ci_lower': effect_ci_lo,
        'effect_ci_upper': effect_ci_hi,
        'result': result
    }


# =============================================================================
# PHASE 5.2: MC-C (PERCEIVED CONTROL)
# =============================================================================

def check_mc_control(df: pd.DataFrame) -> Dict:
    """
    Manipulation check for perceived control: C0 vs C1.

    Expected: C1 (with Dashboard) > C0 (without Dashboard)

    Args:
        df: Filtered participant DataFrame

    Returns:
        Dictionary with test results
    """
    print("\n" + "="*70)
    print("PHASE 5.2: MC-C (PERCEIVED CONTROL)")
    print("="*70)
    print("\nExpected: C1 (with Granular Dashboard) > C0 (without)")

    # Get groups
    mc_c_c0 = df[df['control_level'] == 0]['mc_control'].dropna().values
    mc_c_c1 = df[df['control_level'] == 1]['mc_control'].dropna().values

    # Descriptive statistics
    print(f"\n--- Descriptive Statistics ---")
    print(f"C0 (Low Control):  n = {len(mc_c_c0)}, M = {np.mean(mc_c_c0):.2f}, SD = {np.std(mc_c_c0, ddof=1):.2f}")
    print(f"C1 (High Control): n = {len(mc_c_c1)}, M = {np.mean(mc_c_c1):.2f}, SD = {np.std(mc_c_c1, ddof=1):.2f}")

    # Check normality
    norm_c0, W_c0, p_c0 = check_normality(mc_c_c0)
    norm_c1, W_c1, p_c1 = check_normality(mc_c_c1)

    print(f"\n--- Normality Check (Shapiro-Wilk) ---")
    print(f"C0: W = {W_c0:.4f}, p = {p_c0:.4f} {'(Normal)' if norm_c0 else '(Non-normal)'}")
    print(f"C1: W = {W_c1:.4f}, p = {p_c1:.4f} {'(Normal)' if norm_c1 else '(Non-normal)'}")

    use_parametric = norm_c0 and norm_c1

    # Statistical test
    print(f"\n--- Statistical Test ---")
    if use_parametric:
        t_stat, p_value = stats.ttest_ind(mc_c_c1, mc_c_c0)
        df_c = len(mc_c_c0) + len(mc_c_c1) - 2
        print(f"Test: Independent samples t-test")
        print(f"t({df_c}) = {t_stat:.3f}, p = {p_value:.4f}")
        test_type = 't-test'
        test_stat = t_stat

        # Effect size: Cohen's d (matches parametric test)
        d, d_interp, ci_lo, ci_hi = cohens_d(mc_c_c1, mc_c_c0)
        print(f"\nEffect size: Cohen's d = {d:.3f} ({d_interp})")
        print(f"95% CI: [{ci_lo:.3f}, {ci_hi:.3f}]")
        effect_size = d
        effect_interp = d_interp
        effect_ci_lo = ci_lo
        effect_ci_hi = ci_hi
        effect_metric = "Cohen's d"
    else:
        U, p_value = stats.mannwhitneyu(mc_c_c1, mc_c_c0, alternative='two-sided')
        print(f"Test: Mann-Whitney U (non-parametric)")
        print(f"U = {U:.1f}, p = {p_value:.4f}")
        test_type = 'Mann-Whitney U'
        test_stat = U

        # Effect size: rank-biserial r (matches non-parametric test)
        r, r_interp, ci_lo, ci_hi = rank_biserial_r(U, len(mc_c_c1), len(mc_c_c0))
        print(f"\nEffect size: rank-biserial r = {r:.3f} ({r_interp})")
        print(f"95% CI: [{ci_lo:.3f}, {ci_hi:.3f}]")
        effect_size = r
        effect_interp = r_interp
        effect_ci_lo = ci_lo
        effect_ci_hi = ci_hi
        effect_metric = "rank-biserial r"

    # Interpretation
    print(f"\n--- Interpretation ---")
    manipulation_worked = (np.mean(mc_c_c1) > np.mean(mc_c_c0)) and (p_value < ALPHA)

    if manipulation_worked:
        print(f"✓ MANIPULATION CHECK PASSED")
        print(f"  Participants in C1 conditions perceived significantly higher control.")
        result = "PASSED"
    elif np.mean(mc_c_c1) <= np.mean(mc_c_c0):
        print(f"✗ MANIPULATION CHECK FAILED - Direction wrong")
        print(f"  C1 did not show higher perceived control than C0.")
        result = "FAILED (wrong direction)"
    else:
        print(f"⚠ MANIPULATION CHECK INCONCLUSIVE - Not significant")
        print(f"  Difference in expected direction but p = {p_value:.4f} > α = {ALPHA}")
        result = "INCONCLUSIVE"

    return {
        'check': 'MC-C (Perceived Control)',
        'n_low': len(mc_c_c0),
        'n_high': len(mc_c_c1),
        'mean_low': np.mean(mc_c_c0),
        'mean_high': np.mean(mc_c_c1),
        'sd_low': np.std(mc_c_c0, ddof=1),
        'sd_high': np.std(mc_c_c1, ddof=1),
        'test': test_type,
        'test_stat': test_stat,
        'p_value': p_value,
        'effect_size': effect_size,
        'effect_metric': effect_metric,
        'effect_interpretation': effect_interp,
        'effect_ci_lower': effect_ci_lo,
        'effect_ci_upper': effect_ci_hi,
        'result': result
    }


# =============================================================================
# PHASE 5.3: SUMMARY BY CONDITION
# =============================================================================

def summarize_by_condition(df: pd.DataFrame) -> pd.DataFrame:
    """
    Summarize manipulation check scores by condition.

    Args:
        df: Filtered participant DataFrame

    Returns:
        DataFrame with MC scores by condition
    """
    print("\n" + "="*70)
    print("PHASE 5.3: MANIPULATION CHECK SCORES BY CONDITION")
    print("="*70)

    summary = df.groupby('condition').agg({
        'mc_transparency': ['count', 'mean', 'std'],
        'mc_control': ['count', 'mean', 'std']
    }).round(2)

    summary.columns = ['MC-T n', 'MC-T Mean', 'MC-T SD', 'MC-C n', 'MC-C Mean', 'MC-C SD']
    print(summary)

    return summary


# =============================================================================
# OUTPUT GENERATION
# =============================================================================

def save_results(results: Dict, config: AnalysisConfig):
    """Save all Phase 5 results to output directory."""
    output_dir = os.path.join(os.path.dirname(__file__), './output/phase5')
    os.makedirs(output_dir, exist_ok=True)

    participant_type = 'ai' if config.is_ai_participant else 'human'

    # Save summary table
    summary_df = pd.DataFrame([results['mc_t'], results['mc_c']])
    filepath = os.path.join(output_dir, f'phase5_manipulation_checks_{participant_type}.csv')
    summary_df.to_csv(filepath, index=False)
    print(f"[INFO] Saved: {filepath}")

    # Save by-condition summary
    if 'by_condition' in results:
        filepath = os.path.join(output_dir, f'phase5_mc_by_condition_{participant_type}.csv')
        results['by_condition'].to_csv(filepath)
        print(f"[INFO] Saved: {filepath}")


# =============================================================================
# MAIN EXECUTION
# =============================================================================

def run_phase5_analysis(is_ai_participant: bool = True) -> Dict:
    """
    Run complete Phase 5 manipulation check analysis.

    Args:
        is_ai_participant: True for AI participants, False for human participants

    Returns:
        Dictionary containing all analysis results
    """
    print("="*70)
    print("PHASE 5: MANIPULATION CHECKS")
    print(f"Participant Type: {'AI Test Users' if is_ai_participant else 'Human Participants'}")
    print("="*70)

    # Initialize configuration
    config = AnalysisConfig(is_ai_participant=is_ai_participant)

    # Load and prepare data
    df_raw = load_participant_data(config)
    df = prepare_variables(df_raw, config)

    # Apply exclusions
    sample_flow = compute_sample_flow(df)
    df_filtered = sample_flow['df_filtered']

    # Store results
    results = {}

    # 5.1 MC-T (Perceived Transparency)
    results['mc_t'] = check_mc_transparency(df_filtered)

    # 5.2 MC-C (Perceived Control)
    results['mc_c'] = check_mc_control(df_filtered)

    # 5.3 Summary by condition
    results['by_condition'] = summarize_by_condition(df_filtered)

    # Overall assessment
    print("\n" + "="*70)
    print("OVERALL MANIPULATION CHECK ASSESSMENT")
    print("="*70)

    both_passed = results['mc_t']['result'] == "PASSED" and results['mc_c']['result'] == "PASSED"
    if both_passed:
        print("✓ Both manipulations worked as intended.")
    else:
        print("⚠ One or both manipulations need attention:")
        print(f"  MC-T: {results['mc_t']['result']}")
        print(f"  MC-C: {results['mc_c']['result']}")

    # Save results
    save_results(results, config)

    print("\n" + "="*70)
    print("PHASE 5 ANALYSIS COMPLETE")
    print("="*70)

    return results


# =============================================================================
# SCRIPT ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Phase 5: Manipulation Checks')
    parser.add_argument(
        '--participant-type',
        choices=['ai', 'human'],
        default='ai',
        help='Type of participants to analyze (default: ai)'
    )

    args = parser.parse_args()
    results = run_phase5_analysis(is_ai_participant=(args.participant_type == 'ai'))
