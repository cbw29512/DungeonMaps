function websocketUrl() {
  const scheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${scheme}//${window.location.host}/sync`;
}

export class SyncClient {
  constructor({ onStatus, onWelcome }) {
    this.onStatus = onStatus;
    this.onWelcome = onWelcome;
    this.socket = null;
    this.pingTimer = null;
    this.reconnectTimer = null;
    this.shouldReconnect = true;
  }

  connect() {
    this.clearReconnect();
    this.onStatus('connecting', 'Sync connecting');

    try {
      this.socket = new WebSocket(websocketUrl());
    } catch (error) {
      this.handleDisconnect(error.message);
      return;
    }

    this.socket.addEventListener('open', () => {
      this.onStatus('ready', 'Sync connected');
      this.send('client/hello', { role: 'dm', client: 'dashboard' });
      this.startHeartbeat();
    });

    this.socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'server/welcome') {
          this.onWelcome(message.payload ?? {});
        }
      } catch {
        this.onStatus('error', 'Sync message error');
      }
    });

    this.socket.addEventListener('close', () => this.handleDisconnect('connection closed'));
    this.socket.addEventListener('error', () => this.onStatus('error', 'Sync interrupted'));
  }

  send(type, payload = {}) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
    this.socket.send(JSON.stringify({
      type,
      payload,
      requestId: crypto.randomUUID(),
    }));
    return true;
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = window.setInterval(() => {
      this.send('client/ping');
    }, 20000);
  }

  stopHeartbeat() {
    if (this.pingTimer) window.clearInterval(this.pingTimer);
    this.pingTimer = null;
  }

  clearReconnect() {
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  handleDisconnect() {
    this.stopHeartbeat();
    this.onStatus('error', 'Sync reconnecting');
    if (!this.shouldReconnect) return;
    this.clearReconnect();
    this.reconnectTimer = window.setTimeout(() => this.connect(), 3000);
  }

  disconnect() {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    this.clearReconnect();
    if (this.socket) this.socket.close();
  }
}
