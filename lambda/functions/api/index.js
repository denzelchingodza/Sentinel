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

    return response(404, { error: "Not found" });

  } catch (err) {
    console.error(err);
    return response(500, { error: "Internal server error", detail: err.message });
  }
};
