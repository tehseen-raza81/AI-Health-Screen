import { WebSocket } from 'ws';
import { ConversationOrchestrator } from '../conversation/ConversationOrchestrator';
import { ClientMessage, ServerMessage } from './messageTypes';
import { logger } from '../config/logger';

export class CallSession {
  public id: string;
  public ws: WebSocket;
  public orchestrator: ConversationOrchestrator;
  private audioChunks: Buffer[] = [];
  private isEnded: boolean = false;

  constructor(ws: WebSocket) {
    this.id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    this.ws = ws;
    this.orchestrator = new ConversationOrchestrator();
    logger.info(`CallSession created [${this.id}]`);
  }

  send(msg: ServerMessage) {
    if (this.ws.readyState === WebSocket.OPEN && !this.isEnded) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  async handleMessage(data: string | Buffer) {
    try {
      const parsed: ClientMessage = JSON.parse(data.toString());
      logger.info(`Session [${this.id}] received client message: ${parsed.type}`);

      switch (parsed.type) {
        case 'ping':
          if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'pong' }));
          }
          break;

        case 'start_call': {
          this.isEnded = false;
          const lang = parsed.language || 'en';
          this.orchestrator = new ConversationOrchestrator(lang);
          this.audioChunks = [];

          this.send({
            type: 'status_change',
            status: 'connecting',
            message: 'Initializing screening session...',
          });

          // Generate initial greeting
          const greeting = await this.orchestrator.getInitialGreeting(lang);

          if (this.isEnded) return;

          this.send({
            type: 'call_started',
            status: 'speaking',
            history: this.orchestrator.state.history,
            extractedInfo: this.orchestrator.state.extractedInfo,
            audioBase64: greeting.audioBuffer ? greeting.audioBuffer.toString('base64') : undefined,
            mimeType: greeting.mimeType || 'audio/mpeg',
          });
          break;
        }

        case 'audio_chunk': {
          if (this.isEnded) return;
          if (parsed.audioBase64) {
            const buf = Buffer.from(parsed.audioBase64, 'base64');
            this.audioChunks.push(buf);
          }
          break;
        }

        case 'audio_turn_complete': {
          if (this.isEnded) return;
          let combinedBuffer: Buffer;
          if (parsed.audioBase64) {
            combinedBuffer = Buffer.from(parsed.audioBase64, 'base64');
          } else if (this.audioChunks.length > 0) {
            combinedBuffer = Buffer.concat(this.audioChunks);
            this.audioChunks = [];
          } else {
            logger.warn('Audio turn complete received with no audio data');
            this.send({
              type: 'status_change',
              status: 'listening',
              message: 'No audio detected, listening again...',
            });
            return;
          }

          this.send({
            type: 'status_change',
            status: 'processing',
            message: 'Analyzing your response...',
          });

          const result = await this.orchestrator.handleAudioTurn(
            combinedBuffer,
            parsed.mimeType || 'audio/webm'
          );

          if (this.isEnded) return;

          this.send({
            type: 'transcript_update',
            status: 'speaking',
            history: this.orchestrator.state.history,
            extractedInfo: this.orchestrator.state.extractedInfo,
            audioBase64: result.audioBuffer ? result.audioBuffer.toString('base64') : undefined,
            mimeType: result.mimeType || 'audio/mpeg',
          });
          break;
        }

        case 'user_text': {
          if (this.isEnded) return;
          if (!parsed.text || parsed.text.trim() === '') return;

          this.send({
            type: 'status_change',
            status: 'processing',
            message: 'Analyzing your response...',
          });

          const res = await this.orchestrator.handleTextTurn(parsed.text.trim());

          if (this.isEnded) return;

          this.send({
            type: 'transcript_update',
            status: 'speaking',
            history: this.orchestrator.state.history,
            extractedInfo: this.orchestrator.state.extractedInfo,
            audioBase64: res.audioBuffer ? res.audioBuffer.toString('base64') : undefined,
            mimeType: res.mimeType || 'audio/mpeg',
          });
          break;
        }

        case 'end_call': {
          this.send({
            type: 'status_change',
            status: 'processing',
            message: 'Generating your structured health screening report...',
          });

          const report = await this.orchestrator.generateFinalReport();
          this.isEnded = true;

          if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
              type: 'report_ready',
              status: 'ended',
              report,
              history: this.orchestrator.state.history,
              extractedInfo: this.orchestrator.state.extractedInfo,
            }));
          }
          break;
        }

        default:
          logger.warn(`Unknown message type received: ${(parsed as { type?: string }).type}`);
      }
    } catch (error: unknown) {
      logger.error('Error handling WebSocket message in CallSession:', error);
      const errMsg = error instanceof Error ? error.message : 'An unexpected error occurred during the call.';
      if (this.ws.readyState === WebSocket.OPEN && !this.isEnded) {
        this.ws.send(JSON.stringify({
          type: 'error',
          error: errMsg,
          status: 'error',
        }));
      }
    }
  }

  cleanup() {
    this.isEnded = true;
    this.audioChunks = [];
    logger.info(`Cleaned up session [${this.id}]`);
  }
}
