import { createGame, getHealth, listGames } from './js/api.js';
import { SyncClient } from './js/sync.js';
import { renderCampaigns, setConnectionStatus, showNotice } from './js/ui.js';

const elements = {
  apiStatus: document.querySelector('[data-status="http"]'),
  syncStatus: document.querySelector('[data-status="sync"]'),
  serverVersion: document.querySelector('[data-server-version]'),
  protocolVersion: document.querySelector('[data-protocol-version]'),
  notice: document.querySelector('[data-notice]'),
  campaignGrid: document.querySelector('[data-campaign-grid]'),
  campaignTemplate: document.querySelector('#campaign-card-template'),
  createForm: document.querySelector('[data-create-form]'),
  submitButton: document.querySelector('[data-submit-game]'),
  refreshButton: document.querySelector('[data-refresh-games]'),
};

async function loadHealth() {
  try {
    const health = await getHealth();
    setConnectionStatus(elements.apiStatus, 'ready', 'API ready');
    elements.serverVersion.textContent = health.serverVersion ?? 'Unknown';
    elements.protocolVersion.textContent = String(health.protocolVersion ?? 'Unknown');
  } catch (error) {
    setConnectionStatus(elements.apiStatus, 'error', 'API unavailable');
    showNotice(elements.notice, error.message, true);
  }
}

async function loadGames({ announce = false } = {}) {
  try {
    elements.refreshButton.disabled = true;
    const games = await listGames();
    renderCampaigns({
      container: elements.campaignGrid,
      template: elements.campaignTemplate,
      games,
      onCopy: copyJoinToken,
    });
    if (announce) showNotice(elements.notice, `Loaded ${games.length} campaign${games.length === 1 ? '' : 's'}.`);
  } catch (error) {
    showNotice(elements.notice, error.message, true);
  } finally {
    elements.refreshButton.disabled = false;
  }
}

async function copyJoinToken(token, button) {
  try {
    await navigator.clipboard.writeText(token);
    const originalLabel = button.textContent;
    button.textContent = 'Join code copied';
    window.setTimeout(() => {
      button.textContent = originalLabel;
    }, 1800);
  } catch {
    showNotice(elements.notice, 'The browser could not copy the join code.', true);
  }
}

async function handleCreate(event) {
  event.preventDefault();
  const formData = new FormData(elements.createForm);
  const input = {
    name: formData.get('name'),
    system: formData.get('system'),
  };

  try {
    elements.submitButton.disabled = true;
    elements.submitButton.textContent = 'Creating campaign…';
    const game = await createGame(input);
    elements.createForm.reset();
    showNotice(elements.notice, `Created “${game.name}” and stored it in SQLite.`);
    await loadGames();
    document.querySelector('#campaigns').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    showNotice(elements.notice, error.message, true);
  } finally {
    elements.submitButton.disabled = false;
    elements.submitButton.textContent = 'Create campaign';
  }
}

const syncClient = new SyncClient({
  onStatus: (state, label) => setConnectionStatus(elements.syncStatus, state, label),
  onWelcome: (payload) => {
    if (payload.serverVersion) elements.serverVersion.textContent = payload.serverVersion;
    if (payload.protocolVersion) elements.protocolVersion.textContent = String(payload.protocolVersion);
  },
});

elements.createForm.addEventListener('submit', handleCreate);
elements.refreshButton.addEventListener('click', () => loadGames({ announce: true }));
window.addEventListener('beforeunload', () => syncClient.disconnect());

await Promise.allSettled([loadHealth(), loadGames()]);
syncClient.connect();
