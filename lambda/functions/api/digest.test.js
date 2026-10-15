/**
 * digest.test.js
 *
 * Step 1 test harness for the Sentinel AI digest.
 *
 * What it does:
 *   1. For each fixture: calls buildDigestContext with the fixture data and
 *      verifies the shaped facts deterministically (no LLM, instant).
 *   2. Then calls callDigestLLM 3 times and runs the fixture's check()
 *      against each response.
 *   3. Prints a clear pass/fail report.
 *
 * Run:
 *   OPENAI_API_KEY=sk-... node digest.test.js
 *
 * If you want to skip LLM calls (just test fact-shaping):
 *   FACTS_ONLY=1 node digest.test.js
 */

const { buildDigestContext, callDigestLLM } = require('./digest');

const fixtures = [
  require('./fixtures/case1-all-healthy'),
  require('./fixtures/case2-one-outage'),
  require('./fixtures/case3-slow-not-down'),
  require('./fixtures/case4-flapping'),
  require('./fixtures/case5-empty'),
  require('./fixtures/case6-many-monitors'),
];

const API_KEY   = process.env.OPENAI_API_KEY;
const FACTS_ONLY = process.env.FACTS_ONLY === '1';
const LLM_RUNS   = 3;

// ─── Colours ──────────────────────────────────────────────────────────────────
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const DIM    = '\x1b[2m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

function pass(msg)  { return `${GREEN}PASS${RESET} ${msg}`; }
function fail(msg)  { return `${RED}FAIL${RESET} ${msg}`; }
function info(msg)  { return `${DIM}     ${msg}${RESET}`; }

// ─── Fact assertions ──────────────────────────────────────────────────────────
/**
 * Verify the shaped context against the fixture's expectedFacts.
 * Returns { pass: true } or { pass: false, reason }
 */
function assertFacts(context, expectedFacts) {
  const errors = [];

  if ('totalMonitors' in expectedFacts && context.totalMonitors !== expectedFacts.totalMonitors) {
    errors.push(`totalMonitors: expected ${expectedFacts.totalMonitors}, got ${context.totalMonitors}`);
  }

  if ('totalIncidents' in expectedFacts && context.totalIncidentsLast7Days !== expectedFacts.totalIncidents) {
    errors.push(`totalIncidentsLast7Days: expected ${expectedFacts.totalIncidents}, got ${context.totalIncidentsLast7Days}`);
  }

  if ('allUp' in expectedFacts && expectedFacts.allUp) {
    if (context.monitorsCurrentlyDown !== 0) {
      errors.push(`allUp: expected 0 down, got ${context.monitorsCurrentlyDown}`);
    }
  }

  if ('monitorIsUp' in expectedFacts && expectedFacts.monitorIsUp) {
    const downMonitors = context.monitors.filter(m => m.currentStatus === 'down');
    if (downMonitors.length > 0) {
      errors.push(`monitorIsUp: expected all up, but found down: ${downMonitors.map(m => m.name).join(', ')}`);
    }
  }

  if ('troubledMonitor' in expectedFacts) {
    const troubled = context.monitors.find(m => m.incidentsLast7Days > 0);
    if (!troubled) {
      errors.push(`troubledMonitor: expected ${expectedFacts.troubledMonitor} to have incidents, found none`);
    } else if (!troubled.name.toLowerCase().includes(expectedFacts.troubledMonitor.toLowerCase().split(' ')[0])) {
      errors.push(`troubledMonitor: expected ${expectedFacts.troubledMonitor}, got ${troubled.name}`);
    }
  }

  if ('incidentCount' in expectedFacts && context.totalIncidentsLast7Days !== expectedFacts.incidentCount) {
    errors.push(`incidentCount: expected ${expectedFacts.incidentCount}, got ${context.totalIncidentsLast7Days}`);
  }

  if ('totalDowntimeMinutes' in expectedFacts) {
    const total = context.monitors.reduce((sum, m) => sum + m.totalDowntimeMinutes, 0);
    if (total !== expectedFacts.totalDowntimeMinutes) {
      errors.push(`totalDowntimeMinutes: expected ${expectedFacts.totalDowntimeMinutes}, got ${total}`);
    }
  }

  if (errors.length > 0) {
    return { pass: false, reason: errors.join('; ') };
  }
  return { pass: true };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  if (!FACTS_ONLY && !API_KEY) {
    console.error(`${RED}Error:${RESET} OPENAI_API_KEY is not set.\nRun: OPENAI_API_KEY=sk-... node digest.test.js\nOr skip LLM calls: FACTS_ONLY=1 node digest.test.js`);
    process.exit(1);
  }

  console.log(`\n${BOLD}Sentinel Digest Test Harness${RESET}`);
  console.log(`Mode: ${FACTS_ONLY ? YELLOW + 'facts only (no LLM calls)' + RESET : 'facts + LLM (' + LLM_RUNS + ' runs each)'}\n`);
  console.log('─'.repeat(60));

  let totalFact = 0, passedFact = 0;
  let totalLLM  = 0, passedLLM  = 0;

  for (const fixture of fixtures) {
    console.log(`\n${BOLD}${fixture.label}${RESET}`);

    // ── 1. Build context ─────────────────────────────────────────────────────
    const context = buildDigestContext(fixture.monitors, fixture.incidents);

    // ── 2. Fact assertions ───────────────────────────────────────────────────
    totalFact++;
    const factResult = assertFacts(context, fixture.expectedFacts);
    if (factResult.pass) {
      passedFact++;
      console.log(pass('Fact shape correct'));
    } else {
      console.log(fail(`Fact shape: ${factResult.reason}`));
    }

    // Optional: show shaped context summary
    console.log(info(`${context.totalMonitors} monitors, ${context.totalIncidentsLast7Days} incidents in last 7 days`));

    // ── 3. LLM calls ─────────────────────────────────────────────────────────
    if (!FACTS_ONLY) {
      for (let run = 1; run <= LLM_RUNS; run++) {
        totalLLM++;
        try {
          const digest = await callDigestLLM(context, API_KEY);
          const result = fixture.check(digest);
          if (result.pass) {
            passedLLM++;
            console.log(pass(`LLM run ${run}`));
          } else {
            console.log(fail(`LLM run ${run}: ${result.reason}`));
          }
          console.log(info(digest.replace(/\n/g, ' ').slice(0, 120) + (digest.length > 120 ? '...' : '')));
        } catch (err) {
          console.log(fail(`LLM run ${run}: threw error -- ${err.message}`));
        }
      }
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  console.log(`${BOLD}Results${RESET}`);
  console.log(`  Fact checks:  ${passedFact}/${totalFact} passed`);
  if (!FACTS_ONLY) {
    console.log(`  LLM checks:   ${passedLLM}/${totalLLM} passed`);
  }

  const allPassed = passedFact === totalFact && (FACTS_ONLY || passedLLM === totalLLM);
  if (allPassed) {
    console.log(`\n${GREEN}${BOLD}All tests passed.${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`\n${RED}${BOLD}Some tests failed.${RESET}\n`);
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
