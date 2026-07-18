const SYSTEM_LABELS = {
  dnd5e: 'D&D 5e',
  coc: 'Call of Cthulhu',
};

function formatDate(value) {
  if (!value) return 'Not played yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function maskedToken(token) {
  if (!token) return 'Unavailable';
  if (token.length <= 10) return token;
  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}

export function setConnectionStatus(element, state, label) {
  element.classList.toggle('is-ready', state === 'ready');
  element.classList.toggle('is-error', state === 'error');
  element.lastChild.textContent = ` ${label}`;
}

export function showNotice(element, message, isError = false) {
  element.hidden = !message;
  element.textContent = message;
  element.classList.toggle('is-error', isError);
}

export function renderCampaigns({ container, template, games, onCopy }) {
  container.replaceChildren();

  if (!games.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const title = document.createElement('h3');
    title.textContent = 'No campaigns yet';
    const message = document.createElement('p');
    message.textContent = 'Create the first campaign below. It will be stored in the local SQLite database.';
    empty.append(title, message);
    container.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  games.forEach((game) => {
    const card = template.content.firstElementChild.cloneNode(true);
    card.querySelector('h3').textContent = game.name;
    card.querySelector('.system-badge').textContent = SYSTEM_LABELS[game.system] ?? game.system;
    card.querySelector('.campaign-date').textContent = formatDate(game.lastPlayedAt);
    card.querySelector('.campaign-state').textContent = game.activeMapId
      ? 'Map session ready to resume.'
      : 'Campaign created. Map setup is the next milestone.';
    card.querySelector('[data-map-status]').textContent = game.activeMapId ? 'Assigned' : 'Not assigned';
    card.querySelector('[data-join-token]').textContent = maskedToken(game.joinToken);

    const copyButton = card.querySelector('[data-copy-token]');
    copyButton.addEventListener('click', () => onCopy(game.joinToken, copyButton));
    fragment.append(card);
  });

  container.append(fragment);
}
