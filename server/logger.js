// logger.js — tiny structured console logger for the local server.
// Keeping logging in one module prevents random console.log formats everywhere.

function nowIso() {
  // ISO timestamps make pasted logs easy to sort and compare later.
  return new Date().toISOString();
}

function formatMeta(meta) {
  // Only append metadata when there is something useful to show.
  if (!meta || Object.keys(meta).length === 0) return '';
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return ' {"meta":"unserializable"}';
  }
}

function errorMeta(error, extra = {}) {
  // Preserve the useful error fields without dumping huge stack traces by default.
  if (!error) return extra;
  return {
    ...extra,
    name: error.name,
    message: error.message,
    code: error.code,
  };
}

export function logInfo(scope, message, meta = {}) {
  console.log(`[${nowIso()}] [info] [${scope}] ${message}${formatMeta(meta)}`);
}

export function logWarn(scope, message, meta = {}) {
  console.warn(`[${nowIso()}] [warn] [${scope}] ${message}${formatMeta(meta)}`);
}

export function logError(scope, message, error = null, meta = {}) {
  console.error(`[${nowIso()}] [error] [${scope}] ${message}${formatMeta(errorMeta(error, meta))}`);
}
