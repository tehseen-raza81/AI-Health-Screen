import { ExtractedHealthInfo, Message, StructuredHealthReport, CallStatus } from '../types';

export interface WebSocketCallbacks {
  onStatusChange?: (status: CallStatus, message?: string) => void;
  onHistoryUpdate?: (history: Message[]) => void;
  onExtractedInfoUpdate?: (info: ExtractedHealthInfo) => void;
  onAudioResponse?: (audioBase64: string, mimeType: string) => void;
  onReportReady?: (report: StructuredHealthReport) => void;
  onError?: (errorMessage: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private callbacks: WebSocketCallbacks = {};
  private pingInterval: number | null = null;
  private isIntentionalClose: boolean = false;

  constructor(callbacks: WebSocketCallbacks) {
    this.callbacks = callbacks;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isIntentionalClose = false;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      console.log(`[WebSocket] Connecting to ${wsUrl}...`);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connection open.');
        this.startPing();
        if (this.callbacks.onOpen) this.callbacks.onOpen();
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (err) {
          console.error('[WebSocket] JSON parse error:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.error('[WebSocket] Error:', err);
        if (this.callbacks.onError) {
          this.callbacks.onError('Connection error with voice server.');
        }
        reject(err);
      };

      this.ws.onclose = (event) => {
        console.log('[WebSocket] Closed (code:', event.code, ')');
        this.stopPing();
        if (this.callbacks.onClose && !this.isIntentionalClose) {
          this.callbacks.onClose();
        }
      };
    });
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 15000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleServerMessage(msg: {
    type: string;
    status?: CallStatus;
    message?: string;
    history?: Message[];
    extractedInfo?: ExtractedHealthInfo;
    audioBase64?: string;
    mimeType?: string;
    report?: StructuredHealthReport;
    error?: string;
  }) {
    switch (msg.type) {
      case 'call_started':
      case 'transcript_update':
        if (msg.audioBase64 && this.callbacks.onAudioResponse) {
          this.callbacks.onAudioResponse(msg.audioBase64, msg.mimeType || 'audio/mpeg');
        }
        if (msg.extractedInfo && this.callbacks.onExtractedInfoUpdate) {
          this.callbacks.onExtractedInfoUpdate(msg.extractedInfo);
        }
        if (msg.history && this.callbacks.onHistoryUpdate) {
          this.callbacks.onHistoryUpdate(msg.history);
        }
        if (msg.status && this.callbacks.onStatusChange) {
          this.callbacks.onStatusChange(msg.status, msg.message);
        }
        break;

      case 'status_change':
        if (msg.status && this.callbacks.onStatusChange) {
          this.callbacks.onStatusChange(msg.status, msg.message);
        }
        break;

      case 'report_ready':
        if (msg.report && this.callbacks.onReportReady) {
          this.callbacks.onReportReady(msg.report);
        }
        if (msg.history && this.callbacks.onHistoryUpdate) {
          this.callbacks.onHistoryUpdate(msg.history);
        }
        if (msg.status && this.callbacks.onStatusChange) {
          this.callbacks.onStatusChange(msg.status, msg.message);
        }
        break;

      case 'error':
        if (this.callbacks.onError) {
          this.callbacks.onError(msg.error || 'An error occurred during communication.');
        }
        break;

      case 'pong':
        break;

      default:
        console.log('[WebSocket] Unrecognized server message:', msg);
    }
  }

  startCall(language: string = 'en') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'start_call',
          language,
        })
      );
    }
  }

  sendAudioTurn(base64Data: string, mimeType: string = 'audio/webm') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'audio_turn_complete',
          audioBase64: base64Data,
          mimeType,
        })
      );
    }
  }

  sendUserText(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'user_text',
          text,
        })
      );
    }
  }

  endCall() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'end_call',
        })
      );
    }
  }

  disconnect() {
    this.isIntentionalClose = true;
    this.stopPing();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
  }
}
