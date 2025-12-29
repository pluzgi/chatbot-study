import { Persona, BehavioralDrivers, DonationConfig, PostTaskMeasures } from './types.js';

export class ResponseGenerator {
  private persona: Persona;
  private drivers: BehavioralDrivers;

  constructor(persona: Persona) {
    this.persona = persona;
    this.drivers = persona.behavioralDrivers;
  }

  /**
   * Generate Likert response (1-7) with ±1 jitter
   */
  likert(driver: keyof BehavioralDrivers): number {
    const base = this.drivers[driver];
    return this.applyJitter(base);
  }

  private applyJitter(value: number): number {
    const jitter = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
    return Math.max(1, Math.min(7, value + jitter));
  }

  /**
   * Donation decision based on TRAIT-CONDITION INTERACTIONS
   * NO global "+0.1" effects per condition.
   * Effects depend on persona characteristics.
   */
  donationDecision(condition: string): boolean {
    const d = this.drivers;

    // Base probability from cluster tendency
    let probability = this.getClusterBaseProbability();

    // ─────────────────────────────────────────────────────────────
    // CONDITION A (Control): No intervention effects
    // ─────────────────────────────────────────────────────────────
    if (condition === 'A') {
      // No modification - pure baseline
    }

    // ─────────────────────────────────────────────────────────────
    // CONDITION B (DNL - Data Nutrition Label):
    // Increases donation ONLY for:
    //   - High cognitive_load_sensitivity (>=5): DNL simplifies complexity
    //   - Low institutional_trust (<=3): DNL provides transparency they need
    // ─────────────────────────────────────────────────────────────
    if (condition === 'B') {
      if (d.cognitive_load_sensitivity >= 5) {
        probability += 0.15; // DNL reduces cognitive burden
      }
      if (d.institutional_trust <= 3) {
        probability += 0.10; // DNL builds trust through transparency
      }
    }

    // ─────────────────────────────────────────────────────────────
    // CONDITION C (Dashboard - Control Interface):
    // Helps: High privacy_concern + Low cognitive_load_sensitivity
    // Hurts: High cognitive_load_sensitivity ("overloaded avoiders")
    // ─────────────────────────────────────────────────────────────
    if (condition === 'C') {
      // Dashboard helps privacy-conscious who can handle complexity
      if (d.privacy_concern >= 5 && d.cognitive_load_sensitivity <= 4) {
        probability += 0.20; // Control satisfies their need for agency
      }

      // Dashboard overwhelms high cognitive load sensitivity personas
      if (d.cognitive_load_sensitivity >= 6) {
        probability -= 0.10; // Too many options = decision paralysis
      }

      // Data sovereignty salient personas appreciate control options
      if (d.data_sovereignty_salience >= 5) {
        probability += 0.10;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // CONDITION D (DNL + Dashboard - Synergy):
    // Works for MOST persona types - transparency + control combo
    // Strongest effect for Cluster B (control-seeking)
    // ─────────────────────────────────────────────────────────────
    if (condition === 'D') {
      // Base synergy effect for most personas
      probability += 0.10;

      // Extra boost for control-seeking (Cluster B) personas
      if (d.privacy_concern >= 5 && d.civic_motivation >= 5) {
        probability += 0.15; // Perfect match: engaged + wants control
      }

      // DNL component helps high cognitive load personas
      if (d.cognitive_load_sensitivity >= 5) {
        probability += 0.10; // DNL offsets dashboard complexity
      }

      // Trust-building through combined transparency
      if (d.institutional_trust <= 4) {
        probability += 0.05;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Universal modifiers (trait-based, not condition-based)
    // ─────────────────────────────────────────────────────────────

    // High civic motivation always increases donation likelihood
    if (d.civic_motivation >= 6) {
      probability += 0.10;
    }

    // Very low trust is a strong negative factor
    if (d.institutional_trust <= 2) {
      probability -= 0.15;
    }

    // Clamp to valid probability range
    probability = Math.max(0.05, Math.min(0.95, probability));

    return Math.random() < probability;
  }

  private getClusterBaseProbability(): number {
    const cluster = this.persona.cluster;
    switch (cluster) {
      case 'A': return 0.65; // Donation-prone
      case 'B': return 0.40; // Control-seeking (donates with right conditions)
      case 'C': return 0.20; // Decline-prone
      case 'D': return 0.45; // Indifferent (coin-flip tendency)
      default: return 0.40;
    }
  }

  /**
   * Generate donation config for conditions C and D
   */
  donationConfig(condition: string): DonationConfig | null {
    if (condition !== 'C' && condition !== 'D') return null;

    const d = this.drivers;

    return {
      scope: d.privacy_concern > 5 ? 'topics-only' : d.privacy_concern > 3 ? 'questions-only' : 'full',
      purpose: d.data_sovereignty_salience > 4 ? 'academic' : 'commercial',
      storage: d.privacy_concern > 5 ? 'swiss' : d.privacy_concern > 3 ? 'swiss-or-eu' : 'no-preference',
      retention: d.data_sovereignty_salience > 5 ? '6months' : d.data_sovereignty_salience > 3 ? '1year' : 'indefinite'
    };
  }

  /**
   * Generate all post-task survey responses
   */
  postTaskResponses(condition: string): PostTaskMeasures {
    const d = this.drivers;
    const demo = this.persona.demographics;

    return {
      // Perceived transparency (higher if DNL shown - conditions B & D)
      transparency1: this.adjustForCondition(4, condition, 'transparency'),
      transparency2: this.adjustForCondition(4, condition, 'transparency'),

      // Perceived control (higher if Dashboard shown - conditions C & D)
      control1: this.adjustForCondition(4, condition, 'control'),
      control2: this.adjustForCondition(4, condition, 'control'),

      // Risk perception (inversely related to trust)
      riskTraceability: this.applyJitter(8 - d.institutional_trust),
      riskMisuse: this.applyJitter(8 - d.institutional_trust),

      // Trust
      trust1: this.applyJitter(d.institutional_trust),

      // Attention check (always correct for AI)
      attentionCheck: 'voting',

      // Demographics from persona
      age: demo.age,
      gender: demo.gender,
      primaryLanguage: demo.language,
      education: this.mapEducation(demo.education),
      eligibleToVoteCh: demo.eligibleToVote ? 'eligible' : 'not-eligible',

      // Generated feedback
      openFeedback: this.generateFeedback()
    };
  }

  private adjustForCondition(base: number, condition: string, factor: 'transparency' | 'control'): number {
    let value = base;

    if (factor === 'transparency' && (condition === 'B' || condition === 'D')) {
      value += 2; // DNL increases perceived transparency
    }
    if (factor === 'control' && (condition === 'C' || condition === 'D')) {
      value += 2; // Dashboard increases perceived control
    }

    return Math.max(1, Math.min(7, this.applyJitter(value)));
  }

  private mapEducation(education: string): string {
    const mapping: Record<string, string> = {
      'mandatory': 'mandatory',
      'apprenticeship': 'vocational',
      'matura': 'matura',
      'bachelor': 'university',
      'master': 'university',
      'doctorate': 'university'
    };
    return mapping[education] || education;
  }

  private generateFeedback(): string {
    const cluster = this.persona.cluster;
    const d = this.drivers;

    // Cluster-specific feedback pools
    const feedbackPools: Record<string, string[]> = {
      A: [
        'Happy to contribute to Swiss research.',
        'Clear and straightforward process.',
        'Good initiative for democratic participation.',
        'I trust Swiss institutions with this data.',
        ''  // Some leave empty
      ],
      B: [
        'Appreciated the transparency about data usage.',
        'Would like even more control over data retention.',
        'The privacy options were helpful.',
        'Good to see Swiss data stays in Switzerland.',
        'More details on who accesses the data would be helpful.',
        ''
      ],
      C: [
        'Still not sure who benefits from this.',
        'Concerned about data being used beyond stated purposes.',
        'Would prefer not to share any data.',
        'Too many unknowns about long-term data use.',
        ''
      ],
      D: [
        'Interesting concept.',
        'Quick and easy.',
        'Not sure what difference my choice makes.',
        '',
        ''
      ]
    };

    const pool = feedbackPools[cluster] || feedbackPools.D;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * Get baseline survey responses
   */
  baselineResponses(): { techComfort: number; privacyConcern: number; ballotFamiliarity: number } {
    return {
      techComfort: this.likert('ai_literacy'),
      privacyConcern: this.likert('privacy_concern'),
      ballotFamiliarity: this.likert('ballot_familiarity')
    };
  }
}
