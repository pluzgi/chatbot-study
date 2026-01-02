"""
===============================================================================
PHASE 1: DESCRIPTIVE STATISTICS
===============================================================================
Swiss Ballot Chatbot Study - Measurement Analysis
2x2 Factorial Design: Transparency (T0/T1) x Control (C0/C1)

Conditions:
    A = T0C0 (Low Transparency, Low Control)
    B = T1C0 (High Transparency, Low Control)
    C = T0C1 (Low Transparency, High Control)
    D = T1C1 (High Transparency, High Control)

This script computes:
    1. Sample flow & exclusions
    2. N per condition (A/B/C/D)
    3. Donation rate per condition + 95% CI (Wilson)
    4. Demographics (overall; by condition if needed)
    5. Manipulation checks (MC-T, MC-C) by condition and T/C level
    6. Dashboard option frequencies (C/D only)
    7. Risk + Trust descriptives by condition
    8. Q14 free-text response rate

Author: Chatbot Study Analysis Pipeline
Date: January 2025
===============================================================================
"""

import os
import json
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from dotenv import load_dotenv
from sqlalchemy import create_engine

# =============================================================================
# CONFIGURATION
# =============================================================================

@dataclass
class AnalysisConfig:
    """Configuration for the analysis pipeline."""

    # Participant filter: True = AI participants, False = Human participants
    is_ai_participant: bool = True

    # Condition mappings
    CONDITIONS = ['A', 'B', 'C', 'D']

    # Transparency level by condition (T0=0, T1=1)
    # A (T0C0), B (T1C0), C (T0C1), D (T1C1)
    TRANSPARENCY_MAP = {'A': 0, 'B': 1, 'C': 0, 'D': 1}

    # Control level by condition (C0=0, C1=1)
    CONTROL_MAP = {'A': 0, 'B': 0, 'C': 1, 'D': 1}

    # Correct attention check answer (Q8: "This chatbot helps with questions about:")
    # Correct answer is 'voting' (about Swiss voting ballots)
    ATTENTION_CHECK_CORRECT = 'voting'

    # Output directory for results (relative to this script)
    output_dir: str = './output/phase1'


def get_db_connection():
    """
    Establish database connection using SQLAlchemy engine.

    Uses the same .env file structure as the backend:
        DATABASE_HOST, DATABASE_PORT, DATABASE_NAME,
        DATABASE_USER, DATABASE_PASSWORD

    Returns:
        SQLAlchemy engine object (compatible with pandas)
    """
    # Load environment variables from backend .env file
    backend_env_path = os.path.join(
        os.path.dirname(__file__),
        '../backend/.env'
    )
    load_dotenv(backend_env_path)

    # Build SQLAlchemy connection string
    host = os.getenv('DATABASE_HOST', 'localhost')
    port = os.getenv('DATABASE_PORT', '5432')
    database = os.getenv('DATABASE_NAME', 'chatbot_study')
    user = os.getenv('DATABASE_USER', 'admin')
    password = os.getenv('DATABASE_PASSWORD', '')

    connection_string = f"postgresql://{user}:{password}@{host}:{port}/{database}"
    engine = create_engine(connection_string)
    return engine


# =============================================================================
# DATA LOADING
# =============================================================================

