"""
===============================================================================
PHASE 4: DEEPER EFFECT ANALYSIS
===============================================================================
Swiss Ballot Chatbot Study - Measurement Analysis
2x2 Factorial Design: Transparency (T0/T1) x Control (C0/C1)

This script computes:
    1. Predicted probabilities of donation for each condition A/B/C/D
    2. Marginal effects (Δ probability) for T and C
    3. Simple effects analysis (if T×C interaction is significant)
    4. Interaction interpretation (synergistic, antagonistic, or additive)

Author: Chatbot Study Analysis Pipeline
Date: January 2025
===============================================================================
"""

import os
import numpy as np
import pandas as pd
from typing import Dict, Tuple
import statsmodels.api as sm
from statsmodels.discrete.discrete_model import Logit

# Import from Phase 1
from phase1_descriptive_statistics import (
    AnalysisConfig,
    load_participant_data,
    prepare_variables,
    compute_sample_flow,
    wilson_ci
)

# =============================================================================
# CONFIGURATION
# =============================================================================

ALPHA = 0.05  # Significance threshold


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def predict_probability(model, T: int, C: int) -> Tuple[float, float, float, float]:
    """
    Calculate predicted probability and SE using delta method.

    Args:
        model: Fitted logistic regression model
        T: Transparency level (0 or 1)
        C: Control level (0 or 1)

    Returns:
        Tuple of (probability, standard_error, ci_lower, ci_upper)
    """
    TxC = T * C
    X = np.array([1, T, C, TxC])

    # Predicted probability
    linear_pred = np.dot(X, model.params)
    prob = 1 / (1 + np.exp(-linear_pred))

    # Standard error using delta method
    cov_matrix = model.cov_params()
    var_linear = np.dot(np.dot(X, cov_matrix), X)
    se_prob = prob * (1 - prob) * np.sqrt(var_linear)

    # 95% CI
    ci_lower = max(0, prob - 1.96 * se_prob)
    ci_upper = min(1, prob + 1.96 * se_prob)

    return prob, se_prob, ci_lower, ci_upper


def calculate_marginal_effect(model, df: pd.DataFrame, variable: str) -> Tuple[float, float]:
    """
    Calculate average marginal effect for a binary variable.

    AME = average change in predicted probability when variable changes from 0 to 1.

    Args:
        model: Fitted logistic regression model
        df: DataFrame with participant data
        variable: Name of variable ('transparency_level' or 'control_level')

    Returns:
        Tuple of (average_marginal_effect, standard_error)
    """
    beta = model.params
    marginal_effects = []

    for idx, row in df.iterrows():
        T = row['transparency_level']
        C = row['control_level']

        if variable == 'transparency_level':
            X0 = np.array([1, 0, C, 0 * C])
            X1 = np.array([1, 1, C, 1 * C])
        else:  # control_level
            X0 = np.array([1, T, 0, T * 0])
            X1 = np.array([1, T, 1, T * 1])

        p0 = 1 / (1 + np.exp(-np.dot(X0, beta)))
        p1 = 1 / (1 + np.exp(-np.dot(X1, beta)))

        marginal_effects.append(p1 - p0)

    ame = np.mean(marginal_effects)
    se_ame = np.std(marginal_effects) / np.sqrt(len(marginal_effects))

    return ame, se_ame


# =============================================================================
# PHASE 4.1: PREDICTED PROBABILITIES BY CONDITION
# =============================================================================

