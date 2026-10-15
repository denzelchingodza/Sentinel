/**
 * Case 2: One clear outage
 * Alpha API went down twice: 4 min outage and 10 min outage.
 * Beta Service and Gamma Dashboard had no issues.
 * Pass: names Alpha API, says 2 outages, durations roughly right, B and C fine.
 */

const now = Date.now();

const monitors = [
  { id: 'mon-a', name: 'Alpha API',       url: 'https://alpha.example.com',  lastStatus: 'up', lastResponseTime: 130 },
  { id: 'mon-b', name: 'Beta Service',    url: 'https://beta.example.com',   lastStatus: 'up', lastResponseTime: 90  },
  { id: 'mon-c', name: 'Gamma Dashboard', url: 'https://gamma.example.com',  lastStatus: 'up', lastResponseTime: 180 },
];

const incidents = [
  {
    id: 'inc-1',
    monitorId: 'mon-a',
    userId: 'user-test',
    startTime: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    endTime:   new Date(now - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 1000).toISOString(),
    resolved: true,
    error: 'connection refused',
    statusCode: 0,
  },
  {
    id: 'inc-2',
    monitorId: 'mon-a',
    userId: 'user-test',
    startTime: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    endTime:   new Date(now - 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
    resolved: true,
    error: 'timeout',
    statusCode: 0,
  },
];

const expectedFacts = {
  troubledMonitor: 'Alpha API',
  incidentCount: 2,
  totalDowntimeMinutes: 14,
  healthyMonitors: ['Beta Service', 'Gamma Dashboard'],
};

const monitorNames = monitors.map(m => m.name);

function check(digest) {
  const lower = digest.toLowerCase();

  // Must name the troubled monitor
  if (!lower.includes('alpha')) {
    return { pass: false, reason: 'does not name Alpha API' };
  }

  // Check at sentence level: does any sentence positively blame Beta or Gamma?
  const sentences = digest.split(/[.!?]+/).map(s => s.toLowerCase().trim()).filter(Boolean);
  const outageAssertions = ['went down', 'was down', 'went offline', 'experienced an outage',
    'had an outage', 'experienced downtime', 'experienced an incident', 'had an incident', 'suffered'];

  for (const sentence of sentences) {
    const hasNegation = /\bno\b|\bnot\b|\bzero\b|\bnever\b|\bwithout\b/.test(sentence);
    if (hasNegation) continue;
    const mentionsBeta  = sentence.includes('beta');
    const mentionsGamma = sentence.includes('gamma');
    const assertsOutage = outageAssertions.some(p => sentence.includes(p));
    if (mentionsBeta  && assertsOutage) return { pass: false, reason: `claims Beta had an outage: "${sentence}"` };
    if (mentionsGamma && assertsOutage) return { pass: false, reason: `claims Gamma had an outage: "${sentence}"` };
  }

  return { pass: true };
}

module.exports = { monitors, incidents, expectedFacts, check, label: 'Case 2: One monitor with two outages' };
