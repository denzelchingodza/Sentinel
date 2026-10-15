const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, PutCommand, QueryCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const https = require("https");
const http = require("http");
const { randomUUID } = require("crypto");

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ses = new SESClient({ region: process.env.AWS_SES_REGION || "af-south-1" });
const sqs = new SQSClient({ region: process.env.AWS_REGION || "af-south-1" });
const ALERT_QUEUE_URL = process.env.ALERT_QUEUE_URL;

const MONITORS_TABLE  = process.env.MONITORS_TABLE;
const CHECKS_TABLE    = process.env.CHECKS_TABLE;
const INCIDENTS_TABLE = process.env.INCIDENTS_TABLE;
const ALERT_EMAIL     = process.env.ALERT_EMAIL;

const LATENCY_THRESHOLD_MS      = 5000;
const COOLDOWN_MINUTES          = 30;
const SLOWDOWN_COOLDOWN_MINUTES = 60;  // longer cooldown — slowdowns can linger
const CONSECUTIVE_THRESHOLD     = parseInt(process.env.CONSECUTIVE_THRESHOLD || "2", 10);
const FLAP_THRESHOLD            = parseInt(process.env.FLAP_THRESHOLD || "4", 10);
const FLAP_WINDOW_MS            = 15 * 60 * 1000;
const MAD_BASELINE_CHECKS       = 50;  // how many recent checks to use for baseline
const MAD_MIN_SAMPLES           = 10;  // need at least this many before flagging
const MAD_K                     = 3;   // multiplier: flag if rt > median + k * MAD
const MAD_MIN_THRESHOLD_MS      = 500; // never flag unless > this (avoids noise at low latencies)

// ── Ping a URL ────────────────────────────────────────────────────────────────
function ping(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { timeout: 10000 }, (res) => {
      res.resume();
      resolve({ statusCode: res.statusCode, responseTime: Date.now() - start, error: null });
    });
    req.on("error", (err) => resolve({ statusCode: 0, responseTime: Date.now() - start, error: err.message }));
    req.on("timeout", () => { req.destroy(); resolve({ statusCode: 0, responseTime: Date.now() - start, error: "timeout" }); });
  });
}

// ── MAD anomaly detection ─────────────────────────────────────────────────────
/**
 * Returns true if `current` is anomalously high relative to `baseline`.
 * Uses Median Absolute Deviation (MAD) — robust against skewed distributions.
 */
function isAnomaly(baseline, current) {
  if (baseline.length < MAD_MIN_SAMPLES) return false;
  if (current <= MAD_MIN_THRESHOLD_MS) return false;

  const sorted = [...baseline].sort((a, b) => a - b);
  const mid    = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];

  const deviations = sorted.map(rt => Math.abs(rt - median)).sort((a, b) => a - b);
  const mad = deviations.length % 2 === 0
    ? (deviations[deviations.length / 2 - 1] + deviations[deviations.length / 2]) / 2
    : deviations[Math.floor(deviations.length / 2)];

  // When MAD is 0 (perfectly stable), flag anything 2× the median
  if (mad === 0) return current > median * 2 && current > MAD_MIN_THRESHOLD_MS;
  return current > median + MAD_K * mad;
}

// ── Fetch recent checks for a monitor ────────────────────────────────────────
async function getRecentChecks(monitorId, limit) {
  const { Items = [] } = await dynamo.send(new QueryCommand({
    TableName: CHECKS_TABLE,
    IndexName: "monitorId-timestamp-index",
    KeyConditionExpression: "monitorId = :m",
    ExpressionAttributeValues: { ":m": monitorId },
    ScanIndexForward: false,
    Limit: limit,
  }));
  return Items;
}

// ── Count state changes in FLAP_WINDOW_MS ────────────────────────────────────
async function countRecentStateChanges(monitorId) {
  const since = new Date(Date.now() - FLAP_WINDOW_MS).toISOString();
  const { Items = [] } = await dynamo.send(new QueryCommand({
    TableName: CHECKS_TABLE,
    IndexName: "monitorId-timestamp-index",
    KeyConditionExpression: "monitorId = :m AND #ts >= :s",
    ExpressionAttributeNames: { "#ts": "timestamp" },
    ExpressionAttributeValues: { ":m": monitorId, ":s": since },
    ScanIndexForward: true,
  }));
  let changes = 0;
  for (let i = 1; i < Items.length; i++) {
    if (Items[i].healthy !== Items[i - 1].healthy) changes++;
  }
  return changes;
}