def load_participant_data(config: AnalysisConfig) -> pd.DataFrame:
    """
    Load participant data from database.

    Joins participants table with post_task_measures to get all required
    variables for analysis.

    Args:
        config: Analysis configuration (determines AI vs human participants)

    Returns:
        DataFrame with all participant data
    """
    # Query to load all relevant data
    # Filter by is_ai_participant based on config
    query = f"""
    SELECT
        -- Core identifiers
        p.id AS participant_id,
        p.session_id,
        p.condition,
        p.language,
        p.current_phase,
        p.is_ai_participant,

        -- Donation decision (convert to binary)
        CASE
            WHEN p.donation_decision = 'donate' THEN 1
            WHEN p.donation_decision = 'decline' THEN 0
            ELSE NULL
        END AS donation_decision,

        -- Dashboard configuration (conditions C/D only)
        p.donation_config,

        -- Timestamps
        p.created_at,
        p.completed_at,
        p.decision_at,

        -- Post-task measures: Manipulation checks (MC-T, MC-C)
        ptm.transparency1,  -- MC-T item 1
        ptm.transparency2,  -- MC-T item 2
        ptm.control1,       -- MC-C item 1
        ptm.control2,       -- MC-C item 2

        -- Risk perception (OUT-RISK)
        ptm.risk_traceability,  -- OUT-RISK item 1
        ptm.risk_misuse,        -- OUT-RISK item 2

        -- Trust (OUT-TRUST)
        ptm.trust1,

        -- Attention check
        ptm.attention_check,

        -- Demographics
        ptm.age,
        ptm.gender,
        ptm.primary_language,
        ptm.education,
        ptm.eligible_to_vote_ch,

        -- Open feedback (Q14)
        ptm.open_feedback

    FROM participants p
    LEFT JOIN post_task_measures ptm ON p.id = ptm.participant_id
    WHERE p.is_ai_participant = {'TRUE' if config.is_ai_participant else 'FALSE'}
    ORDER BY p.created_at
    """

    engine = get_db_connection()
    df = pd.read_sql(query, engine)
    engine.dispose()

    print(f"[INFO] Loaded {len(df)} {'AI' if config.is_ai_participant else 'human'} participants from database")

    return df


def prepare_variables(df: pd.DataFrame, config: AnalysisConfig) -> pd.DataFrame:
    """
    Create derived variables required for analysis.

    Creates:
        - transparency_level (T): 0 or 1 based on condition
        - control_level (C): 0 or 1 based on condition
        - T_x_C: Interaction term T * C
        - mc_transparency: Mean of transparency1 and transparency2
        - mc_control: Mean of control1 and control2
        - out_risk: Mean of risk_traceability and risk_misuse
        - attention_check_correct: Binary indicator for correct attention check

    Args:
        df: Raw participant DataFrame
        config: Analysis configuration

    Returns:
        DataFrame with additional derived variables
    """
    df = df.copy()

    # Create transparency and control level indicators from condition
    df['transparency_level'] = df['condition'].map(config.TRANSPARENCY_MAP)
    df['control_level'] = df['condition'].map(config.CONTROL_MAP)

    # Create interaction term
    df['T_x_C'] = df['transparency_level'] * df['control_level']

    # Create composite scores for manipulation checks
    # mc_transparency = mean of MC-T items (transparency1, transparency2)
    df['mc_transparency'] = df[['transparency1', 'transparency2']].mean(axis=1)

    # mc_control = mean of MC-C items (control1, control2)
    df['mc_control'] = df[['control1', 'control2']].mean(axis=1)

    # out_risk = mean of OUT-RISK items
    df['out_risk'] = df[['risk_traceability', 'risk_misuse']].mean(axis=1)

    # Attention check: mark as correct if answer matches expected
    df['attention_check_correct'] = (
        df['attention_check'].str.lower() == config.ATTENTION_CHECK_CORRECT.lower()
    ).astype(int)

    # Parse dashboard configuration JSON for conditions C/D
    def parse_dashboard_config(config_json):
        """Extract dashboard selections from JSON configuration."""
        if pd.isna(config_json) or config_json is None:
            return {}
        if isinstance(config_json, str):
            try:
                return json.loads(config_json)
            except json.JSONDecodeError:
                return {}
        return config_json if isinstance(config_json, dict) else {}

    df['dashboard_parsed'] = df['donation_config'].apply(parse_dashboard_config)

    # Extract individual dashboard variables
    df['dashboard_scope'] = df['dashboard_parsed'].apply(lambda x: x.get('scope'))
    df['dashboard_purpose'] = df['dashboard_parsed'].apply(lambda x: x.get('purpose'))
    df['dashboard_storage'] = df['dashboard_parsed'].apply(lambda x: x.get('storage'))
    df['dashboard_retention'] = df['dashboard_parsed'].apply(lambda x: x.get('retention'))

    print("[INFO] Created derived variables: transparency_level, control_level, T_x_C, "
          "mc_transparency, mc_control, out_risk, attention_check_correct, dashboard fields")

    return df


# =============================================================================
# PHASE 1.1: SAMPLE FLOW & EXCLUSIONS
# =============================================================================

