// smoke-http.mjs — verifies the server health endpoint while npm start is running.

const baseUrl = process.env.DUNGEONMAPS_BASE_URL ?? 'http://localhost:5174';
const healthUrl = `${baseUrl}/health`;

try {
  const response = await fetch(healthUrl);
  if (!response.ok) {
    throw new Error(`Expected HTTP 200, got HTTP ${response.status}`);
  }

  const body = await response.json();
  if (body.ok !== true || body.service !== 'dungeonmaps') {
    throw new Error(`Unexpected health body: ${JSON.stringify(body)}`);
  }

  if (!Array.isArray(body.tables) || body.tables.length < 8) {
    throw new Error(`Expected at least 8 schema tables, got ${JSON.stringify(body.tables)}`);
  }

  console.log(`[smoke:http] PASS ${healthUrl}`);
  console.log(JSON.stringify(body, null, 2));
} catch (error) {
  console.error(`[smoke:http] FAIL ${healthUrl}`);
  console.error(error.message);
  process.exit(1);
}
