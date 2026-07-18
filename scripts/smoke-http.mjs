// smoke-http.mjs — verifies health, dashboard delivery, and defensive headers.

const baseUrl = process.env.DUNGEONMAPS_BASE_URL ?? 'http://localhost:5174';
const healthUrl = `${baseUrl}/health`;
const dashboardUrl = `${baseUrl}/`;

try {
  const healthResponse = await fetch(healthUrl);
  if (!healthResponse.ok) {
    throw new Error(`Expected health HTTP 200, got HTTP ${healthResponse.status}`);
  }

  const health = await healthResponse.json();
  if (health.ok !== true || health.service !== 'dungeonmaps') {
    throw new Error(`Unexpected health body: ${JSON.stringify(health)}`);
  }
  if (!Array.isArray(health.tables) || health.tables.length < 8) {
    throw new Error(`Expected at least 8 schema tables, got ${JSON.stringify(health.tables)}`);
  }
  if (healthResponse.headers.get('cache-control') !== 'no-store') {
    throw new Error('Health endpoint must disable caching.');
  }
  if (healthResponse.headers.get('x-frame-options') !== 'DENY') {
    throw new Error('Expected X-Frame-Options: DENY.');
  }

  const dashboardResponse = await fetch(dashboardUrl);
  const dashboard = await dashboardResponse.text();
  if (!dashboardResponse.ok || !dashboard.includes('Local-first tabletop control room')) {
    throw new Error('Dashboard HTML was not served correctly.');
  }
  if (!dashboard.includes('data-create-form') || !dashboard.includes('campaign-card-template')) {
    throw new Error('Dashboard is missing the campaign workflow markup.');
  }

  const appResponse = await fetch(`${baseUrl}/app.js`);
  const appSource = await appResponse.text();
  if (!appResponse.ok || !appSource.includes('SyncClient')) {
    throw new Error('Dashboard module was not served correctly.');
  }

  console.log(`[smoke:http] PASS ${dashboardUrl}`);
  console.log(JSON.stringify(health, null, 2));
} catch (error) {
  console.error(`[smoke:http] FAIL ${dashboardUrl}`);
  console.error(error.message);
  process.exit(1);
}
