/**
 * Case 5: Empty data
 * No monitors, no checks at all.
 * Pass: says there is no data, does not make up a summary.
 */

const monitors = [];
const incidents = [];

const expectedFacts = {
  totalMonitors: 0,
  totalIncidents: 0,
};

function check(digest) {
  // Check at sentence level: does any sentence positively assert an outage or non-zero incidents?
  const sentences = digest.split(/[.!?]+/).map(s => s.toLowerCase().trim()).filter(Boolean);
  const outageAssertions = ['went down', 'was down', 'went offline', 'experienced an outage',
    'had an outage', 'experienced downtime', 'experienced an incident', 'had an incident'];

  for (const sentence of sentences) {
    const hasNegation = /\bno\b|\bnot\b|\bzero\b|\bnever\b|\bwithout\b/.test(sentence);
    if (hasNegation) continue;
    for (const pattern of outageAssertions) {
      if (sentence.includes(pattern)) {
        return { pass: false, reason: `invented outage with no data present: "${sentence}"` };
      }
    }
  }

  // Should indicate there is nothing to report
  const lower = digest.toLowerCase();
  const noDataWords = ['no monitors', 'no data', 'nothing to report', 'no endpoints', 'no checks',
    'not configured', 'empty', 'no active monitors', 'have not been set up', 'haven\'t been set up',
    'zero monitors', 'no monitoring'];
  const hasNoData = noDataWords.some(w => lower.includes(w));
  if (!hasNoData) {
    return { pass: false, reason: 'does not acknowledge that there is no data' };
  }

  return { pass: true };
}

module.exports = { monitors, incidents, expectedFacts, check, label: 'Case 5: Empty -- no data' };