def compute_sample_flow(df: pd.DataFrame) -> Dict:
    """
    Compute sample flow statistics and apply exclusion criteria.

    Exclusion criteria:
        1. Failed attention check (attention_check_correct = 0)
        2. Missing condition
        3. Missing donation_decision

    Args:
        df: Full participant DataFrame

    Returns:
        Dictionary with sample flow statistics and filtered DataFrame
    """
    results = {
        'initial_n': len(df),
        'excluded_attention': 0,
        'excluded_missing_condition': 0,
        'excluded_missing_donation': 0,
        'final_n': 0,
        'df_filtered': None
    }

    # Track exclusions step by step
    df_filtered = df.copy()

    # Step 1: Exclude failed attention checks
    failed_attention = df_filtered['attention_check_correct'] == 0
    results['excluded_attention'] = failed_attention.sum()
    df_filtered = df_filtered[~failed_attention]

    # Step 2: Exclude missing condition
    missing_condition = df_filtered['condition'].isna()
    results['excluded_missing_condition'] = missing_condition.sum()
    df_filtered = df_filtered[~missing_condition]

    # Step 3: Exclude missing donation_decision
    missing_donation = df_filtered['donation_decision'].isna()
    results['excluded_missing_donation'] = missing_donation.sum()
    df_filtered = df_filtered[~missing_donation]

    results['final_n'] = len(df_filtered)
    results['df_filtered'] = df_filtered

    # Print summary
    print("\n" + "="*60)
    print("PHASE 1.1: SAMPLE FLOW & EXCLUSIONS")
    print("="*60)
    print(f"Initial N:                        {results['initial_n']:>6}")
    print(f"Excluded (failed attention):      {results['excluded_attention']:>6}")
    print(f"Excluded (missing condition):     {results['excluded_missing_condition']:>6}")
    print(f"Excluded (missing donation):      {results['excluded_missing_donation']:>6}")
    print("-"*60)
    print(f"Final N for analysis:             {results['final_n']:>6}")

    return results


def format_sample_flow_table(results: Dict) -> pd.DataFrame:
    """
    Format sample flow as a table for reporting.

    Args:
        results: Dictionary from compute_sample_flow()

    Returns:
        DataFrame formatted for output
    """
    data = [
        {'Stage': 'Initial N', 'N': results['initial_n'], 'Excluded': '-'},
        {'Stage': 'After attention check exclusion',
         'N': results['initial_n'] - results['excluded_attention'],
         'Excluded': results['excluded_attention']},
        {'Stage': 'After missing condition exclusion',
         'N': results['initial_n'] - results['excluded_attention'] - results['excluded_missing_condition'],
         'Excluded': results['excluded_missing_condition']},
        {'Stage': 'After missing donation exclusion (Final)',
         'N': results['final_n'],
         'Excluded': results['excluded_missing_donation']},
    ]
    return pd.DataFrame(data)


# =============================================================================
# PHASE 1.2: N PER CONDITION
# =============================================================================

def compute_n_per_condition(df: pd.DataFrame) -> pd.DataFrame:
    """
    Count participants per condition with percentage share.

    Args:
        df: Filtered participant DataFrame

    Returns:
        DataFrame with condition, n, and percentage
    """
    total_n = len(df)

    # Count by condition
    counts = df['condition'].value_counts().reindex(['A', 'B', 'C', 'D'], fill_value=0)

    # Create results table
    results = pd.DataFrame({
        'Condition': counts.index,
        'n': counts.values,
        '%': (counts.values / total_n * 100).round(1)
    })

    # Add total row
    total_row = pd.DataFrame({
        'Condition': ['Total'],
        'n': [total_n],
        '%': [100.0]
    })
    results = pd.concat([results, total_row], ignore_index=True)

    print("\n" + "="*60)
    print("PHASE 1.2: N PER CONDITION")
    print("="*60)
    print(results.to_string(index=False))

    return results


# =============================================================================
# PHASE 1.3: DONATION RATE + 95% CI (WILSON)
# =============================================================================

