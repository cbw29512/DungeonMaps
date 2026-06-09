// config.js — validates runtime settings before the server boots.
// This keeps bad PORT/HOST values from failing later with unclear errors.

const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_PORT = 5174;

function readPort(rawPort) {
  // Empty PORT means use the simple local default.
  if (rawPort === undefined || rawPort === '') return DEFAULT_PORT;

  const parsed = Number.parseInt(rawPort, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid PORT value "${rawPort}". Use a number from 1 to 65535.`);
  }
  return parsed;
}

function readHost(rawHost) {
  // 0.0.0.0 lets the LAN join later while localhost still works on the DM machine.
  return rawHost && rawHost.trim() ? rawHost.trim() : DEFAULT_HOST;
}

export function loadConfig(env = process.env) {
  return {
    host: readHost(env.HOST),
    port: readPort(env.PORT),
    serverVersion: '0.1.1',
  };
}
