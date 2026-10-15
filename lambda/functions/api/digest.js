/**
 * digest.js
 *
 * Extracted digest logic. All pure functions -- no DynamoDB, no network calls
 * except callDigestLLM. This makes the data shaping fully testable without AWS.
 *
 * Exports:
 *   buildDigestContext(monitors, incidents) -> context object
 *   callDigestLLM(context, apiKey)         -> digest string
 */

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Takes raw monitors and incidents arrays, returns the shaped context
 * object that gets handed to the LLM. No network calls.
 */
function buildDigestContext(monitors, incidents) {
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();
  const recentIncidents = incidents.filter(inc => inc.startTime >= sevenDaysAgo);

  const monitorSummaries = monitors.map(m => {
    const monIncidents = recentIncidents.filter(i => i.monitorId === m.id);
    const totalDowntimeMinutes = monIncidents.reduce((sum, inc) => {
      if (inc.resolved && inc.endTime) {
        return sum + Math.round((new Date(inc.endTime) - new Date(inc.startTime)) / 1000 / 60);
      }
      return sum;
    }, 0);
    return {
      name: m.name,
      url: m.url,
      currentStatus: m.lastStatus || 'unknown',
      lastResponseTime: m.lastResponseTime ? `${m.lastResponseTime}ms` : 'no data',
      incidentsLast7Days: monIncidents.length,
      totalDowntimeMinutes,
      hasActiveIncident: monIncidents.some(i => !i.resolved),
    };
  });

  const incidentDetails = recentIncidents
    .map(inc => {
      const monitor = monitors.find(m => m.id === inc.monitorId);
      const durationMinutes = inc.resolved && inc.endTime
        ? Math.round((new Date(inc.endTime) - new Date(inc.startTime)) / 1000 / 60)
        : null;
      return {
        monitor: monitor?.name || inc.url,
        startTime: inc.startTime,
        duration: durationMinutes !== null ? `${durationMinutes} minutes` : 'ongoing',
        resolved: inc.resolved,
        error: inc.error || null,
        statusCode: inc.statusCode || null,
      };
    })
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
    .slice(0, 10);

  return {
    totalMonitors: monitors.length,
    monitorsCurrentlyUp: monitors.filter(m => m.lastStatus === 'up').length,
    monitorsCurrentlyDown: monitors.filter(m => m.lastStatus === 'down').length,
    totalIncidentsLast7Days: recentIncidents.length,
    monitors: monitorSummaries,
    recentIncidents: incidentDetails,
  };
}

/**
 * Builds the prompt string from a context object.
 */
function buildPrompt(context) {
  return `You are an infrastructure monitoring assistant for Sentinel, a URL uptime monitoring platform.

Here is the monitoring data for the user's endpoints over the last 7 days:

${JSON.stringify(context, null, 2)}

Write a concise plain-English digest. Be specific -- use monitor names, incident counts, and downtime durations. Highlight anything that needs attention. If everything looks healthy, say so clearly. Keep it to 3-5 sentences. Write it as flowing prose with no bullet points or headers.`;
}

/**
 * Calls OpenAI gpt-4o-mini with the context and returns the digest string.
 * Throws on API error or empty response.
 */
async function callDigestLLM(context, apiKey) {
  const prompt = buildPrompt(context);
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 250,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${err}`);
  }

  const data = await res.json();
  const digest = data.choices?.[0]?.message?.content?.trim();
  if (!digest) throw new Error('No response from AI');
  return digest;
}

module.exports = { buildDigestContext, buildPrompt, callDigestLLM };
