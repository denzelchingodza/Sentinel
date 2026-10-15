/**
 * monitor.test.js
 *
 * Unit tests for Step 2: fewer false alarms.
 * Tests the consecutive-failures and flapping logic without any AWS calls.
 *
 * Run:
 *   node monitor.test.js
 */

// ─── Minimal stubs ────────────────────────────────────────────────────────────
// We re-implement just the decision logic here so we can test it in isolation
// without mocking the entire AWS SDK.

const CONSECUTIVE_THRESHOLD = 2;
const FLAP_THRESHOLD        = 4;
const FLAP_WINDOW_MS        = 15 * 60 * 1000;
const COOLDOWN_MS           = 30 * 60 * 1000;

/**
 * Core decision function extracted from the handler.
 * Returns what action to take: "quiet" | "down" | "recovery" | "unstable"
 *
 * @param {object} opts
 * @param {boolean} opts.healthy          - current check result
 * @param {number}  opts.consecutiveFailures - value on monitor BEFORE this check
 * @param {number}  opts.stateChanges     - state changes in last 15 min (from checks table)
 * @param {boolean} opts.hasOpenIncident  - whether there is an unresolved incident
 * @param {number}  opts.lastAlertMs      - epoch ms of last alert (0 if never)
 * @param {number}  opts.lastFlapAlertMs  - epoch ms of last flap alert (0 if never)
 * @param {number}  opts.nowMs            - current epoch ms
 */
function decide({ healthy, consecutiveFailures, stateChanges, hasOpenIncident, lastAlertMs, lastFlapAlertMs, nowMs }) {
  if (!healthy) {
    const newConsecutive = consecutiveFailures + 1;
    if (newConsecutive < CONSECUTIVE_THRESHOLD) {
      return "quiet"; // blip — wait for more failures
    }
    if (stateChanges >= FLAP_THRESHOLD) {
      const cooldownExpired = (nowMs - lastFlapAlertMs) > COOLDOWN_MS;
      return cooldownExpired ? "unstable" : "quiet";
    }
    if (!hasOpenIncident) return "down";
    const cooldownExpired = (nowMs - lastAlertMs) > COOLDOWN_MS;
    return cooldownExpired ? "down" : "quiet";
  } else {
    if (hasOpenIncident) {
      return stateChanges >= FLAP_THRESHOLD ? "quiet" : "recovery";
    }
    return "quiet";
  }
}

// ─── Test runner ──────────────────────────────────────────────────────────────
const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';
const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';

let passed = 0, failed = 0;

function test(label, fn) {
  try {
    fn();
    console.log(`${GREEN}PASS${RESET} ${label}`);
    passed++;
  } catch (e) {
    console.log(`${RED}FAIL${RESET} ${label}`);
    console.log(`     ${e.message}`);
    failed++;
  }
}

function assert(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg || ''}: expected "${expected}", got "${actual}"`);
  }
}

const now = Date.now();

console.log(`\n${BOLD}Sentinel Monitor Logic Tests — Step 2: Fewer False Alarms${RESET}\n`);
console.log('─'.repeat(60));

// ── Single blip — must NOT alert ──────────────────────────────────────────────
test("single failed check does NOT send alert (consecutiveFailures was 0)", () => {
  const action = decide({ healthy: false, consecutiveFailures: 0, stateChanges: 0, hasOpenIncident: false, lastAlertMs: 0, lastFlapAlertMs: 0, nowMs: now });
  assert(action, "quiet", "single blip");
});

test("single failed check does NOT send alert (consecutiveFailures was 1, threshold=2)", () => {
  // consecutiveFailures = 1, so newConsecutive = 2 — this SHOULD alert
  // (1 + 1 = 2 = threshold, so this is exactly at threshold — should alert)
  const action = decide({ healthy: false, consecutiveFailures: 1, stateChanges: 0, hasOpenIncident: false, lastAlertMs: 0, lastFlapAlertMs: 0, nowMs: now });
  assert(action, "down", "second consecutive failure hits threshold");
});

// ── Two consecutive failures — MUST alert ─────────────────────────────────────
test("second consecutive failure sends down alert", () => {
  const action = decide({ healthy: false, consecutiveFailures: 1, stateChanges: 1, hasOpenIncident: false, lastAlertMs: 0, lastFlapAlertMs: 0, nowMs: now });
  assert(action, "down");
});

test("third+ consecutive failure with open incident respects cooldown (quiet within window)", () => {
  const action = decide({ healthy: false, consecutiveFailures: 5, stateChanges: 1, hasOpenIncident: true, lastAlertMs: now - 10 * 60 * 1000, lastFlapAlertMs: 0, nowMs: now });
  assert(action, "quiet", "cooldown not expired");
});

test("third+ consecutive failure with open incident resends after cooldown", () => {
  const action = decide({ healthy: false, consecutiveFailures: 5, stateChanges: 1, hasOpenIncident: true, lastAlertMs: now - 31 * 60 * 1000, lastFlapAlertMs: 0, nowMs: now });
  assert(action, "down", "cooldown expired");
});

// ── Recovery ──────────────────────────────────────────────────────────────────
test("recovery sends alert when open incident exists and not flapping", () => {
  const action = decide({ healthy: true, consecutiveFailures: 3, stateChanges: 2, hasOpenIncident: true, lastAlertMs: now - 60 * 60 * 1000, lastFlapAlertMs: 0, nowMs: now });
  assert(action, "recovery");
});

test("healthy check with no open incident is quiet", () => {
  const action = decide({ healthy: true, consecutiveFailures: 0, stateChanges: 0, hasOpenIncident: false, lastAlertMs: 0, lastFlapAlertMs: 0, nowMs: now });
  assert(action, "quiet");
});

// ── Flapping ──────────────────────────────────────────────────────────────────
test("4+ state changes in 15 min sends unstable alert (not down)", () => {
  const action = decide({ healthy: false, consecutiveFailures: 2, stateChanges: 4, hasOpenIncident: false, lastAlertMs: 0, lastFlapAlertMs: 0, nowMs: now });
  assert(action, "unstable", "flapping should send unstable, not down");
});

test("flapping unstable alert respects cooldown (quiet if sent recently)", () => {
  const action = decide({ healthy: false, consecutiveFailures: 2, stateChanges: 6, hasOpenIncident: false, lastAlertMs: 0, lastFlapAlertMs: now - 10 * 60 * 1000, nowMs: now });
  assert(action, "quiet", "flap cooldown active");
});

test("flapping unstable alert resends after cooldown", () => {
  const action = decide({ healthy: false, consecutiveFailures: 2, stateChanges: 6, hasOpenIncident: false, lastAlertMs: 0, lastFlapAlertMs: now - 31 * 60 * 1000, nowMs: now });
  assert(action, "unstable", "flap cooldown expired");
});

test("recovery during flapping is suppressed", () => {
  const action = decide({ healthy: true, consecutiveFailures: 0, stateChanges: 5, hasOpenIncident: true, lastAlertMs: now - 60 * 60 * 1000, lastFlapAlertMs: 0, nowMs: now });
  assert(action, "quiet", "recovery suppressed during flapping");
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60));
console.log(`${BOLD}Results${RESET}`);
console.log(`  ${passed + failed} tests — ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log(`\n${GREEN}${BOLD}All tests passed.${RESET}\n`);
  process.exit(0);
} else {
  console.log(`\n${RED}${BOLD}Some tests failed.${RESET}\n`);
  process.exit(1);
}
