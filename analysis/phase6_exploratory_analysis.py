"""
===============================================================================
PHASE 6: EXPLORATORY ANALYSIS
===============================================================================
Swiss Ballot Chatbot Study - Measurement Analysis
2x2 Factorial Design: Transparency (T0/T1) x Control (C0/C1)

This script performs exploratory analyses:
    6A. Dashboard behavior (C1 only: Conditions C & D)
        - Frequency analysis of dashboard variables
        - Chi-square tests comparing C vs D
    6B. Q14 Open Text ("What mattered most...")
        - Theme coding with keyword matching
        - Theme frequencies by condition and donation decision
        - Representative quotes

Author: Chatbot Study Analysis Pipeline
Date: January 2025
===============================================================================
"""

import os
import numpy as np
import pandas as pd
from typing import Dict, List
from collections import Counter
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

ALPHA = 0.05

# Theme codebook for Q14 analysis
THEME_CODEBOOK = {
    'transparency': ['transparent', 'clear', 'understand', 'know', 'information', 'explain', 'disclosure'],
    'control': ['control', 'choice', 'choose', 'decide', 'option', 'configure', 'granular'],
    'anonymity': ['anonymous', 'anonymity', 'identity', 'personal', 'identifiable', 'private'],
    'risk': ['risk', 'danger', 'unsafe', 'concern', 'worry', 'afraid', 'misuse'],
    'purpose': ['purpose', 'research', 'academic', 'science', 'commercial', 'profit'],
    'storage': ['storage', 'store', 'server', 'switzerland', 'local', 'location', 'where'],
    'retention': ['delete', 'retain', 'keep', 'time', 'duration', 'permanent', 'temporary'],
    'trust': ['trust', 'believe', 'reliable', 'credible', 'honest', 'trustworthy'],
    'civic': ['civic', 'citizen', 'democracy', 'vote', 'public', 'society', 'benefit'],
    'general_privacy': ['privacy', 'data protection', 'gdpr', 'sensitive']
}


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def cramers_v(contingency_table: np.ndarray) -> tuple:
    """Calculate Cramér's V effect size for a contingency table."""
    chi2 = stats.chi2_contingency(contingency_table)[0]
    n = contingency_table.sum()
    min_dim = min(contingency_table.shape) - 1
    V = np.sqrt(chi2 / (n * min_dim)) if (n * min_dim) > 0 else 0

    if V < 0.1:
        interpretation = "negligible"
    elif V < 0.2:
        interpretation = "small"
    elif V < 0.4:
        interpretation = "medium"
    else:
        interpretation = "large"

    return V, interpretation


def code_themes(text: str, codebook: dict) -> List[str]:
    """Identify themes in text based on keyword matching."""
    if pd.isna(text) or str(text).strip() == '':
        return []

    text_lower = str(text).lower()
    themes_found = []

    for theme, keywords in codebook.items():
        for keyword in keywords:
            if keyword in text_lower:
                themes_found.append(theme)
                break

    return themes_found


# =============================================================================
# PHASE 6A: DASHBOARD BEHAVIOR ANALYSIS
# =============================================================================

def analyze_dashboard_frequencies(df: pd.DataFrame) -> Dict:
    """
    Analyze dashboard option frequencies for conditions C and D.

    Args:
        df: Filtered participant DataFrame

    Returns:
        Dictionary with frequency tables
    """
    print("\n" + "="*70)
    print("PHASE 6A: DASHBOARD BEHAVIOR ANALYSIS")
    print("="*70)

    # Filter to C1 conditions only (C and D)
    df_c1 = df[df['control_level'] == 1].copy()
    print(f"\nC1 participants (Conditions C & D): n = {len(df_c1)}")
    print(f"  Condition C: n = {len(df_c1[df_c1['condition'] == 'C'])}")
    print(f"  Condition D: n = {len(df_c1[df_c1['condition'] == 'D'])}")

    dashboard_vars = ['dashboard_scope', 'dashboard_purpose', 'dashboard_storage', 'dashboard_retention']
    available_vars = [v for v in dashboard_vars if v in df_c1.columns]

    results = {'frequencies': {}, 'chi_square': []}

    for var in available_vars:
        print(f"\n--- {var.upper().replace('_', ' ')} ---")

        # Frequency by condition
        for condition in ['C', 'D']:
            cond_df = df_c1[df_c1['condition'] == condition]
            if len(cond_df) == 0:
                continue

            counts = cond_df[var].value_counts(dropna=False)
            total = len(cond_df)

            print(f"\n  Condition {condition} (n={total}):")
            for option, count in counts.items():
                print(f"    {option}: n={count} ({count/total*100:.1f}%)")

            results['frequencies'][f'{var}_{condition}'] = counts

        # Chi-square test C vs D
        try:
            ct = pd.crosstab(df_c1['condition'], df_c1[var])
            if ct.shape[0] > 1 and ct.shape[1] > 1:
                chi2, p, dof, expected = stats.chi2_contingency(ct)
                V, V_interp = cramers_v(ct.values)

                print(f"\n  Chi-square (C vs D): χ²({dof}) = {chi2:.3f}, p = {p:.4f}")
                print(f"  Cramér's V = {V:.3f} ({V_interp})")

                results['chi_square'].append({
                    'Variable': var,
                    'χ²': round(chi2, 3),
                    'df': dof,
                    'p': round(p, 4),
                    'Cramers_V': round(V, 3),
                    'Interpretation': V_interp
                })
        except Exception as e:
            print(f"  Chi-square test failed: {e}")

    return results


