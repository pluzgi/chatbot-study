"""
===============================================================================
PHASE 2: CHI² ANALYSIS (Descriptive Foundation)
===============================================================================
Swiss Ballot Chatbot Study - Measurement Analysis
2x2 Factorial Design: Transparency (T0/T1) x Control (C0/C1)

This script performs:
    1. Chi² Test #1: T0 vs T1 (collapsed across C)
    2. Chi² Test #2: C0 vs C1 (collapsed across T)
    3. Chi² Test #3: A/B/C/D × Donate/Decline

With Bonferroni correction: α = .05/3 = .017

Outputs per test:
    - Contingency table (n and %)
    - χ², df, p-value (evaluate against α = .017)
    - Effect size: Cramér's V with 95% CI
    - Visualization: donation rate bar chart with 95% CI

Author: Chatbot Study Analysis Pipeline
Date: January 2025
===============================================================================
"""

import os
import numpy as np
import pandas as pd
from scipy import stats
from typing import Dict, Tuple
from dataclasses import dataclass

# Import from Phase 1
from phase1_descriptive_statistics import (
    AnalysisConfig,
    # get_db_connection,  # commented out: CSV-based loading replaces DB access
    load_participant_data,
    prepare_variables,
    compute_sample_flow,
    wilson_ci
)

# =============================================================================
# CONFIGURATION
# =============================================================================

# Bonferroni-corrected alpha level
BONFERRONI_ALPHA = 0.05 / 3  # = 0.0167

# =============================================================================
# CHI-SQUARE ANALYSIS FUNCTIONS
# =============================================================================

def cramers_v(contingency_table: np.ndarray) -> float:
    """
    Calculate Cramér's V effect size for a contingency table.

    V = sqrt(χ² / (n * min(r-1, c-1)))

    Interpretation:
        V < 0.1: negligible
        V < 0.2: small
        V < 0.4: medium
        V >= 0.4: large
    """
    chi2 = stats.chi2_contingency(contingency_table)[0]
    n = contingency_table.sum()
    min_dim = min(contingency_table.shape[0] - 1, contingency_table.shape[1] - 1)

    if min_dim == 0 or n == 0:
        return 0.0

    return np.sqrt(chi2 / (n * min_dim))


def cramers_v_ci(contingency_table: np.ndarray, confidence: float = 0.95,
                  n_bootstrap: int = 1000) -> Tuple[float, float, float]:
    """
    Calculate Cramér's V with bootstrap confidence interval.

    Returns: (V, CI_lower, CI_upper)
    """
    observed_v = cramers_v(contingency_table)

    # Bootstrap for CI
    n = contingency_table.sum()
    rows, cols = contingency_table.shape

    # Flatten table to get probabilities
    probs = contingency_table.flatten() / n

    bootstrap_vs = []
    np.random.seed(42)

    for _ in range(n_bootstrap):
        # Resample
        sample = np.random.multinomial(int(n), probs)
        resampled_table = sample.reshape(rows, cols)

        # Check if table is valid (no zero margins)
        if resampled_table.sum(axis=0).min() > 0 and resampled_table.sum(axis=1).min() > 0:
            try:
                v = cramers_v(resampled_table)
                bootstrap_vs.append(v)
            except:
                pass

    if len(bootstrap_vs) < 100:
        return observed_v, 0.0, 1.0

    alpha = 1 - confidence
    ci_lower = np.percentile(bootstrap_vs, alpha/2 * 100)
    ci_upper = np.percentile(bootstrap_vs, (1 - alpha/2) * 100)

    return observed_v, ci_lower, ci_upper


