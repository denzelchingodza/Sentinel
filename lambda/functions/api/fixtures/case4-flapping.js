/**
 * Case 4: Flapping
 * Gamma Dashboard went down and up 6 times in 20 minutes.
 * Each outage was 1-2 minutes long.
 * Pass: describes it as unstable or repeated short outages, roughly right count.
 */

const now = Date.now();
const base = now - 30 * 60 * 1000; // started 30 min ago

// 6 down/up cycles, each ~2 min down then 1 min up, all within 20 min window
const incidents = [];
let cursor = base;
for (let i = 0; i < 6; i++) {
  const start = cursor;
  const end   = cursor + 2 * 60 * 1000; // 2 min down
  incidents.push({
    id: `inc-flap-${i}`,
    monitorId: 'mon-g',
    userId: 'user-test',
    startTime: new Date(start).toISOString(),
    endTime:   new Date(end).toISOString(),
    resolved: true,
    error: 'connection reset',
    statusCode: 0,
  });
  cursor = end + 60 * 1000; // 1 min recovery between each
}

const monitors = [
  { id: 'mon-g', name: 'Gamma Dashboard', url: 'https://gamma.example.com', lastStatus: 'up', lastResponseTime: 210 },
];

const expectedFacts = {
  troubledMonitor: 'Gamma Dashboard',
  incidentCount: 6,
};

function check(digest) {
  const lower = digest.toLowerCase();

  // Must mention Gamma Dashboard
  if (!lower.includes('gamma')) {
    return { pass: false, reason: 'does not mention Gamma Dashboard' };
  }

  // Must indicate instability -- multiple outages, unstable, repeated, flapping
  const instabilityWords = ['unstable', 'repeated', 'multiple', 'several', 'flap', 'short', 'brief', 'six', '6'];
  const hasInstability = instabilityWords.some(w => lower.includes(w));
  if (!hasInstability) {
    return { pass: false, reason: 'does not describe the repeated/unstable nature of the outages' };
  }

  return { pass: true };
}

module.exports = { monitors, incidents, expectedFacts, check, label: 'Case 4: Flapping monitor' };