# =============================================================================
# PHASE 6B: Q14 OPEN TEXT ANALYSIS
# =============================================================================

def analyze_q14_themes(df: pd.DataFrame) -> Dict:
    """
    Analyze Q14 open-text responses for themes.

    Args:
        df: Filtered participant DataFrame

    Returns:
        Dictionary with theme analysis results
    """
    print("\n" + "="*70)
    print("PHASE 6B: Q14 OPEN TEXT ANALYSIS")
    print("="*70)

    # Find Q14 column
    q14_col = None
    for col in ['open_feedback', 'q14', 'Q14', 'q14_text']:
        if col in df.columns:
            q14_col = col
            break

    if not q14_col:
        print("\nQ14 column not found in dataset.")
        return {}

    results = {}

    # Response rate
    df['q14_non_empty'] = df[q14_col].notna() & (df[q14_col].astype(str).str.strip() != '')
    total_n = len(df)
    responses_n = df['q14_non_empty'].sum()
    response_rate = responses_n / total_n * 100

    print(f"\nResponse rate: {responses_n}/{total_n} ({response_rate:.1f}%)")

    # Apply theme coding
    df['themes'] = df[q14_col].apply(lambda x: code_themes(x, THEME_CODEBOOK))

    # Overall theme frequencies
    all_themes = []
    for themes_list in df['themes']:
        all_themes.extend(themes_list)

    theme_counts = Counter(all_themes)

    print("\n--- Overall Theme Frequencies ---")
    for theme, count in theme_counts.most_common():
        pct = count / responses_n * 100 if responses_n > 0 else 0
        print(f"  {theme}: n={count} ({pct:.1f}%)")

    results['overall_themes'] = dict(theme_counts)

    # Themes by condition
    print("\n--- Theme Frequencies by Condition ---")
    theme_by_condition = {}

    for cond in ['A', 'B', 'C', 'D']:
        cond_df = df[df['condition'] == cond]
        cond_themes = []
        for themes_list in cond_df['themes']:
            cond_themes.extend(themes_list)

        theme_by_condition[cond] = Counter(cond_themes)

    # Create comparison table
    comparison_data = []
    for theme in THEME_CODEBOOK.keys():
        row = {'Theme': theme}
        for cond in ['A', 'B', 'C', 'D']:
            n_cond = len(df[df['condition'] == cond])
            count = theme_by_condition[cond].get(theme, 0)
            pct = count / n_cond * 100 if n_cond > 0 else 0
            row[f'{cond} (%)'] = round(pct, 1)
        comparison_data.append(row)

    comparison_df = pd.DataFrame(comparison_data)
    print(comparison_df.to_string(index=False))
    results['themes_by_condition'] = comparison_df

    # Themes by donation decision
    print("\n--- Theme Frequencies by Donation Decision ---")
    decision_data = []

    for theme in THEME_CODEBOOK.keys():
        n_decline = len(df[df['donation_decision'] == 0])
        n_donate = len(df[df['donation_decision'] == 1])

        themes_decline = []
        for t in df[df['donation_decision'] == 0]['themes']:
            themes_decline.extend(t)
        themes_donate = []
        for t in df[df['donation_decision'] == 1]['themes']:
            themes_donate.extend(t)

        count_decline = Counter(themes_decline).get(theme, 0)
        count_donate = Counter(themes_donate).get(theme, 0)

        pct_decline = count_decline / n_decline * 100 if n_decline > 0 else 0
        pct_donate = count_donate / n_donate * 100 if n_donate > 0 else 0

        decision_data.append({
            'Theme': theme,
            'Decline (%)': round(pct_decline, 1),
            'Donate (%)': round(pct_donate, 1),
            'Δ (pp)': round(pct_donate - pct_decline, 1)
        })

    decision_df = pd.DataFrame(decision_data).sort_values('Δ (pp)', ascending=False)
    print(decision_df.to_string(index=False))
    results['themes_by_decision'] = decision_df

    # Representative quotes
    print("\n--- Representative Quotes ---")
    df_with_text = df[df['q14_non_empty']].copy()

    if len(df_with_text) > 0:
        quotes = []
        for cond in ['A', 'B', 'C', 'D']:
            cond_texts = df_with_text[df_with_text['condition'] == cond]
            if len(cond_texts) > 0:
                sample = cond_texts.iloc[0]
                quote_text = str(sample[q14_col])[:200]
                if len(str(sample[q14_col])) > 200:
                    quote_text += '...'

                quotes.append({
                    'Condition': cond,
                    'Donated': 'Yes' if sample['donation_decision'] == 1 else 'No',
                    'Quote': quote_text
                })

        for i, q in enumerate(quotes[:5], 1):
            print(f"\n{i}. [Condition {q['Condition']}, Donated: {q['Donated']}]")
            print(f"   \"{q['Quote']}\"")

        results['quotes'] = quotes

    # Condition contrasts (required by MEASUREMENT_PLAN)
    print("\n--- Condition Contrasts (Theme % Differences) ---")
    contrasts = [
        ('A', 'B', 'Effect of adding DNL (no dashboard)'),
        ('A', 'C', 'Effect of adding Dashboard (no DNL)'),
        ('C', 'D', 'Effect of adding DNL (with dashboard)'),
        ('B', 'D', 'Effect of adding Dashboard (with DNL)')
    ]

    contrast_results = []
    for cond1, cond2, description in contrasts:
        print(f"\n{cond1} vs {cond2}: {description}")

        n1 = len(df[df['condition'] == cond1])
        n2 = len(df[df['condition'] == cond2])

        differences = []
        for theme in THEME_CODEBOOK.keys():
            pct1 = theme_by_condition[cond1].get(theme, 0) / n1 * 100 if n1 > 0 else 0
            pct2 = theme_by_condition[cond2].get(theme, 0) / n2 * 100 if n2 > 0 else 0
            diff = pct2 - pct1
            if abs(diff) >= 5:  # Only show meaningful differences
                differences.append((theme, diff))

        if differences:
            differences.sort(key=lambda x: abs(x[1]), reverse=True)
            for theme, diff in differences[:5]:
                direction = '↑' if diff > 0 else '↓'
                print(f"  {theme}: {direction} {abs(diff):.1f} pp")
                contrast_results.append({
                    'Contrast': f'{cond1} vs {cond2}',
                    'Theme': theme,
                    'Δ (pp)': round(diff, 1)
                })
        else:
            print("  No meaningful differences (≥5 pp)")

    results['condition_contrasts'] = pd.DataFrame(contrast_results) if contrast_results else pd.DataFrame()

    return results