def chi_square_test(df: pd.DataFrame, group_var: str, outcome_var: str = 'donation_decision',
                    group_labels: Dict = None) -> Dict:
    """
    Perform chi-square test for independence.

    Args:
        df: DataFrame with data
        group_var: Variable defining groups (e.g., 'transparency_level', 'control_level', 'condition')
        outcome_var: Binary outcome variable (default: 'donation_decision')
        group_labels: Optional dict mapping values to labels

    Returns:
        Dictionary with test results
    """
    # Create contingency table
    contingency = pd.crosstab(df[group_var], df[outcome_var])
    contingency_array = contingency.values

    # Perform chi-square test
    chi2, p_value, dof, expected = stats.chi2_contingency(contingency_array)

    # Calculate effect size
    v, v_ci_lower, v_ci_upper = cramers_v_ci(contingency_array)

    # Create detailed contingency table with percentages
    contingency_detailed = contingency.copy()
    contingency_detailed.columns = ['Decline (0)', 'Donate (1)']

    # Add row percentages
    row_totals = contingency_detailed.sum(axis=1)
    contingency_pct = contingency_detailed.div(row_totals, axis=0) * 100

    # Combine n and %
    contingency_combined = contingency_detailed.copy()
    for col in contingency_detailed.columns:
        contingency_combined[col] = contingency_detailed[col].astype(str) + ' (' + contingency_pct[col].round(1).astype(str) + '%)'

    contingency_combined['Total'] = row_totals

    # Donation rate per group with CI
    donation_rates = []
    for group in contingency.index:
        group_data = df[df[group_var] == group]
        n = len(group_data)
        donations = group_data[outcome_var].sum()
        rate = donations / n if n > 0 else 0
        ci_low, ci_high = wilson_ci(int(donations), n)

        label = group_labels.get(group, str(group)) if group_labels else str(group)
        donation_rates.append({
            'Group': label,
            'n': n,
            'Donations': int(donations),
            'Rate': rate * 100,
            'CI_Lower': ci_low * 100,
            'CI_Upper': ci_high * 100
        })

    donation_rates_df = pd.DataFrame(donation_rates)

    # Significance assessment
    significant = p_value < BONFERRONI_ALPHA

    return {
        'contingency_table': contingency_combined,
        'contingency_raw': contingency,
        'expected_frequencies': pd.DataFrame(expected,
                                              index=contingency.index,
                                              columns=['Decline (expected)', 'Donate (expected)']),
        'chi2': chi2,
        'df': dof,
        'p_value': p_value,
        'cramers_v': v,
        'cramers_v_ci': (v_ci_lower, v_ci_upper),
        'significant': significant,
        'alpha': BONFERRONI_ALPHA,
        'donation_rates': donation_rates_df
    }


def interpret_cramers_v(v: float) -> str:
    """Interpret Cramér's V effect size."""
    if v < 0.1:
        return "negligible"
    elif v < 0.2:
        return "small"
    elif v < 0.4:
        return "medium"
    else:
        return "large"


# =============================================================================
# PHASE 2 MAIN ANALYSIS
# =============================================================================