// ── Send alert email ──────────────────────────────────────────────────────────
async function sendAlert(monitor, type, details) {
  let subject, body;

  if (type === "down") {
    subject = `🚨 Sentinel Alert: ${monitor.name} is DOWN`;
    body = `Your monitored endpoint is experiencing issues.\n\nMonitor: ${monitor.name}\nURL: ${monitor.url}\nStatus Code: ${details.statusCode || "No response"}\nResponse Time: ${details.responseTime}ms\nError: ${details.error || "N/A"}\nTime: ${new Date().toISOString()}\n\nSentinel will notify you again when it recovers.`;
  } else if (type === "recovery") {
    subject = `✅ Sentinel Recovery: ${monitor.name} is back UP`;
    body = `Your monitored endpoint has recovered.\n\nMonitor: ${monitor.name}\nURL: ${monitor.url}\nStatus Code: ${details.statusCode}\nResponse Time: ${details.responseTime}ms\nDowntime Duration: ${details.duration || "Unknown"}\nRecovered At: ${new Date().toISOString()}`;
  } else if (type === "unstable") {
    subject = `⚠️ Sentinel Warning: ${monitor.name} is unstable`;
    body = `Your monitored endpoint is flapping — it went up and down ${details.stateChanges} times in the last 15 minutes.\n\nMonitor: ${monitor.name}\nURL: ${monitor.url}\nState changes (last 15 min): ${details.stateChanges}\nTime: ${new Date().toISOString()}\n\nThis usually points to a fragile deployment, network instability, or an overloaded server. Sentinel will keep watching.`;
  } else if (type === "slowdown") {
    subject = `🐢 Sentinel Warning: ${monitor.name} is responding slowly`;
    body = `Your monitored endpoint is still up, but response times are unusually high.\n\nMonitor: ${monitor.name}\nURL: ${monitor.url}\nCurrent response time: ${details.responseTime}ms\nBaseline median: ${details.median}ms\nTime: ${new Date().toISOString()}\n\nThis may be an early sign of trouble. Sentinel will keep watching and alert you if it goes down.`;
  }

  const toAddress = monitor.alertEmail || ALERT_EMAIL;

  try {
    await ses.send(new SendEmailCommand({
      Source: ALERT_EMAIL,
      Destination: { ToAddresses: [toAddress] },
      Message: {
        Subject: { Data: subject },
        Body: { Text: { Data: body } },
      },
    }));
  } catch (sesError) {
    console.error(`SES failed for monitor ${monitor.id}, queuing alert for retry:`, sesError.message);
    await sqs.send(new SendMessageCommand({
      QueueUrl: ALERT_QUEUE_URL,
      MessageBody: JSON.stringify({ monitor, type, details, subject, body, toAddress }),
    }));
  }
}

// ── Compute median for alert details ─────────────────────────────────────────
function computeMedian(values) {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? Math.round((s[m - 1] + s[m]) / 2) : s[m];
}

