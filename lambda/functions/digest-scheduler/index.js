/**
 * digest-scheduler/index.js
 *
 * Triggered every Monday morning by EventBridge.
 * For every user who has monitors, generates an AI digest and emails it.
 *
 * No API Gateway — this is an internal scheduled job.
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ses    = new SESClient({ region: process.env.AWS_SES_REGION || "af-south-1" });

const MONITORS_TABLE  = process.env.MONITORS_TABLE;
const INCIDENTS_TABLE = process.env.INCIDENTS_TABLE;
const OPENAI_API_KEY  = process.env.OPENAI_API_KEY;
const ALERT_EMAIL     = process.env.ALERT_EMAIL;
const SEVEN_DAYS_MS   = 7 * 24 * 60 * 60 * 1000;

// ── Digest context builder (mirrors api/digest.js) ────────────────────────────
function buildDigestContext(monitors, incidents) {
  const sevenDaysAgo    = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();
  const recentIncidents = incidents.filter(inc => inc.startTime >= sevenDaysAgo);

  const monitorSummaries = monitors.map(m => {
    const monIncidents        = recentIncidents.filter(i => i.monitorId === m.id);
    const totalDowntimeMinutes = monIncidents.reduce((sum, inc) => {
      if (inc.resolved && inc.endTime) {
        return sum + Math.round((new Date(inc.endTime) - new Date(inc.startTime)) / 1000 / 60);
      }
      return sum;
    }, 0);
    return {
      name: m.name,
      url: m.url,
      currentStatus: m.lastStatus || "unknown",
      lastResponseTime: m.lastResponseTime ? `${m.lastResponseTime}ms` : "no data",
      incidentsLast7Days: monIncidents.length,
      totalDowntimeMinutes,
      hasActiveIncident: monIncidents.some(i => !i.resolved),
    };
  });

  const incidentDetails = recentIncidents
    .map(inc => {
      const monitor        = monitors.find(m => m.id === inc.monitorId);
      const durationMinutes = inc.resolved && inc.endTime
        ? Math.round((new Date(inc.endTime) - new Date(inc.startTime)) / 1000 / 60)
        : null;
      return {
        monitor: monitor?.name || inc.url,
        startTime: inc.startTime,
        duration: durationMinutes !== null ? `${durationMinutes} minutes` : "ongoing",
        resolved: inc.resolved,
        error: inc.error || null,
      };
    })
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
    .slice(0, 10);

  return {
    totalMonitors: monitors.length,
    monitorsCurrentlyUp: monitors.filter(m => m.lastStatus === "up").length,
    monitorsCurrentlyDown: monitors.filter(m => m.lastStatus === "down").length,
    totalIncidentsLast7Days: recentIncidents.length,
    monitors: monitorSummaries,
    recentIncidents: incidentDetails,
  };
}

// ── Call OpenAI ───────────────────────────────────────────────────────────────
async function callLLM(context) {
  const weekOf = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const prompt = `You are an infrastructure monitoring assistant for Sentinel, a URL uptime monitoring platform.

Here is the monitoring data for the user's endpoints over the last 7 days (week of ${weekOf}):

${JSON.stringify(context, null, 2)}

Write a concise weekly digest in plain English. Be specific — use monitor names, incident counts, and downtime durations. Highlight anything that needs attention. If everything looked healthy, say so clearly. End with one short sentence about what to watch next week if anything stands out. Keep it to 4-6 sentences. Write as flowing prose with no bullet points or headers.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${err}`);
  }

  const data   = await res.json();
  const digest = data.choices?.[0]?.message?.content?.trim();
  if (!digest) throw new Error("No response from OpenAI");
  return digest;
}

// ── Send the weekly email ─────────────────────────────────────────────────────
async function sendWeeklyDigest(toEmail, digest, context) {
  const weekOf   = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const subject  = `📊 Sentinel weekly digest — ${weekOf}`;

  const statsLine = `${context.totalMonitors} monitor${context.totalMonitors !== 1 ? "s" : ""} · `
    + `${context.monitorsCurrentlyUp} up · `
    + `${context.monitorsCurrentlyDown} down · `
    + `${context.totalIncidentsLast7Days} incident${context.totalIncidentsLast7Days !== 1 ? "s" : ""} this week`;

  const body = `${digest}\n\n──\n${statsLine}\n\nSentinel · https://sentinel.vercel.app`;

  await ses.send(new SendEmailCommand({
    Source: ALERT_EMAIL,
    Destination: { ToAddresses: [toEmail] },
    Message: {
      Subject: { Data: subject },
      Body:    { Text: { Data: body } },
    },
  }));
}

// ── Main handler ──────────────────────────────────────────────────────────────
exports.handler = async () => {
  if (!OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set — skipping weekly digest");
    return;
  }

  // Fetch all active monitors across all users
  const { Items: allMonitors = [] } = await dynamo.send(new ScanCommand({
    TableName: MONITORS_TABLE,
    FilterExpression: "active = :a",
    ExpressionAttributeValues: { ":a": true },
  }));

  if (allMonitors.length === 0) {
    console.log("No active monitors — nothing to digest");
    return;
  }

  // Group monitors by userId
  const byUser = {};
  for (const m of allMonitors) {
    if (!m.userId) continue;
    if (!byUser[m.userId]) byUser[m.userId] = { monitors: [], email: m.alertEmail || ALERT_EMAIL };
    byUser[m.userId].monitors.push(m);
  }

  const userIds = Object.keys(byUser);
  console.log(`Generating weekly digests for ${userIds.length} user(s)`);

  await Promise.all(userIds.map(async (userId) => {
    try {
      const { monitors, email } = byUser[userId];

      // Fetch this user's incidents
      const { Items: incidents = [] } = await dynamo.send(new QueryCommand({
        TableName: INCIDENTS_TABLE,
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: { ":u": userId },
      }));

      const context = buildDigestContext(monitors, incidents);
      const digest  = await callLLM(context);

      await sendWeeklyDigest(email, digest, context);
      console.log(`Digest sent to ${email} (${monitors.length} monitors, ${context.totalIncidentsLast7Days} incidents)`);
    } catch (err) {
      console.error(`Failed digest for userId ${userId}:`, err.message);
    }
  }));

  return { sent: userIds.length };
};