def run_phase2_analysis(df: pd.DataFrame) -> Dict:
    """
    Run all Phase 2 Chi² analyses.

    Returns dictionary with results for all three tests.
    """
    results = {}

    print("\n" + "="*70)
    print("PHASE 2: CHI² ANALYSIS (DESCRIPTIVE FOUNDATION)")
    print("="*70)
    print(f"\nBonferroni-corrected α = {BONFERRONI_ALPHA:.4f} (0.05/3)")
    print(f"Sample size: N = {len(df)}")

    # -------------------------------------------------------------------------
    # Chi² Test #1: T0 vs T1 (Transparency effect, collapsed across Control)
    # -------------------------------------------------------------------------
    print("\n" + "-"*70)
    print("CHI² TEST #1: Transparency (T0 vs T1)")
    print("-"*70)

    results['chi2_transparency'] = chi_square_test(
        df,
        'transparency_level',
        group_labels={0: 'T0 (Low)', 1: 'T1 (High)'}
    )

    r = results['chi2_transparency']
    print(f"\nContingency Table:")
    print(r['contingency_table'])
    print(f"\nDonation Rates:")
    print(r['donation_rates'].to_string(index=False))
    print(f"\nTest Statistics:")
    print(f"  χ² = {r['chi2']:.3f}, df = {r['df']}, p = {r['p_value']:.4f}")
    print(f"  Cramér's V = {r['cramers_v']:.3f} [{r['cramers_v_ci'][0]:.3f}, {r['cramers_v_ci'][1]:.3f}]")
    print(f"  Effect size interpretation: {interpret_cramers_v(r['cramers_v'])}")
    print(f"  Significant at α = {BONFERRONI_ALPHA:.3f}? {'YES' if r['significant'] else 'NO'}")

    # -------------------------------------------------------------------------
    # Chi² Test #2: C0 vs C1 (Control effect, collapsed across Transparency)
    # -------------------------------------------------------------------------
    print("\n" + "-"*70)
    print("CHI² TEST #2: Control (C0 vs C1)")
    print("-"*70)

    results['chi2_control'] = chi_square_test(
        df,
        'control_level',
        group_labels={0: 'C0 (Low)', 1: 'C1 (High)'}
    )

    r = results['chi2_control']
    print(f"\nContingency Table:")
    print(r['contingency_table'])
    print(f"\nDonation Rates:")
    print(r['donation_rates'].to_string(index=False))
    print(f"\nTest Statistics:")
    print(f"  χ² = {r['chi2']:.3f}, df = {r['df']}, p = {r['p_value']:.4f}")
    print(f"  Cramér's V = {r['cramers_v']:.3f} [{r['cramers_v_ci'][0]:.3f}, {r['cramers_v_ci'][1]:.3f}]")
    print(f"  Effect size interpretation: {interpret_cramers_v(r['cramers_v'])}")
    print(f"  Significant at α = {BONFERRONI_ALPHA:.3f}? {'YES' if r['significant'] else 'NO'}")

    # -------------------------------------------------------------------------
    # Chi² Test #3: A/B/C/D × Donate/Decline
    # -------------------------------------------------------------------------
    print("\n" + "-"*70)
    print("CHI² TEST #3: Condition (A/B/C/D) × Donation")
    print("-"*70)

    results['chi2_condition'] = chi_square_test(
        df,
        'condition',
        group_labels={'A': 'A (T0C0)', 'B': 'B (T1C0)', 'C': 'C (T0C1)', 'D': 'D (T1C1)'}
    )

    r = results['chi2_condition']
    print(f"\nContingency Table:")
    print(r['contingency_table'])
    print(f"\nDonation Rates:")
    print(r['donation_rates'].to_string(index=False))
    print(f"\nTest Statistics:")
    print(f"  χ² = {r['chi2']:.3f}, df = {r['df']}, p = {r['p_value']:.4f}")
    print(f"  Cramér's V = {r['cramers_v']:.3f} [{r['cramers_v_ci'][0]:.3f}, {r['cramers_v_ci'][1]:.3f}]")
    print(f"  Effect size interpretation: {interpret_cramers_v(r['cramers_v'])}")
    print(f"  Significant at α = {BONFERRONI_ALPHA:.3f}? {'YES' if r['significant'] else 'NO'}")

    # -------------------------------------------------------------------------
    # Summary
    # -------------------------------------------------------------------------
    print("\n" + "="*70)
    print("PHASE 2 SUMMARY")
    print("="*70)

    summary_data = []
    for test_name, test_key in [('Transparency (T0 vs T1)', 'chi2_transparency'),
                                  ('Control (C0 vs C1)', 'chi2_control'),
                                  ('Condition (A/B/C/D)', 'chi2_condition')]:
        r = results[test_key]
        summary_data.append({
            'Test': test_name,
            'χ²': f"{r['chi2']:.2f}",
            'df': r['df'],
            'p': f"{r['p_value']:.4f}",
            'Cramér\'s V': f"{r['cramers_v']:.3f}",
            'Effect': interpret_cramers_v(r['cramers_v']),
            'Sig. (α=.017)': 'Yes' if r['significant'] else 'No'
        })

    summary_df = pd.DataFrame(summary_data)
    print("\n" + summary_df.to_string(index=False))

    results['summary'] = summary_df

    return results


# =============================================================================
# VISUALIZATION
# =============================================================================