def wilson_ci(successes: int, n: int, alpha: float = 0.05) -> Tuple[float, float]:
    """
    Compute Wilson confidence interval for a proportion.

    The Wilson score interval is preferred for proportions because it:
        - Has better coverage properties than the normal approximation
        - Works well for small samples and extreme proportions

    Args:
        successes: Number of successes (donations)
        n: Total sample size
        alpha: Significance level (default 0.05 for 95% CI)

    Returns:
        Tuple of (lower bound, upper bound)
    """
    from scipy import stats

    if n == 0:
        return (0.0, 0.0)

    p = successes / n
    z = stats.norm.ppf(1 - alpha / 2)

    denominator = 1 + z**2 / n
    centre = p + z**2 / (2 * n)
    margin = z * np.sqrt((p * (1 - p) + z**2 / (4 * n)) / n)

    lower = (centre - margin) / denominator
    upper = (centre + margin) / denominator

    return (max(0, lower), min(1, upper))


def compute_donation_rates(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute donation rate per condition with 95% Wilson CI.

    Args:
        df: Filtered participant DataFrame

    Returns:
        DataFrame with condition, n, donation_rate, 95% CI
    """
    results = []

    # Overall rate
    overall_n = len(df)
    overall_donations = df['donation_decision'].sum()
    overall_rate = overall_donations / overall_n if overall_n > 0 else 0
    overall_ci = wilson_ci(int(overall_donations), overall_n)

    # Per condition
    for condition in ['A', 'B', 'C', 'D']:
        condition_df = df[df['condition'] == condition]
        n = len(condition_df)
        donations = condition_df['donation_decision'].sum()
        rate = donations / n if n > 0 else 0
        ci = wilson_ci(int(donations), n)

        results.append({
            'Condition': condition,
            'n': n,
            'Donations': int(donations),
            'Rate (%)': round(rate * 100, 1),
            '95% CI Lower': round(ci[0] * 100, 1),
            '95% CI Upper': round(ci[1] * 100, 1),
            '95% CI': f"[{round(ci[0] * 100, 1)}, {round(ci[1] * 100, 1)}]"
        })

    # Add overall row
    results.append({
        'Condition': 'Overall',
        'n': overall_n,
        'Donations': int(overall_donations),
        'Rate (%)': round(overall_rate * 100, 1),
        '95% CI Lower': round(overall_ci[0] * 100, 1),
        '95% CI Upper': round(overall_ci[1] * 100, 1),
        '95% CI': f"[{round(overall_ci[0] * 100, 1)}, {round(overall_ci[1] * 100, 1)}]"
    })

    results_df = pd.DataFrame(results)

    print("\n" + "="*60)
    print("PHASE 1.3: DONATION RATE PER CONDITION + 95% CI")
    print("="*60)
    print(results_df[['Condition', 'n', 'Donations', 'Rate (%)', '95% CI']].to_string(index=False))

    return results_df


# =============================================================================
# PHASE 1.4: DEMOGRAPHICS
# =============================================================================

def compute_demographics(df: pd.DataFrame, by_condition: bool = False) -> Dict[str, pd.DataFrame]:
    """
    Compute demographic distributions.

    Demographics analyzed:
        - Age group
        - Gender
        - Primary language
        - Education
        - Voting eligibility (Switzerland)

    Args:
        df: Filtered participant DataFrame
        by_condition: If True, also compute cross-tabulation by condition

    Returns:
        Dictionary of DataFrames for each demographic variable
    """
    demographics = {}
    demo_vars = ['age', 'gender', 'primary_language', 'education', 'eligible_to_vote_ch']

    print("\n" + "="*60)
    print("PHASE 1.4: DEMOGRAPHICS (OVERALL)")
    print("="*60)

    for var in demo_vars:
        if var in df.columns:
            # Overall distribution
            counts = df[var].value_counts(dropna=False)
            total = len(df)

            demo_df = pd.DataFrame({
                'Category': counts.index,
                'n': counts.values,
                '%': (counts.values / total * 100).round(1)
            })
            demographics[f'{var}_overall'] = demo_df

            print(f"\n{var.upper().replace('_', ' ')}:")
            print(demo_df.to_string(index=False))

            # By condition (if requested)
            if by_condition:
                crosstab = pd.crosstab(
                    df[var],
                    df['condition'],
                    margins=True,
                    margins_name='Total'
                )
                demographics[f'{var}_by_condition'] = crosstab

    return demographics


# =============================================================================
# PHASE 1.5: MANIPULATION CHECKS (MC-T, MC-C)
# =============================================================================

def compute_manipulation_checks(df: pd.DataFrame) -> Dict[str, pd.DataFrame]:
    """
    Compute manipulation check summaries.

    Computes mean and SD for:
        - mc_transparency (MC-T) by condition (A/B/C/D) and by T level (T0 vs T1)
        - mc_control (MC-C) by condition (A/B/C/D) and by C level (C0 vs C1)

    Args:
        df: Filtered participant DataFrame

    Returns:
        Dictionary of summary DataFrames
    """
    results = {}

    print("\n" + "="*60)
    print("PHASE 1.5: MANIPULATION CHECKS")
    print("="*60)

    # --- MC-T (Perceived Transparency) ---
    print("\nMC-T (PERCEIVED TRANSPARENCY) BY CONDITION:")
    mc_t_by_condition = df.groupby('condition')['mc_transparency'].agg(['mean', 'std', 'count'])
    mc_t_by_condition.columns = ['Mean', 'SD', 'n']
    mc_t_by_condition = mc_t_by_condition.round(2)
    print(mc_t_by_condition)
    results['mc_t_by_condition'] = mc_t_by_condition

    print("\nMC-T BY TRANSPARENCY LEVEL (T0 vs T1):")
    mc_t_by_t = df.groupby('transparency_level')['mc_transparency'].agg(['mean', 'std', 'count'])
    mc_t_by_t.columns = ['Mean', 'SD', 'n']
    mc_t_by_t.index = ['T0 (Low)', 'T1 (High)']
    mc_t_by_t = mc_t_by_t.round(2)
    print(mc_t_by_t)
    results['mc_t_by_t_level'] = mc_t_by_t

    # --- MC-C (Perceived Control) ---
    print("\nMC-C (PERCEIVED CONTROL) BY CONDITION:")
    mc_c_by_condition = df.groupby('condition')['mc_control'].agg(['mean', 'std', 'count'])
    mc_c_by_condition.columns = ['Mean', 'SD', 'n']
    mc_c_by_condition = mc_c_by_condition.round(2)
    print(mc_c_by_condition)
    results['mc_c_by_condition'] = mc_c_by_condition

    print("\nMC-C BY CONTROL LEVEL (C0 vs C1):")
    mc_c_by_c = df.groupby('control_level')['mc_control'].agg(['mean', 'std', 'count'])
    mc_c_by_c.columns = ['Mean', 'SD', 'n']
    mc_c_by_c.index = ['C0 (Low)', 'C1 (High)']
    mc_c_by_c = mc_c_by_c.round(2)
    print(mc_c_by_c)
    results['mc_c_by_c_level'] = mc_c_by_c

    return results


# =============================================================================
# PHASE 1.6: RISK + TRUST DESCRIPTIVES
# =============================================================================

def compute_risk_trust(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute Risk and Trust descriptive statistics by condition.

    Variables:
        - out_risk: Composite of risk_traceability and risk_misuse (Likert 1-6)
        - trust1: Single trust item (Likert 1-6)

    Args:
        df: Filtered participant DataFrame

    Returns:
        DataFrame with mean/SD for OUT-RISK and OUT-TRUST by condition
    """
    print("\n" + "="*60)
    print("PHASE 1.6: RISK + TRUST DESCRIPTIVES")
    print("="*60)

    # Compute by condition
    risk_by_condition = df.groupby('condition')['out_risk'].agg(['mean', 'std'])
    risk_by_condition.columns = ['OUT-RISK Mean', 'OUT-RISK SD']

    trust_by_condition = df.groupby('condition')['trust1'].agg(['mean', 'std'])
    trust_by_condition.columns = ['OUT-TRUST Mean', 'OUT-TRUST SD']

    # Combine
    results = pd.concat([risk_by_condition, trust_by_condition], axis=1).round(2)

    # Add overall
    overall = pd.DataFrame({
        'OUT-RISK Mean': [df['out_risk'].mean()],
        'OUT-RISK SD': [df['out_risk'].std()],
        'OUT-TRUST Mean': [df['trust1'].mean()],
        'OUT-TRUST SD': [df['trust1'].std()]
    }, index=['Overall']).round(2)

    results = pd.concat([results, overall])

    print(results)

    return results


# =============================================================================
# PHASE 1.7: DASHBOARD OPTION FREQUENCIES (C/D ONLY)
# =============================================================================

def compute_dashboard_frequencies(df: pd.DataFrame) -> Dict[str, pd.DataFrame]:
    """
    Compute dashboard option frequencies for conditions C and D only.

    Dashboard variables:
        - dashboard_scope
        - dashboard_purpose
        - dashboard_storage
        - dashboard_retention

    Args:
        df: Filtered participant DataFrame

    Returns:
        Dictionary of frequency tables for each dashboard variable
    """
    print("\n" + "="*60)
    print("PHASE 1.7: DASHBOARD OPTION FREQUENCIES (CONDITIONS C & D)")
    print("="*60)

    results = {}
    dashboard_vars = ['dashboard_scope', 'dashboard_purpose', 'dashboard_storage', 'dashboard_retention']

    # Filter to conditions C and D only (control = 1)
    # AND only participants who donated (they have dashboard selections)
    df_cd = df[(df['condition'].isin(['C', 'D'])) & (df['donation_decision'] == 1)].copy()

    if len(df_cd) == 0:
        print("No participants in conditions C or D who donated")
        return results

    print(f"Note: Dashboard analysis includes only donors (C: n={len(df_cd[df_cd['condition']=='C'])}, D: n={len(df_cd[df_cd['condition']=='D'])})")

    for var in dashboard_vars:
        if var not in df.columns:
            continue

        print(f"\n{var.upper().replace('_', ' ')}:")

        # Create crosstab by condition
        for condition in ['C', 'D']:
            condition_df = df_cd[df_cd['condition'] == condition]
            if len(condition_df) == 0:
                continue

            counts = condition_df[var].value_counts(dropna=False)
            total = len(condition_df)

            freq_df = pd.DataFrame({
                'Option': counts.index,
                'n': counts.values,
                '%': (counts.values / total * 100).round(1)
            })

            print(f"\n  Condition {condition} (n={total}):")
            print(freq_df.to_string(index=False))

            results[f'{var}_{condition}'] = freq_df

    # Top 5 configurations (most frequent combinations)
    print("\nTOP 5 DASHBOARD CONFIGURATIONS:")
    df_cd['dashboard_config_str'] = df_cd.apply(
        lambda row: f"scope={row['dashboard_scope']}, purpose={row['dashboard_purpose']}, "
                   f"storage={row['dashboard_storage']}, retention={row['dashboard_retention']}",
        axis=1
    )

    for condition in ['C', 'D']:
        condition_df = df_cd[df_cd['condition'] == condition]
        if len(condition_df) == 0:
            continue

        config_counts = condition_df['dashboard_config_str'].value_counts().head(5)
        total = len(condition_df)

        print(f"\n  Condition {condition} Top 5 Configurations:")
        for i, (config, count) in enumerate(config_counts.items(), 1):
            print(f"    {i}. {config}: n={count} ({count/total*100:.1f}%)")

    return results


# =============================================================================
# PHASE 1.8: Q14 FREE-TEXT RESPONSE RATE
# =============================================================================

def compute_q14_response_rate(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute Q14 free-text response rate by condition and overall.

    Also computes median character length of non-empty responses.

    Args:
        df: Filtered participant DataFrame

    Returns:
        DataFrame with response rates
    """
    print("\n" + "="*60)
    print("PHASE 1.8: Q14 FREE-TEXT RESPONSE RATE")
    print("="*60)

    results = []

    # Check if open_feedback column exists
    if 'open_feedback' not in df.columns:
        print("Warning: open_feedback column not found")
        return pd.DataFrame()

    # Define non-empty response
    df['q14_non_empty'] = df['open_feedback'].notna() & (df['open_feedback'].str.strip() != '')
    df['q14_char_length'] = df['open_feedback'].fillna('').str.len()

    # Overall
    overall_n = len(df)
    overall_responses = df['q14_non_empty'].sum()
    overall_rate = overall_responses / overall_n * 100 if overall_n > 0 else 0
    overall_median_len = df.loc[df['q14_non_empty'], 'q14_char_length'].median()

    # Per condition
    for condition in ['A', 'B', 'C', 'D']:
        condition_df = df[df['condition'] == condition]
        n = len(condition_df)
        responses = condition_df['q14_non_empty'].sum()
        rate = responses / n * 100 if n > 0 else 0
        median_len = condition_df.loc[condition_df['q14_non_empty'], 'q14_char_length'].median()

        results.append({
            'Condition': condition,
            'n': n,
            'Responses': int(responses),
            'Response Rate (%)': round(rate, 1),
            'Median Char Length': int(median_len) if pd.notna(median_len) else 0
        })

    # Add overall
    results.append({
        'Condition': 'Overall',
        'n': overall_n,
        'Responses': int(overall_responses),
        'Response Rate (%)': round(overall_rate, 1),
        'Median Char Length': int(overall_median_len) if pd.notna(overall_median_len) else 0
    })

    results_df = pd.DataFrame(results)
    print(results_df.to_string(index=False))

    return results_df


# =============================================================================
# OUTPUT GENERATION
# =============================================================================

def save_results(results: Dict, config: AnalysisConfig):
    """
    Save all results to output directory as CSV and JSON.

    Args:
        results: Dictionary of all result DataFrames
        config: Analysis configuration
    """
    output_dir = os.path.join(os.path.dirname(__file__), config.output_dir)
    os.makedirs(output_dir, exist_ok=True)

    participant_type = 'ai' if config.is_ai_participant else 'human'

    for name, data in results.items():
        if isinstance(data, pd.DataFrame):
            filepath = os.path.join(output_dir, f'phase1_{name}_{participant_type}.csv')
            data.to_csv(filepath, index=True)
            print(f"[INFO] Saved: {filepath}")

    # Save summary JSON for web visualization
    summary = {
        'participant_type': participant_type,
        'analysis_phase': 'Phase 1: Descriptive Statistics'
    }

    # Add key metrics to summary
    if 'donation_rates' in results:
        dr = results['donation_rates']
        summary['donation_rates'] = dr.to_dict('records')

    if 'n_per_condition' in results:
        summary['n_per_condition'] = results['n_per_condition'].to_dict('records')

    summary_path = os.path.join(output_dir, f'phase1_summary_{participant_type}.json')
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2, default=str)
    print(f"[INFO] Saved summary: {summary_path}")


# =============================================================================
# MAIN EXECUTION
# =============================================================================

def run_phase1_analysis(is_ai_participant: bool = True) -> Dict:
    """
    Run complete Phase 1 descriptive statistics analysis.

    Args:
        is_ai_participant: True for AI participants, False for human participants

    Returns:
        Dictionary containing all analysis results
    """
    print("="*70)
    print("PHASE 1: DESCRIPTIVE STATISTICS")
    print(f"Participant Type: {'AI Test Users' if is_ai_participant else 'Human Participants'}")
    print("="*70)

    # Initialize configuration
    config = AnalysisConfig(is_ai_participant=is_ai_participant)

    # Load and prepare data
    df_raw = load_participant_data(config)
    df = prepare_variables(df_raw, config)

    # Store all results
    results = {}

    # 1. Sample flow & exclusions
    sample_flow = compute_sample_flow(df)
    df_filtered = sample_flow['df_filtered']
    results['sample_flow'] = format_sample_flow_table(sample_flow)

    # 2. N per condition
    results['n_per_condition'] = compute_n_per_condition(df_filtered)

    # 3. Donation rates + 95% CI
    results['donation_rates'] = compute_donation_rates(df_filtered)

    # 4. Demographics
    demographics = compute_demographics(df_filtered, by_condition=False)
    results.update(demographics)

    # 5. Manipulation checks
    manipulation_checks = compute_manipulation_checks(df_filtered)
    results.update(manipulation_checks)

    # 6. Risk + Trust
    results['risk_trust'] = compute_risk_trust(df_filtered)

    # 7. Dashboard frequencies (C/D only)
    dashboard_freq = compute_dashboard_frequencies(df_filtered)
    results.update(dashboard_freq)

    # 8. Q14 response rate
    results['q14_response_rate'] = compute_q14_response_rate(df_filtered)

    # Save results
    save_results(results, config)

    print("\n" + "="*70)
    print("PHASE 1 ANALYSIS COMPLETE")
    print("="*70)

    return results


# =============================================================================
# SCRIPT ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description='Phase 1: Descriptive Statistics Analysis'
    )
    parser.add_argument(
        '--participant-type',
        choices=['ai', 'human'],
        default='ai',
        help='Type of participants to analyze (default: ai)'
    )

    args = parser.parse_args()

    # Run analysis
    results = run_phase1_analysis(
        is_ai_participant=(args.participant_type == 'ai')
    )