// ── Main handler ──────────────────────────────────────────────────────────────
exports.handler = async () => {
  const { Items: monitors = [] } = await dynamo.send(new ScanCommand({
    TableName: MONITORS_TABLE,
    FilterExpression: "active = :a",
    ExpressionAttributeValues: { ":a": true },
  }));

  await Promise.all(monitors.map(async (monitor) => {
    try {
      const { statusCode, responseTime, error } = await ping(monitor.url);
      const healthy   = statusCode >= 200 && statusCode < 400 && responseTime < LATENCY_THRESHOLD_MS;
      const timestamp = new Date().toISOString();

      // ── Fetch baseline for anomaly detection (before storing this check) ───
      const recentChecks    = await getRecentChecks(monitor.id, MAD_BASELINE_CHECKS);
      const baselineTimes   = recentChecks.filter(c => c.healthy && c.responseTime).map(c => c.responseTime);
      const anomalyFlag     = healthy && isAnomaly(baselineTimes, responseTime);
      const baselineMedian  = computeMedian(baselineTimes);

      // ── Store check result ──────────────────────────────────────────────────
      await dynamo.send(new PutCommand({
        TableName: CHECKS_TABLE,
        Item: {
          id: randomUUID(),
          monitorId: monitor.id,
          url: monitor.url,
          statusCode,
          responseTime,
          healthy,
          anomalyFlag,
          timestamp,
          error: error || null,
        },
      }));

      if (!healthy) {
        // ── Increment consecutive failure counter ───────────────────────────
        const newConsecutive = (monitor.consecutiveFailures || 0) + 1;
        await dynamo.send(new UpdateCommand({
          TableName: MONITORS_TABLE,
          Key: { id: monitor.id },
          UpdateExpression: "SET lastStatus = :s, lastChecked = :t, lastResponseTime = :r, consecutiveFailures = :c",
          ExpressionAttributeValues: { ":s": "down", ":t": timestamp, ":r": responseTime, ":c": newConsecutive },
        }));

        if (newConsecutive >= CONSECUTIVE_THRESHOLD) {
          const stateChanges = await countRecentStateChanges(monitor.id);

          if (stateChanges >= FLAP_THRESHOLD) {
            const lastFlapAlert = monitor.lastFlapAlertTime ? new Date(monitor.lastFlapAlertTime).getTime() : 0;
            if (Date.now() - lastFlapAlert > COOLDOWN_MINUTES * 60 * 1000) {
              await dynamo.send(new UpdateCommand({
                TableName: MONITORS_TABLE,
                Key: { id: monitor.id },
                UpdateExpression: "SET lastFlapAlertTime = :t",
                ExpressionAttributeValues: { ":t": timestamp },
              }));
              await sendAlert(monitor, "unstable", { stateChanges });
            }
          } else {
            const { Items: incidents = [] } = await dynamo.send(new QueryCommand({
              TableName: INCIDENTS_TABLE,
              IndexName: "monitorId-index",
              KeyConditionExpression: "monitorId = :m",
              FilterExpression: "resolved = :r",
              ExpressionAttributeValues: { ":m": monitor.id, ":r": false },
            }));

            if (incidents.length === 0) {
              const incident = {
                id: randomUUID(),
                monitorId: monitor.id,
                userId: monitor.userId || null,
                url: monitor.url,
                startTime: timestamp,
                resolved: false,
                alertSent: true,
                lastAlertTime: timestamp,
                statusCode,
                responseTime,
                error: error || null,
              };
              await dynamo.send(new PutCommand({ TableName: INCIDENTS_TABLE, Item: incident }));
              await sendAlert(monitor, "down", { statusCode, responseTime, error });
            } else {
              const existing   = incidents[0];
              const lastAlert  = new Date(existing.lastAlertTime).getTime();
              if (Date.now() - lastAlert > COOLDOWN_MINUTES * 60 * 1000) {
                await dynamo.send(new UpdateCommand({
                  TableName: INCIDENTS_TABLE,
                  Key: { id: existing.id },
                  UpdateExpression: "SET lastAlertTime = :t",
                  ExpressionAttributeValues: { ":t": timestamp },
                }));
                await sendAlert(monitor, "down", { statusCode, responseTime, error });
              }
            }
          }
        }

      } else {
        // ── Healthy: reset consecutive failure counter ──────────────────────
        await dynamo.send(new UpdateCommand({
          TableName: MONITORS_TABLE,
          Key: { id: monitor.id },
          UpdateExpression: "SET lastStatus = :s, lastChecked = :t, lastResponseTime = :r, consecutiveFailures = :c",
          ExpressionAttributeValues: { ":s": "up", ":t": timestamp, ":r": responseTime, ":c": 0 },
        }));

        // ── Slowdown alert (anomaly detected, but still healthy) ────────────
        if (anomalyFlag) {
          const lastSlowdown = monitor.lastSlowdownAlertTime ? new Date(monitor.lastSlowdownAlertTime).getTime() : 0;
          if (Date.now() - lastSlowdown > SLOWDOWN_COOLDOWN_MINUTES * 60 * 1000) {
            await dynamo.send(new UpdateCommand({
              TableName: MONITORS_TABLE,
              Key: { id: monitor.id },
              UpdateExpression: "SET lastSlowdownAlertTime = :t",
              ExpressionAttributeValues: { ":t": timestamp },
            }));
            await sendAlert(monitor, "slowdown", { responseTime, median: baselineMedian });
          }
        }

        // ── Check if recovering from an open incident ───────────────────────
        const { Items: incidents = [] } = await dynamo.send(new QueryCommand({
          TableName: INCIDENTS_TABLE,
          IndexName: "monitorId-index",
          KeyConditionExpression: "monitorId = :m",
          FilterExpression: "resolved = :r",
          ExpressionAttributeValues: { ":m": monitor.id, ":r": false },
        }));

        if (incidents.length > 0) {
          const incident = incidents[0];
          const duration = Math.round((Date.now() - new Date(incident.startTime).getTime()) / 1000 / 60);
          await dynamo.send(new UpdateCommand({
            TableName: INCIDENTS_TABLE,
            Key: { id: incident.id },
            UpdateExpression: "SET resolved = :r, endTime = :e",
            ExpressionAttributeValues: { ":r": true, ":e": timestamp },
          }));
          const stateChanges = await countRecentStateChanges(monitor.id);
          if (stateChanges < FLAP_THRESHOLD) {
            await sendAlert(monitor, "recovery", { statusCode, responseTime, duration: `${duration} minutes` });
          }
        }
      }
    } catch (err) {
      console.error(`Error processing monitor ${monitor.id} (${monitor.url}):`, err.message);
    }
  }));

  return { statusCode: 200, body: `Checked ${monitors.length} monitors` };
};