def compute_predicted_probabilities(model, df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate predicted probabilities for each condition from Model 4.

    Args:
        model: Fitted Model 4 (T + C + T×C)
        df: Filtered participant DataFrame

    Returns:
        DataFrame with predicted probabilities and CIs
    """
    print("\n" + "="*70)
    print("PHASE 4.1: PREDICTED PROBABILITIES BY CONDITION")
    print("="*70)

    conditions = {
        'A': (0, 0),  # T0C0
        'B': (1, 0),  # T1C0
        'C': (0, 1),  # T0C1
        'D': (1, 1)   # T1C1
    }

    results = []
    for cond, (T, C) in conditions.items():
        prob, se, ci_lo, ci_hi = predict_probability(model, T, C)

        # Also get observed values
        cond_df = df[df['condition'] == cond]
        n = len(cond_df)
        observed = cond_df['donation_decision'].mean()
        obs_ci = wilson_ci(int(cond_df['donation_decision'].sum()), n)

        results.append({
            'Condition': cond,
            'T': T,
            'C': C,
            'n': n,
            'Observed (%)': round(observed * 100, 1),
            'Obs 95% CI': f"[{obs_ci[0]*100:.1f}, {obs_ci[1]*100:.1f}]",
            'Predicted (%)': round(prob * 100, 1),
            'Pred SE': round(se * 100, 1),
            'Pred 95% CI': f"[{ci_lo*100:.1f}, {ci_hi*100:.1f}]"
        })

    results_df = pd.DataFrame(results)
    print(results_df.to_string(index=False))

    return results_df


# =============================================================================
# PHASE 4.2: MARGINAL EFFECTS
# =============================================================================

def compute_marginal_effects(model, df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute average marginal effects for T and C.

    Args:
        model: Fitted Model 4
        df: Filtered participant DataFrame

    Returns:
        DataFrame with marginal effects
    """
    print("\n" + "="*70)
    print("PHASE 4.2: AVERAGE MARGINAL EFFECTS (AME)")
    print("="*70)

    ame_t, se_t = calculate_marginal_effect(model, df, 'transparency_level')
    ame_c, se_c = calculate_marginal_effect(model, df, 'control_level')

    results = pd.DataFrame([
        {
            'Variable': 'Transparency (T)',
            'AME (pp)': round(ame_t * 100, 1),
            'SE (pp)': round(se_t * 100, 1),
            '95% CI': f"[{(ame_t - 1.96*se_t)*100:.1f}, {(ame_t + 1.96*se_t)*100:.1f}]",
            'Direction': 'Increases' if ame_t > 0 else 'Decreases'
        },
        {
            'Variable': 'Control (C)',
            'AME (pp)': round(ame_c * 100, 1),
            'SE (pp)': round(se_c * 100, 1),
            '95% CI': f"[{(ame_c - 1.96*se_c)*100:.1f}, {(ame_c + 1.96*se_c)*100:.1f}]",
            'Direction': 'Increases' if ame_c > 0 else 'Decreases'
        }
    ])

    print(results.to_string(index=False))

    print(f"\nInterpretation:")
    print(f"  - Showing the Data Nutrition Label {'increases' if ame_t > 0 else 'decreases'} "
          f"donation probability by {abs(ame_t)*100:.1f} percentage points on average.")
    print(f"  - Showing the Granular Dashboard {'increases' if ame_c > 0 else 'decreases'} "
          f"donation probability by {abs(ame_c)*100:.1f} percentage points on average.")

    return results


# =============================================================================
# PHASE 4.3: SIMPLE EFFECTS ANALYSIS
# =============================================================================

def compute_simple_effects(pred_df: pd.DataFrame, p_interaction: float) -> pd.DataFrame:
    """
    Compute simple effects of T within C levels and C within T levels.

    Args:
        pred_df: DataFrame with predicted probabilities
        p_interaction: p-value of the T×C interaction

    Returns:
        DataFrame with simple effects
    """
    print("\n" + "="*70)
    print("PHASE 4.3: SIMPLE EFFECTS ANALYSIS")
    print("="*70)

    print(f"\nInteraction p-value: {p_interaction:.4f}")
    print(f"Interaction significant (α = {ALPHA}): {'Yes' if p_interaction < ALPHA else 'No'}")

    # Extract predicted probabilities
    p_a = pred_df[pred_df['Condition'] == 'A']['Predicted (%)'].values[0] / 100
    p_b = pred_df[pred_df['Condition'] == 'B']['Predicted (%)'].values[0] / 100
    p_c = pred_df[pred_df['Condition'] == 'C']['Predicted (%)'].values[0] / 100
    p_d = pred_df[pred_df['Condition'] == 'D']['Predicted (%)'].values[0] / 100

    # Simple effects of Transparency (T)
    effect_t_at_c0 = p_b - p_a  # T effect within C0
    effect_t_at_c1 = p_d - p_c  # T effect within C1

    # Simple effects of Control (C)
    effect_c_at_t0 = p_c - p_a  # C effect within T0
    effect_c_at_t1 = p_d - p_b  # C effect within T1

    results = pd.DataFrame([
        {'Effect': 'T effect at C0 (Low Control)', 'Δ Probability (pp)': round(effect_t_at_c0 * 100, 1),
         'From': f"A ({p_a*100:.1f}%)", 'To': f"B ({p_b*100:.1f}%)"},
        {'Effect': 'T effect at C1 (High Control)', 'Δ Probability (pp)': round(effect_t_at_c1 * 100, 1),
         'From': f"C ({p_c*100:.1f}%)", 'To': f"D ({p_d*100:.1f}%)"},
        {'Effect': 'C effect at T0 (Low Transparency)', 'Δ Probability (pp)': round(effect_c_at_t0 * 100, 1),
         'From': f"A ({p_a*100:.1f}%)", 'To': f"C ({p_c*100:.1f}%)"},
        {'Effect': 'C effect at T1 (High Transparency)', 'Δ Probability (pp)': round(effect_c_at_t1 * 100, 1),
         'From': f"B ({p_b*100:.1f}%)", 'To': f"D ({p_d*100:.1f}%)"},
    ])

    print("\nSimple Effects Table:")
    print(results.to_string(index=False))

    return results


# =============================================================================
# PHASE 4.4: INTERACTION INTERPRETATION
# =============================================================================

def interpret_interaction(pred_df: pd.DataFrame, p_interaction: float) -> Dict:
    """
    Interpret the T×C interaction pattern.

    Args:
        pred_df: DataFrame with predicted probabilities
        p_interaction: p-value of the T×C interaction

    Returns:
        Dictionary with interpretation results
    """
    print("\n" + "="*70)
    print("PHASE 4.4: INTERACTION INTERPRETATION")
    print("="*70)

    # Extract predicted probabilities
    p_a = pred_df[pred_df['Condition'] == 'A']['Predicted (%)'].values[0] / 100
    p_b = pred_df[pred_df['Condition'] == 'B']['Predicted (%)'].values[0] / 100
    p_c = pred_df[pred_df['Condition'] == 'C']['Predicted (%)'].values[0] / 100
    p_d = pred_df[pred_df['Condition'] == 'D']['Predicted (%)'].values[0] / 100

    # Simple effects
    effect_t_at_c0 = p_b - p_a
    effect_t_at_c1 = p_d - p_c

    # Interaction magnitude
    interaction_effect = effect_t_at_c1 - effect_t_at_c0

    print(f"\nInteraction magnitude:")
    print(f"  (T effect at C1) - (T effect at C0) = {effect_t_at_c1*100:.1f} - {effect_t_at_c0*100:.1f} = {interaction_effect*100:.1f} pp")

    # Determine pattern
    if interaction_effect > 5:  # threshold for meaningful difference
        pattern = "synergistic"
        explanation = "The effect of transparency is STRONGER when control is high."
    elif interaction_effect < -5:
        pattern = "antagonistic"
        explanation = "The effect of transparency is WEAKER when control is high."
    else:
        pattern = "additive"
        explanation = "The effects of transparency and control are roughly additive (no meaningful interaction)."

    print(f"\nPattern: {pattern.upper()}")
    print(f"  {explanation}")

    # H3 interpretation
    print(f"\nH3 (Synergistic interaction):")
    interaction_significant = p_interaction < ALPHA
    if interaction_significant and interaction_effect > 0:
        h3_result = "SUPPORTED"
        print(f"  ✓ SUPPORTED: Significant positive interaction found.")
        print(f"    Combined T+C effect ({(p_d - p_a)*100:.1f} pp) exceeds sum of individual effects.")
    elif interaction_significant and interaction_effect < 0:
        h3_result = "NOT SUPPORTED (antagonistic)"
        print(f"  ✗ NOT SUPPORTED: Significant but antagonistic interaction.")
    else:
        h3_result = "NOT SUPPORTED"
        print(f"  ✗ NOT SUPPORTED: No significant interaction (p = {p_interaction:.4f}).")

    return {
        'pattern': pattern,
        'interaction_magnitude': interaction_effect,
        'p_interaction': p_interaction,
        'h3_result': h3_result
    }


# =============================================================================
# OUTPUT GENERATION
# =============================================================================

def save_results(results: Dict, config: AnalysisConfig):
    """Save all Phase 4 results to output directory."""
    output_dir = os.path.join(os.path.dirname(__file__), './output/phase4')
    os.makedirs(output_dir, exist_ok=True)

    participant_type = 'ai' if config.is_ai_participant else 'human'

    for name, data in results.items():
        if isinstance(data, pd.DataFrame):
            filepath = os.path.join(output_dir, f'phase4_{name}_{participant_type}.csv')
            data.to_csv(filepath, index=False)
            print(f"[INFO] Saved: {filepath}")


# =============================================================================
# MAIN EXECUTION
# =============================================================================

def run_phase4_analysis(is_ai_participant: bool = True) -> Dict:
    """
    Run complete Phase 4 effect analysis.

    Args:
        is_ai_participant: True for AI participants, False for human participants

    Returns:
        Dictionary containing all analysis results
    """
    print("="*70)
    print("PHASE 4: DEEPER EFFECT ANALYSIS")
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

    # Fit Model 4: Donation ~ T + C + T×C
    y = df_filtered['donation_decision'].values
    X4 = sm.add_constant(df_filtered[['transparency_level', 'control_level', 'T_x_C']])
    model4 = Logit(y, X4).fit(disp=0)

    print(f"\nModel 4 fitted: Donation ~ T + C + T×C")
    print(f"Converged: {model4.mle_retvals['converged']}")

    # Get interaction p-value
    p_interaction = model4.pvalues['T_x_C']

    # Store results
    results = {}

    # 4.1 Predicted probabilities
    results['predicted_probabilities'] = compute_predicted_probabilities(model4, df_filtered)

    # 4.2 Marginal effects
    results['marginal_effects'] = compute_marginal_effects(model4, df_filtered)

    # 4.3 Simple effects
    results['simple_effects'] = compute_simple_effects(results['predicted_probabilities'], p_interaction)

    # 4.4 Interaction interpretation
    interpretation = interpret_interaction(results['predicted_probabilities'], p_interaction)

    # Save results
    save_results(results, config)

    print("\n" + "="*70)
    print("PHASE 4 ANALYSIS COMPLETE")
    print("="*70)

    return results


# =============================================================================
# SCRIPT ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Phase 4: Deeper Effect Analysis')
    parser.add_argument(
        '--participant-type',
        choices=['ai', 'human'],
        default='ai',
        help='Type of participants to analyze (default: ai)'
    )

    args = parser.parse_args()
    results = run_phase4_analysis(is_ai_participant=(args.participant_type == 'ai'))
