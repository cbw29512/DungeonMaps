async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    ...options,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok === false) {
    throw new Error(body.message || `Request failed with HTTP ${response.status}`);
  }
  return body;
}

export async function getHealth() {
  return request('/health');
}

export async function listGames() {
  const body = await request('/api/games');
  return body.games ?? [];
}

export async function createGame(input) {
  const body = await request('/api/games', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return body.game;
}