def create_phase2_visualizations(results: Dict, output_dir: str = './output/phase2'):
    """Create visualizations for Phase 2 analysis."""
    import matplotlib.pyplot as plt
    import seaborn as sns

    os.makedirs(output_dir, exist_ok=True)

    plt.style.use('seaborn-v0_8-whitegrid')

    # -------------------------------------------------------------------------
    # Figure 1: Donation Rate by Transparency Level
    # -------------------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(8, 6))

    dr = results['chi2_transparency']['donation_rates']
    x = range(len(dr))

    bars = ax.bar(x, dr['Rate'],
                  yerr=[dr['Rate'] - dr['CI_Lower'], dr['CI_Upper'] - dr['Rate']],
                  capsize=8, color=['#3498db', '#e74c3c'], edgecolor='black', linewidth=1.2)

    ax.set_xticks(x)
    ax.set_xticklabels(dr['Group'])
    ax.set_ylabel('Donation Rate (%)', fontsize=12)
    ax.set_xlabel('Transparency Level', fontsize=12)
    ax.set_ylim(0, 100)

    # Add value labels
    for bar, rate in zip(bars, dr['Rate']):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 5,
                f'{rate:.1f}%', ha='center', fontsize=11, fontweight='bold')

    # Add test results
    r = results['chi2_transparency']
    sig_marker = '*' if r['significant'] else 'ns'
    ax.set_title(f"Donation Rate by Transparency Level\nχ²={r['chi2']:.2f}, p={r['p_value']:.4f} ({sig_marker}), V={r['cramers_v']:.3f}",
                 fontsize=12, fontweight='bold')

    plt.tight_layout()
    plt.savefig(f'{output_dir}/fig_chi2_transparency.png', dpi=150, bbox_inches='tight')
    plt.close()

    # -------------------------------------------------------------------------
    # Figure 2: Donation Rate by Control Level
    # -------------------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(8, 6))

    dr = results['chi2_control']['donation_rates']
    x = range(len(dr))

    bars = ax.bar(x, dr['Rate'],
                  yerr=[dr['Rate'] - dr['CI_Lower'], dr['CI_Upper'] - dr['Rate']],
                  capsize=8, color=['#9b59b6', '#2ecc71'], edgecolor='black', linewidth=1.2)

    ax.set_xticks(x)
    ax.set_xticklabels(dr['Group'])
    ax.set_ylabel('Donation Rate (%)', fontsize=12)
    ax.set_xlabel('Control Level', fontsize=12)
    ax.set_ylim(0, 100)

    for bar, rate in zip(bars, dr['Rate']):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 5,
                f'{rate:.1f}%', ha='center', fontsize=11, fontweight='bold')

    r = results['chi2_control']
    sig_marker = '*' if r['significant'] else 'ns'
    ax.set_title(f"Donation Rate by Control Level\nχ²={r['chi2']:.2f}, p={r['p_value']:.4f} ({sig_marker}), V={r['cramers_v']:.3f}",
                 fontsize=12, fontweight='bold')

    plt.tight_layout()
    plt.savefig(f'{output_dir}/fig_chi2_control.png', dpi=150, bbox_inches='tight')
    plt.close()

    # -------------------------------------------------------------------------
    # Figure 3: Donation Rate by Condition
    # -------------------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10, 6))

    dr = results['chi2_condition']['donation_rates']
    x = range(len(dr))
    colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']

    bars = ax.bar(x, dr['Rate'],
                  yerr=[dr['Rate'] - dr['CI_Lower'], dr['CI_Upper'] - dr['Rate']],
                  capsize=8, color=colors, edgecolor='black', linewidth=1.2)

    ax.set_xticks(x)
    ax.set_xticklabels(dr['Group'])
    ax.set_ylabel('Donation Rate (%)', fontsize=12)
    ax.set_xlabel('Condition', fontsize=12)
    ax.set_ylim(0, 100)

    for bar, rate in zip(bars, dr['Rate']):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 5,
                f'{rate:.1f}%', ha='center', fontsize=11, fontweight='bold')

    r = results['chi2_condition']
    sig_marker = '*' if r['significant'] else 'ns'
    ax.set_title(f"Donation Rate by Condition\nχ²={r['chi2']:.2f}, p={r['p_value']:.4f} ({sig_marker}), V={r['cramers_v']:.3f}",
                 fontsize=12, fontweight='bold')

    plt.tight_layout()
    plt.savefig(f'{output_dir}/fig_chi2_condition.png', dpi=150, bbox_inches='tight')
    plt.close()

    # -------------------------------------------------------------------------
    # Figure 4: Combined visualization
    # -------------------------------------------------------------------------
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))

    # Transparency
    dr = results['chi2_transparency']['donation_rates']
    axes[0].bar(range(len(dr)), dr['Rate'],
                yerr=[dr['Rate'] - dr['CI_Lower'], dr['CI_Upper'] - dr['Rate']],
                capsize=6, color=['#3498db', '#e74c3c'], edgecolor='black')
    axes[0].set_xticks(range(len(dr)))
    axes[0].set_xticklabels(['T0', 'T1'])
    axes[0].set_ylabel('Donation Rate (%)')
    axes[0].set_title('Transparency Effect')
    axes[0].set_ylim(0, 100)

    # Control
    dr = results['chi2_control']['donation_rates']
    axes[1].bar(range(len(dr)), dr['Rate'],
                yerr=[dr['Rate'] - dr['CI_Lower'], dr['CI_Upper'] - dr['Rate']],
                capsize=6, color=['#9b59b6', '#2ecc71'], edgecolor='black')
    axes[1].set_xticks(range(len(dr)))
    axes[1].set_xticklabels(['C0', 'C1'])
    axes[1].set_ylabel('Donation Rate (%)')
    axes[1].set_title('Control Effect')
    axes[1].set_ylim(0, 100)

    # Condition
    dr = results['chi2_condition']['donation_rates']
    axes[2].bar(range(len(dr)), dr['Rate'],
                yerr=[dr['Rate'] - dr['CI_Lower'], dr['CI_Upper'] - dr['Rate']],
                capsize=6, color=['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'], edgecolor='black')
    axes[2].set_xticks(range(len(dr)))
    axes[2].set_xticklabels(['A', 'B', 'C', 'D'])
    axes[2].set_ylabel('Donation Rate (%)')
    axes[2].set_title('All Conditions')
    axes[2].set_ylim(0, 100)

    plt.suptitle('Phase 2: Chi² Analysis - Donation Rates with 95% CI', fontsize=14, fontweight='bold', y=1.02)
    plt.tight_layout()
    plt.savefig(f'{output_dir}/fig_chi2_combined.png', dpi=150, bbox_inches='tight')
    plt.close()

    print(f"\nVisualizations saved to {output_dir}/")


