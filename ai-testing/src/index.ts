import 'dotenv/config';
import { Orchestrator } from './orchestrator.js';
import { generateRunReport } from './logger.js';
import { PersonaEngine } from './persona-engine.js';

async function main() {
  const args = process.argv.slice(2);

  // Parse command line arguments
  const getArg = (name: string): string | undefined => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg?.split('=')[1];
  };

  const hasFlag = (name: string): boolean => {
    return args.includes(`--${name}`);
  };

  // Help
  if (hasFlag('help')) {
    console.log(`
AI User Testing Runner

Usage:
  npm run test -- --participants=N [options]

Options:
  --participants=N    Number of participants to simulate (REQUIRED)
  --concurrency=N     Max concurrent participants (default: 10)
  --rate-limit=N      Max requests per second (default: 20)
  --dry-run           Show what would be generated without API calls
  --report=RUN_ID     Generate report for a previous run
  --stats             Show persona statistics
  --verbose           Show detailed output
  --help              Show this help message

Examples:
  npm run test -- --participants=100 --concurrency=5
  npm run test -- --dry-run --participants=1000
  npm run test -- --report=abc123
`);
    return;
  }

  // Show persona stats
  if (hasFlag('stats')) {
    const engine = new PersonaEngine();
    const stats = engine.getStats();
    console.log('\nPersona Statistics:');
    console.log(`Total personas: ${stats.totalPersonas}`);
    console.log('\nBy Cluster:');
    Object.entries(stats.byCluster).forEach(([c, n]) => console.log(`  ${c}: ${n}`));
    console.log('\nBy Language (base):');
    Object.entries(stats.byLanguage).forEach(([l, n]) => console.log(`  ${l}: ${n}`));
    return;
  }

  // Generate report
  const reportRunId = getArg('report');
  if (reportRunId) {
    generateRunReport(reportRunId);
    return;
  }

  // Parse settings
  const participantsArg = getArg('participants');
  if (!participantsArg) {
    console.error('ERROR: --participants=N is required\n');
    console.log('Usage: npm run test -- --participants=N');
    console.log('Example: npm run test -- --participants=50');
    process.exit(1);
  }
  const participants = parseInt(participantsArg);
  const concurrency = parseInt(getArg('concurrency') || '10');
  const rateLimit = parseInt(getArg('rate-limit') || '20');
  const dryRun = hasFlag('dry-run');

  // Create orchestrator
  const orchestrator = new Orchestrator({
    concurrency,
    requestsPerSecond: rateLimit
  });

  // Run
  if (dryRun) {
    await orchestrator.dryRun(participants);
  } else {
    // Verify environment
    if (!process.env.API_BASE_URL) {
      console.warn('WARNING: API_BASE_URL not set, using default http://localhost:3001/api');
    }

    const summary = await orchestrator.runTest(participants);

    // Generate report
    generateRunReport(summary.runId);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
