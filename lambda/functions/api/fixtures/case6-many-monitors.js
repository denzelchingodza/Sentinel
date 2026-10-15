/**
 * Case 6: Many monitors, one troubled
 * 15 monitors. Only "Zeta Payments API" had incidents (3 outages, 22 min total).
 * Pass: picks out Zeta Payments, doesn't drown the issue in the noise.
 */

const now = Date.now();

const monitors = [
  { id: 'mon-01', name: 'Alpha Web',          url: 'https://alpha.example.com',   lastStatus: 'up', lastResponseTime: 110 },
  { id: 'mon-02', name: 'Beta API',            url: 'https://beta.example.com',    lastStatus: 'up', lastResponseTime: 95  },
  { id: 'mon-03', name: 'Gamma Dashboard',     url: 'https://gamma.example.com',   lastStatus: 'up', lastResponseTime: 200 },
  { id: 'mon-04', name: 'Delta Service',       url: 'https://delta.example.com',   lastStatus: 'up', lastResponseTime: 180 },
  { id: 'mon-05', name: 'Epsilon Worker',      url: 'https://epsilon.example.com', lastStatus: 'up', lastResponseTime: 320 },
  { id: 'mon-06', name: 'Zeta Payments API',   url: 'https://zeta.example.com',    lastStatus: 'up', lastResponseTime: 145 },
  { id: 'mon-07', name: 'Eta Auth',            url: 'https://eta.example.com',     lastStatus: 'up', lastResponseTime: 88  },
  { id: 'mon-08', name: 'Theta Storage',       url: 'https://theta.example.com',   lastStatus: 'up', lastResponseTime: 410 },
  { id: 'mon-09', name: 'Iota Queue',          url: 'https://iota.example.com',    lastStatus: 'up', lastResponseTime: 65  },
  { id: 'mon-10', name: 'Kappa Mailer',        url: 'https://kappa.example.com',   lastStatus: 'up', lastResponseTime: 230 },
  { id: 'mon-11', name: 'Lambda CDN',          url: 'https://lambda.example.com',  lastStatus: 'up', lastResponseTime: 55  },
  { id: 'mon-12', name: 'Mu Analytics',        url: 'https://mu.example.com',      lastStatus: 'up', lastResponseTime: 175 },
  { id: 'mon-13', name: 'Nu Scheduler',        url: 'https://nu.example.com',      lastStatus: 'up', lastResponseTime: 140 },
  { id: 'mon-14', name: 'Xi Webhook',          url: 'https://xi.example.com',      lastStatus: 'up', lastResponseTime: 160 },
  { id: 'mon-15', name: 'Omicron Gateway',     url: 'https://omicron.example.com', lastStatus: 'up', lastResponseTime: 195 },
];

// Only Zeta Payments API has incidents: 3 outages (5, 7, 10 min) over the last 3 days
const incidents = [
  {
    id: 'inc-z1',
    monitorId: 'mon-06',
    userId: 'user-test',
    startTime: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    endTime:   new Date(now - 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
    resolved: true,
    error: 'timeout',
    statusCode: 0,
  },
  {
    id: 'inc-z2',
    monitorId: 'mon-06',
    userId: 'user-test',
    startTime: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    endTime:   new Date(now - 2 * 24 * 60 * 60 * 1000 + 7 * 60 * 1000).toISOString(),
    resolved: true,
    error: 'connection refused',
    statusCode: 0,
  },
  {
    id: 'inc-z3',
    monitorId: 'mon-06',
    userId: 'user-test',
    startTime: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    endTime:   new Date(now - 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
    resolved: true,
    error: 'HTTP 503',
    statusCode: 503,
  },
];

const expectedFacts = {
  troubledMonitor: 'Zeta Payments API',
  incidentCount: 3,
  totalDowntimeMinutes: 22,
  healthyCount: 14,
};

function check(digest) {
  const lower = digest.toLowerCase();

  // Must mention Zeta Payments
  if (!lower.includes('zeta')) {
    return { pass: false, reason: 'does not mention Zeta Payments API' };
  }

  // Check at sentence level: does any sentence positively blame a healthy monitor?
  const healthyNames = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'eta', 'theta',
    'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron'];
  const sentences = digest.split(/[.!?]+/).map(s => s.toLowerCase().trim()).filter(Boolean);
  const outageAssertions = ['went down', 'was down', 'went offline', 'experienced an outage',
    'had an outage', 'experienced downtime', 'experienced an incident', 'had an incident', 'suffered'];

  for (const sentence of sentences) {
    const hasNegation = /\bno\b|\bnot\b|\bzero\b|\bnever\b|\bwithout\b/.test(sentence);
    if (hasNegation) continue;
    const mentionsHealthy = healthyNames.some(n => sentence.includes(n));
    const assertsOutage   = outageAssertions.some(p => sentence.includes(p));
    if (mentionsHealthy && assertsOutage) {
      const blamed = healthyNames.filter(n => sentence.includes(n));
      return { pass: false, reason: `blames healthy monitor(s) ${blamed.join(', ')}: "${sentence}"` };
    }
  }

  return { pass: true };
}

module.exports = { monitors, incidents, expectedFacts, check, label: 'Case 6: 15 monitors, only Zeta troubled' };
