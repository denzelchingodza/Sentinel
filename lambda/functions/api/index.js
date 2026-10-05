const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, ScanCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { randomUUID } = require("crypto");

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const MONITORS_TABLE  = process.env.MONITORS_TABLE;
const CHECKS_TABLE    = process.env.CHECKS_TABLE;
const INCIDENTS_TABLE = process.env.INCIDENTS_TABLE;

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

// Extract the Cognito user ID and email from the authorizer claims
function getUser(event) {
  const claims = event.requestContext?.authorizer?.claims;
  if (!claims?.sub) return null;
  return { userId: claims.sub, email: claims.email || null };
}

exports.handler = async (event) => {
  const method = event.httpMethod;
  const path   = event.path;
  const body   = event.body ? JSON.parse(event.body) : {};

  try {
    // OPTIONS preflight — no auth needed
    if (method === "OPTIONS") return response(200, {});

    // All other routes require a valid Cognito token
    const user = getUser(event);
    if (!user) return response(401, { error: "Unauthorized" });
    const { userId, email } = user;

    // ── POST /monitors — register a URL ──────────────────────────────────────
    if (method === "POST" && path === "/monitors") {
      const { url, name } = body;
      if (!url || !name) return response(400, { error: "url and name are required" });

      const monitor = {
        id: randomUUID(),
        userId,
        alertEmail: email,
        url,
        name,
        active: true,
        createdAt: new Date().toISOString(),
        lastStatus: "unknown",
        lastChecked: null,
        lastResponseTime: null,
      };
      await dynamo.send(new PutCommand({ TableName: MONITORS_TABLE, Item: monitor }));
      return response(201, monitor);
    }

    // ── GET /monitors — list this user's monitors only ────────────────────────
    if (method === "GET" && path === "/monitors") {
      const { Items = [] } = await dynamo.send(new QueryCommand({
        TableName: MONITORS_TABLE,
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: { ":u": userId },
      }));
      return response(200, Items);
    }

    // ── DELETE /monitors/{id} — remove a monitor ─────────────────────────────
    if (method === "DELETE" && path.startsWith("/monitors/")) {
      const id = path.split("/")[2];

      // Verify ownership before deleting
      const { Item } = await dynamo.send(new GetCommand({ TableName: MONITORS_TABLE, Key: { id } }));
      if (!Item) return response(404, { error: "Monitor not found" });
      if (Item.userId !== userId) return response(403, { error: "Forbidden" });

      await dynamo.send(new DeleteCommand({ TableName: MONITORS_TABLE, Key: { id } }));
      return response(200, { message: "Monitor deleted" });
    }

    // ── GET /monitors/{id}/history — uptime history ───────────────────────────
    if (method === "GET" && path.match(/^\/monitors\/[^/]+\/history$/)) {
      const id = path.split("/")[2];

      // Verify ownership
      const { Item } = await dynamo.send(new GetCommand({ TableName: MONITORS_TABLE, Key: { id } }));
      if (!Item || Item.userId !== userId) return response(403, { error: "Forbidden" });

      const limit = parseInt(event.queryStringParameters?.limit || "100");
      const { Items = [] } = await dynamo.send(new QueryCommand({
        TableName: CHECKS_TABLE,
        IndexName: "monitorId-timestamp-index",
        KeyConditionExpression: "monitorId = :m",
        ExpressionAttributeValues: { ":m": id },
        ScanIndexForward: false,
        Limit: limit,
      }));
      return response(200, Items);
    }

    // ── GET /monitors/{id}/analytics — uptime % + avg response time ───────────
    if (method === "GET" && path.match(/^\/monitors\/[^/]+\/analytics$/)) {
      const id = path.split("/")[2];

      // Verify ownership
      const { Item } = await dynamo.send(new GetCommand({ TableName: MONITORS_TABLE, Key: { id } }));
      if (!Item || Item.userId !== userId) return response(403, { error: "Forbidden" });

      const { Items = [] } = await dynamo.send(new QueryCommand({
        TableName: CHECKS_TABLE,
        IndexName: "monitorId-timestamp-index",
        KeyConditionExpression: "monitorId = :m",
        ExpressionAttributeValues: { ":m": id },
        ScanIndexForward: false,
        Limit: 1440, // last 24h at 1/min
      }));
      const total   = Items.length;
      const up      = Items.filter(c => c.healthy).length;
      const avgTime = total > 0 ? Math.round(Items.reduce((s, c) => s + (c.responseTime || 0), 0) / total) : 0;
      return response(200, {
        total,
        uptime: total > 0 ? ((up / total) * 100).toFixed(2) : "0.00",
        avgResponseTime: avgTime,
        checksUp: up,
        checksDown: total - up,
      });
    }

    // ── GET /incidents — active incidents for this user's monitors ────────────
    if (method === "GET" && path === "/incidents") {
      const { Items = [] } = await dynamo.send(new QueryCommand({
        TableName: INCIDENTS_TABLE,
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :u",
        FilterExpression: "resolved = :r",
        ExpressionAttributeValues: { ":u": userId, ":r": false },
      }));
      return response(200, Items);
    }

    // ── GET /incidents/all — all incidents for this user ──────────────────────
    if (method === "GET" && path === "/incidents/all") {
      const { Items = [] } = await dynamo.send(new QueryCommand({
        TableName: INCIDENTS_TABLE,
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: { ":u": userId },
      }));
      return response(200, Items);
    }

    // ── GET /digest — AI-generated incident digest ───────────────────────────
    if (method === "GET" && path === "/digest") {

      // ── Step 1: Gather all the raw data ──────────────────────────────────
      // Fetch all monitors belonging to this user
      const { Items: monitors = [] } = await dynamo.send(new QueryCommand({
        TableName: MONITORS_TABLE,
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: { ":u": userId },
      }));

      // Fetch all incidents belonging to this user
      const { Items: allIncidents = [] } = await dynamo.send(new QueryCommand({
        TableName: INCIDENTS_TABLE,
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: { ":u": userId },
      }));

      // Filter incidents to the last 7 days in code
      // (DynamoDB can't filter by timestamp here without a sort key on this index)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const recentIncidents = allIncidents.filter(inc => inc.startTime >= sevenDaysAgo);

      // ── Step 2: Shape the data into something meaningful ─────────────────
      // For each monitor, calculate how many incidents it had and total downtime
      const monitorSummaries = monitors.map(m => {
        const monIncidents = recentIncidents.filter(i => i.monitorId === m.id);
        const totalDowntimeMinutes = monIncidents.reduce((sum, inc) => {
          if (inc.resolved && inc.endTime) {
            return sum + Math.round((new Date(inc.endTime) - new Date(inc.startTime)) / 1000 / 60);
          }
          return sum; // ongoing incident — don't count yet
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

      // Recent incidents sorted newest first, capped at 10 for the prompt
      const incidentDetails = recentIncidents
        .map(inc => {
          const monitor = monitors.find(m => m.id === inc.monitorId);
          const durationMinutes = inc.resolved && inc.endTime
            ? Math.round((new Date(inc.endTime) - new Date(inc.startTime)) / 1000 / 60)
            : null;
          return {
            monitor: monitor?.name || inc.url,
            startTime: inc.startTime,
            duration: durationMinutes !== null ? `${durationMinutes} minutes` : "ongoing",
            resolved: inc.resolved,
            error: inc.error || null,
            statusCode: inc.statusCode || null,
          };
        })
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .slice(0, 10);

      // ── Step 3: Build the prompt ──────────────────────────────────────────
      // This is what we hand to the LLM. The quality of the prompt determines
      // the quality of the output. We give it structured data and clear instructions.
      const context = {
        totalMonitors: monitors.length,
        monitorsCurrentlyUp: monitors.filter(m => m.lastStatus === "up").length,
        monitorsCurrentlyDown: monitors.filter(m => m.lastStatus === "down").length,
        totalIncidentsLast7Days: recentIncidents.length,
        monitors: monitorSummaries,
        recentIncidents: incidentDetails,
      };

      const prompt = `You are an infrastructure monitoring assistant for Sentinel, a URL uptime monitoring platform.

Here is the monitoring data for the user's endpoints over the last 7 days:

${JSON.stringify(context, null, 2)}

Write a concise plain-English digest. Be specific — use monitor names, incident counts, and downtime durations. Highlight anything that needs attention. If everything looks healthy, say so clearly. Keep it to 3-5 sentences. Write it as flowing prose with no bullet points or headers.`;

      // ── Step 4: Call the LLM (Groq — free, runs Llama 3) ─────────────────
      // Groq's API is OpenAI-compatible. We send our prompt, get back generated text.
      // The model predicts the next token repeatedly until it decides it's done.
      const GROQ_API_KEY = process.env.GROQ_API_KEY;
      if (!GROQ_API_KEY) return response(500, { error: "GROQ_API_KEY not configured" });

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 250,
          temperature: 0.4, // low temperature = more factual, less creative
        }),
      });

      if (!groqRes.ok) {
        const err = await groqRes.text();
        console.error("Groq error:", err);
        return response(502, { error: "AI service unavailable" });
      }

      const groqData = await groqRes.json();
      const digest = groqData.choices?.[0]?.message?.content?.trim();
      if (!digest) return response(502, { error: "No response from AI" });

      // ── Step 5: Return it ─────────────────────────────────────────────────
      return response(200, {
        digest,
        generatedAt: new Date().toISOString(),
        stats: {
          totalMonitors: context.totalMonitors,
          totalIncidents: context.totalIncidentsLast7Days,
        },
      });
    }

    return response(404, { error: "Not found" });

  } catch (err) {
    console.error(err);
    return response(500, { error: "Internal server error", detail: err.message });
  }
};
