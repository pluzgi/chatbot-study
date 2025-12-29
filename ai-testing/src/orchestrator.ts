import { v4 as uuidv4 } from 'uuid';
import { Persona, ThrottleConfig, RunSummary } from './types.js';
import { PersonaEngine } from './persona-engine.js';
import { ParticipantSimulator } from './participant-simulator.js';

export class Orchestrator {
  private runId: string;
  private personaEngine: PersonaEngine;
  private config: ThrottleConfig;
  private activeCount: number = 0;
  private completedCount: number = 0;
  private failedCount: number = 0;
  private startTime: number = 0;
  private byCondition: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  private byCluster: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };

  constructor(config: Partial<ThrottleConfig> = {}) {
    this.runId = uuidv4();
    this.personaEngine = new PersonaEngine();
    this.config = {
      concurrency: 10,
      requestsPerSecond: 20,
      minDelayBetweenSteps: 500,
      maxDelayBetweenSteps: 2000,
      backoffBaseMs: 1000,
      backoffMaxMs: 30000,
      circuitBreakerThreshold: 5,
      circuitBreakerCooldown: 60000,
      ...config
    };
  }

  getRunId(): string {
    return this.runId;
  }

  async runTest(totalParticipants: number): Promise<RunSummary> {
    this.startTime = Date.now();

    console.log('\n====================================');
    console.log('    AI USER TESTING - START');
    console.log('====================================');
    console.log(`Run ID: ${this.runId}`);
    console.log(`Participants: ${totalParticipants}`);
    console.log(`Concurrency: ${this.config.concurrency}`);
    console.log(`Rate limit: ${this.config.requestsPerSecond} req/s`);
    console.log('------------------------------------\n');

    const personas = this.personaEngine.generateDistribution(totalParticipants);
    const queue = [...personas];

    // Process with concurrency limit
    const workers = Array(this.config.concurrency).fill(null).map(() =>
      this.worker(queue)
    );

    await Promise.all(workers);

    const summary: RunSummary = {
      runId: this.runId,
      total: totalParticipants,
      completed: this.completedCount,
      failed: this.failedCount,
      duration: Date.now() - this.startTime,
      byCondition: this.byCondition,
      byCluster: this.byCluster
    };

    console.log('\n====================================');
    console.log('    AI USER TESTING - COMPLETE');
    console.log('====================================');
    console.log(`Completed: ${summary.completed}/${summary.total}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Duration: ${Math.round(summary.duration / 1000)}s`);
    console.log(`Rate: ${(summary.completed / (summary.duration / 1000)).toFixed(2)} participants/sec`);
    console.log('\nBy Condition:');
    Object.entries(summary.byCondition).forEach(([c, n]) => console.log(`  ${c}: ${n}`));
    console.log('\nBy Cluster:');
    Object.entries(summary.byCluster).forEach(([c, n]) => console.log(`  ${c}: ${n}`));
    console.log('====================================\n');

    return summary;
  }

  private async worker(queue: Persona[]): Promise<void> {
    while (queue.length > 0) {
      const persona = queue.shift();
      if (!persona) break;

      this.activeCount++;
      try {
        const simulator = new ParticipantSimulator(persona, this.runId, this.config);
        await simulator.run();
        this.completedCount++;
        this.byCluster[persona.cluster] = (this.byCluster[persona.cluster] || 0) + 1;
        // Note: byCondition is tracked in the simulator based on assigned condition
      } catch (error: any) {
        this.failedCount++;
        // Error already logged in simulator
      }
      this.activeCount--;

      // Progress update every 10 completions
      const total = this.completedCount + this.failedCount;
      if (total % 10 === 0) {
        const remaining = queue.length + this.activeCount;
        const elapsed = (Date.now() - this.startTime) / 1000;
        const rate = total / elapsed;
        const eta = remaining / rate;
        console.log(`\n[PROGRESS] ${total} done, ${remaining} remaining, ETA: ${Math.round(eta)}s\n`);
      }
    }
  }

  /**
   * Dry run - show what would be generated without calling APIs
   */
  async dryRun(totalParticipants: number): Promise<void> {
    console.log('\n====================================');
    console.log('    DRY RUN - No API calls');
    console.log('====================================\n');

    const personas = this.personaEngine.generateDistribution(totalParticipants);

    // Group by cluster
    const byCluster: Record<string, Persona[]> = { A: [], B: [], C: [], D: [] };
    const byLanguage: Record<string, number> = { de: 0, fr: 0, it: 0, rm: 0 };

    for (const p of personas) {
      byCluster[p.cluster].push(p);
      byLanguage[p.demographics.language]++;
    }

    console.log(`Total participants: ${totalParticipants}\n`);

    console.log('Distribution by Cluster:');
    for (const [cluster, ps] of Object.entries(byCluster)) {
      console.log(`  ${cluster}: ${ps.length} (${((ps.length / totalParticipants) * 100).toFixed(1)}%)`);
    }

    console.log('\nDistribution by Language:');
    for (const [lang, count] of Object.entries(byLanguage)) {
      console.log(`  ${lang}: ${count} (${((count / totalParticipants) * 100).toFixed(1)}%)`);
    }

    console.log('\nSample personas (first 3 from each cluster):');
    for (const [cluster, ps] of Object.entries(byCluster)) {
      console.log(`\n  --- Cluster ${cluster} ---`);
      for (const p of ps.slice(0, 3)) {
        console.log(`  ${p.name} (${p.id})`);
        console.log(`    Demographics: ${p.demographics.age}, ${p.demographics.gender}, ${p.demographics.language}`);
        console.log(`    Privacy: ${p.behavioralDrivers.privacy_concern}, Civic: ${p.behavioralDrivers.civic_motivation}`);
      }
    }

    console.log('\n====================================\n');
  }
}
