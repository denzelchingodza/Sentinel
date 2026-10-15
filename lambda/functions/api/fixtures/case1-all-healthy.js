/**
 * Case 1: All healthy
 * 3 monitors, 100% up, no incidents, steady response times.
 * Pass: says nothing went down, invents no incidents.
 */

const monitors = [
  { id: 'mon-1', name: 'Alpha API',        url: 'https://alpha.example.com',   lastStatus: 'up', lastResponseTime: 120 },
  { id: 'mon-2', name: 'Beta Service',     url: 'https://beta.example.com',    lastStatus: 'up', lastResponseTime: 95  },
  { id: 'mon-3', name: 'Gamma Dashboard',  url: 'https://gamma.example.com',   lastStatus: 'up', lastResponseTime: 200 },
];

const incidents = [];

const expectedFacts = {
  totalIncidents: 0,
  allUp: true,
};

function check(digest) {
  // Split into sentences and look for ones that POSITIVELY assert an outage
  // (i.e. not negated with "no", "not", "zero", "never", "without")
  const sentences = digest.split(/[.!?]+/).map(s => s.toLowerCase().trim()).filter(Boolean);
  const outageAssertions = ['went down', 'was down', 'went offline', 'experienced an outage',
    'had an outage', 'experienced downtime', 'experienced an incident', 'had an incident'];

  for (const sentence of sentences) {
    const hasNegation = /\bno\b|\bnot\b|\bzero\b|\bnever\b|\bwithout\b/.test(sentence);
    if (!hasNegation) {
      for (const pattern of outageAssertions) {
        if (sentence.includes(pattern)) {
          return { pass: false, reason: `invented outage in sentence: "${sentence}"` };
        }
      }
    }
  }
  return { pass: true };
}

module.exports = { monitors, incidents, expectedFacts, check, label: 'Case 1: All healthy' };
