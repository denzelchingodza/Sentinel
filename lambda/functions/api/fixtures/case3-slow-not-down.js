/**
 * Case 3: Slow but never down
 * Beta Service response time climbed from 300ms to 1500ms over 2 days.
 * No incidents -- it never failed a health check.
 * Pass: does not claim it went down or had an outage.
 */

const monitors = [
  { id: 'mon-b', name: 'Beta Service', url: 'https://beta.example.com', lastStatus: 'up', lastResponseTime: 1500 },
];

const incidents = [];

const expectedFacts = {
  totalIncidents: 0,
  monitorIsUp: true,
  lastResponseTime: 1500,
};

function check(digest) {
  // Check at sentence level: does any sentence positively assert Beta went down?
  const sentences = digest.split(/[.!?]+/).map(s => s.toLowerCase().trim()).filter(Boolean);
  const outageAssertions = ['went down', 'was down', 'went offline', 'experienced an outage',
    'had an outage', 'experienced downtime', 'experienced an incident', 'had an incident'];

  for (const sentence of sentences) {
    const hasNegation = /\bno\b|\bnot\b|\bzero\b|\bnever\b|\bwithout\b/.test(sentence);
    if (hasNegation) continue;
    const mentionsBeta = sentence.includes('beta');
    const assertsOutage = outageAssertions.some(p => sentence.includes(p));
    if (mentionsBeta && assertsOutage) {
      return { pass: false, reason: `claims Beta went down: "${sentence}"` };
    }
  }

  return { pass: true };
}

module.exports = { monitors, incidents, expectedFacts, check, label: 'Case 3: Slow but never down' };
