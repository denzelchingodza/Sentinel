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
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  const method = event.httpMethod;
  const path   = event.path;
  const body   = event.body ? JSON.parse(event.body) : {};

  try {
    // OPTIONS preflight
    if (method === "OPTIONS") return response(200, {});

    // ── POST /monitors — register a URL ──────────────────────────────────────
    if (method === "POST" && path === "/monitors") {
      const { url, name } = body;
      if (!url || !name) return response(400, { error: "url and name are required" });

      const monitor = { id: randomUUID(), url, name, active: true, createdAt: new Date().toISOString(), lastStatus: "unknown", lastChecked: null, lastResponseTime: null };
      await dynamo.send(new PutCommand({ TableName: MONITORS_TABLE, Item: monitor }));
      return response(201, monitor);
    }

    // ── GET /monitors — list all monitors ────────────────────────────────────
    if (method === "GET" && path === "/monitors") {
      const { Items = [] } = await dynamo.send(new ScanCommand({ TableName: MONITORS_TABLE }));
      return response(200, Items);
    }

    // ── DELETE /monitors/{id} — remove a monitor ─────────────────────────────
    if (method === "DELETE" && path.startsWith("/monitors/")) {
      const id = path.split("/")[2];
      await dynamo.send(new DeleteCommand({ TableName: MONITORS_TABLE, Key: { id } }));
      return response(200, { message: "Monitor deleted" });
    }

    // ── GET /monitors/{id}/history — uptime history ───────────────────────────
    if (method === "GET" && path.match(/^\/monitors\/[^/]+\/history$/)) {
      const id    = path.split("/")[2];
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

    // ── GET /incidents — all active incidents ─────────────────────────────────
    if (method === "GET" && path === "/incidents") {
      const { Items = [] } = await dynamo.send(new ScanCommand({
        TableName: INCIDENTS_TABLE,
        FilterExpression: "resolved = :r",
        ExpressionAttributeValues: { ":r": false },
      }));
      return response(200, Items);
    }

    // ── GET /incidents/all — all incidents including resolved ─────────────────
    if (method === "GET" && path === "/incidents/all") {
      const { Items = [] } = await dynamo.send(new ScanCommand({ TableName: INCIDENTS_TABLE }));
      return response(200, Items);
    }

    return response(404, { error: "Not found" });

  } catch (err) {
    console.error(err);
    return response(500, { error: "Internal server error", detail: err.message });
  }
};
