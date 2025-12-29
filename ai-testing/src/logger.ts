import * as fs from 'fs';
import * as path from 'path';
import { ParticipantLog, StepLog } from './types.js';

export class ParticipantLogger {
  private log: ParticipantLog;
  private logDir: string;

  constructor(runId: string, persona: string) {
    this.logDir = path.join(process.cwd(), 'results', `run-${runId}`);
    fs.mkdirSync(this.logDir, { recursive: true });

    this.log = {
      runId,
      participantId: null,
      persona,
      condition: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: 'running',
      error: null,
      steps: []
    };
  }

  setParticipantId(id: string): void {
    this.log.participantId = id;
  }

  setCondition(condition: string): void {
    this.log.condition = condition;
  }

  logStep(step: Omit<StepLog, 'timestamp'>): void {
    this.log.steps.push({
      ...step,
      timestamp: new Date().toISOString()
    });
  }

  complete(): void {
    this.log.status = 'completed';
    this.log.completedAt = new Date().toISOString();
    this.save();
  }

  fail(error: string): void {
    this.log.status = 'failed';
    this.log.error = error;
    this.log.completedAt = new Date().toISOString();
    this.save();
  }

  private save(): void {
    const filename = `${this.log.persona}-${this.log.participantId || 'unknown'}.json`;
    const filepath = path.join(this.logDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(this.log, null, 2));
  }

  getLog(): ParticipantLog {
    return this.log;
  }
}

/**
 * Generate a summary report for a test run
 */
export function generateRunReport(runId: string): void {
  const logDir = path.join(process.cwd(), 'results', `run-${runId}`);

  if (!fs.existsSync(logDir)) {
    console.error(`No results found for run ${runId}`);
    return;
  }

  const files = fs.readdirSync(logDir).filter(f => f.endsWith('.json'));

  const stats = {
    total: files.length,
    completed: 0,
    failed: 0,
    byCondition: { A: 0, B: 0, C: 0, D: 0 } as Record<string, number>,
    byPersona: {} as Record<string, number>,
    avgDuration: 0,
    errors: [] as string[]
  };

  let totalDuration = 0;

  for (const file of files) {
    const log: ParticipantLog = JSON.parse(
      fs.readFileSync(path.join(logDir, file), 'utf-8')
    );

    if (log.status === 'completed') {
      stats.completed++;
      if (log.condition) {
        stats.byCondition[log.condition] = (stats.byCondition[log.condition] || 0) + 1;
      }
      stats.byPersona[log.persona] = (stats.byPersona[log.persona] || 0) + 1;

      if (log.completedAt && log.startedAt) {
        const duration = new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime();
        totalDuration += duration;
      }
    } else {
      stats.failed++;
      stats.errors.push(`${log.persona}: ${log.error}`);
    }
  }

  stats.avgDuration = stats.completed > 0 ? totalDuration / stats.completed : 0;

  console.log('\n========== RUN REPORT ==========');
  console.log(`Run ID: ${runId}`);
  console.log(`Total: ${stats.total} | Completed: ${stats.completed} | Failed: ${stats.failed}`);
  console.log('\nBy Condition:');
  Object.entries(stats.byCondition).forEach(([c, n]) => console.log(`  ${c}: ${n}`));
  console.log('\nBy Persona:');
  Object.entries(stats.byPersona).forEach(([p, n]) => console.log(`  ${p}: ${n}`));
  console.log(`\nAvg Duration: ${Math.round(stats.avgDuration / 1000)}s per participant`);

  if (stats.errors.length > 0) {
    console.log('\nErrors:');
    stats.errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
    if (stats.errors.length > 10) {
      console.log(`  ... and ${stats.errors.length - 10} more`);
    }
  }
  console.log('================================\n');
}