# =============================================================================
# OUTPUT GENERATION
# =============================================================================

def save_results(results: Dict, config: AnalysisConfig):
    """Save all Phase 6 results to output directory."""
    output_dir = os.path.join(os.path.dirname(__file__), './output/phase6')
    os.makedirs(output_dir, exist_ok=True)

    participant_type = 'ai' if config.is_ai_participant else 'human'

    # Save chi-square results
    if 'dashboard' in results and 'chi_square' in results['dashboard']:
        chi_df = pd.DataFrame(results['dashboard']['chi_square'])
        filepath = os.path.join(output_dir, f'phase6_dashboard_chi_square_{participant_type}.csv')
        chi_df.to_csv(filepath, index=False)
        print(f"[INFO] Saved: {filepath}")

    # Save theme tables
    if 'q14' in results:
        if 'themes_by_condition' in results['q14']:
            filepath = os.path.join(output_dir, f'phase6_themes_by_condition_{participant_type}.csv')
            results['q14']['themes_by_condition'].to_csv(filepath, index=False)
            print(f"[INFO] Saved: {filepath}")

        if 'themes_by_decision' in results['q14']:
            filepath = os.path.join(output_dir, f'phase6_themes_by_decision_{participant_type}.csv')
            results['q14']['themes_by_decision'].to_csv(filepath, index=False)
            print(f"[INFO] Saved: {filepath}")

        if 'condition_contrasts' in results['q14'] and len(results['q14']['condition_contrasts']) > 0:
            filepath = os.path.join(output_dir, f'phase6_condition_contrasts_{participant_type}.csv')
            results['q14']['condition_contrasts'].to_csv(filepath, index=False)
            print(f"[INFO] Saved: {filepath}")


# =============================================================================
# MAIN EXECUTION
# =============================================================================

def run_phase6_analysis(is_ai_participant: bool = True) -> Dict:
    """
    Run complete Phase 6 exploratory analysis.

    Args:
        is_ai_participant: True for AI participants, False for human participants

    Returns:
        Dictionary containing all analysis results
    """
    print("="*70)
    print("PHASE 6: EXPLORATORY ANALYSIS")
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

    # 6A Dashboard behavior
    results['dashboard'] = analyze_dashboard_frequencies(df_filtered)

    # 6B Q14 themes
    results['q14'] = analyze_q14_themes(df_filtered)

    # Save results
    save_results(results, config)

    print("\n" + "="*70)
    print("PHASE 6 ANALYSIS COMPLETE")
    print("="*70)

    return results


# =============================================================================
# SCRIPT ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Phase 6: Exploratory Analysis')
    parser.add_argument(
        '--participant-type',
        choices=['ai', 'human'],
        default='ai',
        help='Type of participants to analyze (default: ai)'
    )

    args = parser.parse_args()
    results = run_phase6_analysis(is_ai_participant=(args.participant_type == 'ai'))
