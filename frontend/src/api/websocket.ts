import type { StreamEvent } from '../types/chat';
import { getAuthToken } from './authToken';

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private onEvent: (event: StreamEvent) => void;
  private tripId: string;
  private closedByClient = false;
  private hasCompleted = false;

  constructor(tripId: string, onEvent: (event: StreamEvent) => void) {
    this.tripId = tripId;
    this.onEvent = onEvent;
  }

  async connect() {
    this.closedByClient = false;
    this.hasCompleted = false;

    const apiUrl = import.meta.env.VITE_API_URL || '';
    let url: string;
    if (apiUrl) {
      // Production: connect to backend directly
      const wsUrl = apiUrl.replace(/^http/, 'ws');
      url = `${wsUrl}/ws/trips/${this.tripId}/chat`;
    } else {
      // Dev: go through Vite proxy
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      url = `${protocol}//${window.location.host}/ws/trips/${this.tripId}/chat`;
    }
    // Attach auth token as query param
    const token = await getAuthToken();
    if (token) {
      url += `?token=${encodeURIComponent(token)}`;
    } else {
      console.error('[WS] No auth token available');
      this.onEvent({ type: 'error', content: 'Authentication failed — please sign in again.' });
      return;
    }

    console.log('[WS] Connecting to:', url.replace(/token=[^&]+/, 'token=***'));
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data);
        if (data.type === 'complete') {
          this.hasCompleted = true;
        }
        this.onEvent(data);
      } catch {
        console.error('Failed to parse WS message:', event.data);
      }
    };

    this.ws.onerror = (err) => {
      console.error('[WS] Error:', err);
      this.onEvent({ type: 'error', content: 'WebSocket connection error. The server may be starting up — try again in a moment.' });
    };

    this.ws.onclose = (event) => {
      console.log('[WS] Closed', event.code, event.reason);
      if (!this.closedByClient && !this.hasCompleted) {
        const hint = event.code === 1006
          ? 'Connection lost — the server may have timed out. Your itinerary may still be generating in the background.'
          : `Connection closed (code: ${event.code})`;
        this.onEvent({ type: 'error', content: hint });
      }
    };

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
        this.ws?.close();
      }, 15000);

      this.ws!.onopen = () => {
        clearTimeout(timeout);
        console.log('[WS] Connected');
        resolve();
      };

      const origOnError = this.ws!.onerror;
      this.ws!.onerror = (err) => {
        clearTimeout(timeout);
        if (origOnError) origOnError.call(this.ws!, err);
        reject(new Error('WebSocket connection failed'));
      };
    });
  }

  send(action: string, message: string = '') {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action, message }));
    }
  }

  disconnect() {
    this.closedByClient = true;
    this.ws?.close();
    this.ws = null;
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
