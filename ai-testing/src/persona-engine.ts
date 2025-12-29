import * as fs from 'fs';
import * as path from 'path';
import { Persona, PersonaFile, BehavioralDrivers } from './types.js';

export class PersonaEngine {
  private personas: Persona[];
  private languageDistribution: Record<string, number>;
  private clusterDistribution: Record<string, number>;

  constructor() {
    const filePath = path.join(process.cwd(), 'personas', 'personas.json');
    const data: PersonaFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    this.personas = data.personas;
    this.languageDistribution = data.languageDistribution;
    this.clusterDistribution = data.clusterDistribution;
  }

  /**
   * Get a persona by ID
   */
  getById(id: string): Persona | undefined {
    return this.personas.find(p => p.id === id);
  }

  /**
   * Get all personas in a cluster
   */
  getByCluster(cluster: 'A' | 'B' | 'C' | 'D'): Persona[] {
    return this.personas.filter(p => p.cluster === cluster);
  }

  /**
   * Generate a distribution of personas for a test run
   * Maintains Swiss language distribution and cluster balance
   */
  generateDistribution(totalParticipants: number): Persona[] {
    const distribution: Persona[] = [];

    // Calculate participants per cluster (equal distribution)
    const perCluster = Math.floor(totalParticipants / 4);
    const remainder = totalParticipants % 4;

    const clusters: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const clusterPersonas = this.getByCluster(cluster);
      const count = perCluster + (i < remainder ? 1 : 0);

      // Distribute evenly among personas in cluster
      const perPersona = Math.floor(count / clusterPersonas.length);
      const personaRemainder = count % clusterPersonas.length;

      for (let j = 0; j < clusterPersonas.length; j++) {
        const personaCount = perPersona + (j < personaRemainder ? 1 : 0);

        for (let k = 0; k < personaCount; k++) {
          // Clone persona with jittered behavioral drivers
          const jitteredPersona = this.applyJitterToPersona(clusterPersonas[j]);

          // Apply language distribution override
          jitteredPersona.demographics.language = this.sampleLanguage();

          distribution.push(jitteredPersona);
        }
      }
    }

    // Shuffle to avoid ordering effects
    return this.shuffle(distribution);
  }

  /**
   * Apply ±1 jitter to all behavioral drivers for realistic variance
   */
  private applyJitterToPersona(persona: Persona): Persona {
    const jittered = JSON.parse(JSON.stringify(persona)) as Persona;

    const drivers = jittered.behavioralDrivers;
    for (const key of Object.keys(drivers) as Array<keyof BehavioralDrivers>) {
      drivers[key] = this.applyJitter(drivers[key]);
    }

    return jittered;
  }

  /**
   * Apply ±1 jitter to a value, clamping to 1-7 range
   */
  private applyJitter(value: number): number {
    const jitter = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
    return Math.max(1, Math.min(7, value + jitter));
  }

  /**
   * Sample a language according to Swiss demographic distribution
   */
  private sampleLanguage(): 'de' | 'fr' | 'it' | 'rm' {
    const rand = Math.random();
    let cumulative = 0;

    for (const [lang, prob] of Object.entries(this.languageDistribution)) {
      cumulative += prob;
      if (rand <= cumulative) {
        return lang as 'de' | 'fr' | 'it' | 'rm';
      }
    }

    return 'de'; // Default fallback
  }

  /**
   * Fisher-Yates shuffle
   */
  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get statistics about the current persona set
   */
  getStats(): {
    totalPersonas: number;
    byCluster: Record<string, number>;
    byLanguage: Record<string, number>;
  } {
    const byCluster: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    const byLanguage: Record<string, number> = { de: 0, fr: 0, it: 0, rm: 0 };

    for (const persona of this.personas) {
      byCluster[persona.cluster]++;
      byLanguage[persona.demographics.language]++;
    }

    return {
      totalPersonas: this.personas.length,
      byCluster,
      byLanguage
    };
  }
}
