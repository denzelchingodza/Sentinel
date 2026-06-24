const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, PutCommand, QueryCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const https = require("https");
const http = require("http");
const { randomUUID } = require("crypto");

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ses = new SESClient({ region: process.env.AWS_SES_REGION || "af-south-1" });

const MONITORS_TABLE  = process.env.MONITORS_TABLE;
const CHECKS_TABLE    = process.env.CHECKS_TABLE;
const INCIDENTS_TABLE = process.env.INCIDENTS_TABLE;
const ALERT_EMAIL     = process.env.ALERT_EMAIL;
const LATENCY_THRESHOLD_MS = 5000;
const COOLDOWN_MINUTES     = 30;

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

// ── Send alert email ──────────────────────────────────────────────────────────
async function sendAlert(monitor, type, details) {
  const isDown    = type === "down";
  const subject   = isDown
    ? `🚨 Sentinel Alert: ${monitor.name} is DOWN`
    : `✅ Sentinel Recovery: ${monitor.name} is back UP`;

  const body = isDown
    ? `Your monitored endpoint is experiencing issues.\n\nMonitor: ${monitor.name}\nURL: ${monitor.url}\nStatus Code: ${details.statusCode || "No response"}\nResponse Time: ${details.responseTime}ms\nError: ${details.error || "N/A"}\nTime: ${new Date().toISOString()}\n\nSentinel will notify you again when it recovers.`
    : `Your monitored endpoint has recovered.\n\nMonitor: ${monitor.name}\nURL: ${monitor.url}\nStatus Code: ${details.statusCode}\nResponse Time: ${details.responseTime}ms\nDowntime Duration: ${details.duration || "Unknown"}\nRecovered At: ${new Date().toISOString()}`;

  // Send to the monitor owner's email if available, fallback to admin email
  const toAddress = monitor.alertEmail || ALERT_EMAIL;

  await ses.send(new SendEmailCommand({
    Source: ALERT_EMAIL,
    Destination: { ToAddresses: [toAddress] },
    Message: {
      Subject: { Data: subject },
      Body: { Text: { Data: body } },
    },
  }));
}

// ── Main handler ──────────────────────────────────────────────────────────────
exports.handler = async () => {
  const { Items: monitors = [] } = await dynamo.send(new ScanCommand({
    TableName: MONITORS_TABLE,
    FilterExpression: "active = :a",
    ExpressionAttributeValues: { ":a": true },
  }));

  await Promise.all(monitors.map(async (monitor) => {
    const { statusCode, responseTime, error } = await ping(monitor.url);
    const healthy   = statusCode >= 200 && statusCode < 400 && responseTime < LATENCY_THRESHOLD_MS;
    const timestamp = new Date().toISOString();

    // Store check result
    await dynamo.send(new PutCommand({
      TableName: CHECKS_TABLE,
      Item: { id: randomUUID(), monitorId: monitor.id, url: monitor.url, statusCode, responseTime, healthy, timestamp, error: error || null },
    }));

    // Update monitor's last status
    await dynamo.send(new UpdateCommand({
      TableName: MONITORS_TABLE,
      Key: { id: monitor.id },
      UpdateExpression: "SET lastStatus = :s, lastChecked = :t, lastResponseTime = :r",
      ExpressionAttributeValues: { ":s": healthy ? "up" : "down", ":t": timestamp, ":r": responseTime },
    }));

    if (!healthy) {
      // Check for existing open incident
      const { Items: incidents = [] } = await dynamo.send(new QueryCommand({
        TableName: INCIDENTS_TABLE,
        IndexName: "monitorId-index",
        KeyConditionExpression: "monitorId = :m",
        FilterExpression: "resolved = :r",
        ExpressionAttributeValues: { ":m": monitor.id, ":r": false },
      }));

      if (incidents.length === 0) {
        // Create new incident — propagate userId so the API can filter by owner
        const incident = { id: randomUUID(), monitorId: monitor.id, userId: monitor.userId || null, url: monitor.url, startTime: timestamp, resolved: false, alertSent: true, lastAlertTime: timestamp, statusCode, responseTime, error: error || null };
        await dynamo.send(new PutCommand({ TableName: INCIDENTS_TABLE, Item: incident }));
        await sendAlert(monitor, "down", { statusCode, responseTime, error });
      } else {
        // Check cooldown for repeated alerts
        const existing = incidents[0];
        const lastAlert = new Date(existing.lastAlertTime).getTime();
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
    } else {
      // Check if recovering from an incident
      const { Items: incidents = [] } = await dynamo.send(new QueryCommand({
        TableName: INCIDENTS_TABLE,
        IndexName: "monitorId-index",
        KeyConditionExpression: "monitorId = :m",
        FilterExpression: "resolved = :r",
        ExpressionAttributeValues: { ":m": monitor.id, ":r": false },
      }));

      if (incidents.length > 0) {
        const incident  = incidents[0];
        const duration  = Math.round((Date.now() - new Date(incident.startTime).getTime()) / 1000 / 60);
        await dynamo.send(new UpdateCommand({
          TableName: INCIDENTS_TABLE,
          Key: { id: incident.id },
          UpdateExpression: "SET resolved = :r, endTime = :e",
          ExpressionAttributeValues: { ":r": true, ":e": timestamp },
        }));
        await sendAlert(monitor, "recovery", { statusCode, responseTime, duration: `${duration} minutes` });
      }
    }
  }));

  return { statusCode: 200, body: `Checked ${monitors.length} monitors` };
};
