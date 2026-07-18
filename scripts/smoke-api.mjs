// smoke-api.mjs — verifies validation plus create/list campaign state.

const baseUrl = process.env.DUNGEONMAPS_BASE_URL ?? 'http://localhost:5174';
const gameName = `Smoke Test ${new Date().toISOString()}`;

async function readJson(response) {
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`Response was not valid JSON: ${error.message}`);
  }
}

try {
  const invalidResponse = await fetch(`${baseUrl}/api/games`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Invalid system', system: 'unknown' }),
  });
  const invalidBody = await readJson(invalidResponse);
  if (invalidResponse.status !== 400 || invalidBody.error !== 'bad_request') {
    throw new Error(`Invalid campaign was not rejected: ${JSON.stringify(invalidBody)}`);
  }

  const createResponse = await fetch(`${baseUrl}/api/games`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: gameName, system: 'dnd5e' }),
  });

  const createBody = await readJson(createResponse);
  if (createResponse.status !== 201 || createBody.ok !== true) {
    throw new Error(`Create game failed: HTTP ${createResponse.status} ${JSON.stringify(createBody)}`);
  }
  if (createResponse.headers.get('cache-control') !== 'no-store') {
    throw new Error('Campaign API must disable caching.');
  }

  const created = createBody.game;
  if (!created.id || !created.joinToken || created.name !== gameName || created.system !== 'dnd5e') {
    throw new Error(`Created game shape is wrong: ${JSON.stringify(created)}`);
  }

  const listResponse = await fetch(`${baseUrl}/api/games`);
  const listBody = await readJson(listResponse);
  if (!listResponse.ok || listBody.ok !== true || !Array.isArray(listBody.games)) {
    throw new Error(`List games failed: HTTP ${listResponse.status} ${JSON.stringify(listBody)}`);
  }

  const found = listBody.games.find((game) => game.id === created.id);
  if (!found) throw new Error(`Created game ${created.id} was not returned by /api/games.`);

  console.log(`[smoke:api] PASS ${baseUrl}/api/games`);
  console.log(JSON.stringify({ invalidInputRejected: true, created: found, totalGames: listBody.games.length }, null, 2));
} catch (error) {
  console.error(`[smoke:api] FAIL ${baseUrl}/api/games`);
  console.error(error.message);
  process.exit(1);
}