# =============================================================================
# MAIN EXECUTION
# =============================================================================

def main(is_ai_participant: bool = True):
    """Main execution function for Phase 2 analysis."""

    # Initialize configuration
    config = AnalysisConfig(is_ai_participant=is_ai_participant)

    participant_label = "AI Test Users" if is_ai_participant else "Human Participants"
    print(f"\n{'='*70}")
    print(f"PHASE 2 ANALYSIS: {participant_label.upper()}")
    print(f"{'='*70}")

    # Load and prepare data
    print("\nLoading data...")
    df_raw = load_participant_data(config)
    df = prepare_variables(df_raw, config)

    # Apply exclusions (from Phase 1)
    sample_flow = compute_sample_flow(df)
    df_filtered = sample_flow['df_filtered']

    print(f"Final sample size: N = {len(df_filtered)}")

    # Run Phase 2 analysis
    results = run_phase2_analysis(df_filtered)

    # Create visualizations
    create_phase2_visualizations(results, './output/phase2')

    return results


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Phase 2: Chi² Analysis')
    parser.add_argument('--participant-type', choices=['ai', 'human'], default='ai',
                        help='Type of participants to analyze (default: ai)')

    args = parser.parse_args()
    is_ai = args.participant_type == 'ai'

    results = main(is_ai_participant=is_ai)
