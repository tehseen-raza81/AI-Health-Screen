import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { CallSession } from './CallSession';
import { logger } from '../config/logger';

export class AppServer {
  private wss: WebSocketServer;
  private sessions = new Map<WebSocket, CallSession>();

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const ip = req.socket.remoteAddress;
      logger.info(`New WebSocket client connected from ${ip}`);

      const session = new CallSession(ws);
      this.sessions.set(ws, session);

      ws.on('message', async (data: Buffer | string) => {
        await session.handleMessage(data);
      });

      ws.on('close', () => {
        logger.info(`WebSocket client disconnected [${session.id}]`);
        session.cleanup();
        this.sessions.delete(ws);
      });

      ws.on('error', (err) => {
        logger.error(`WebSocket error in session [${session.id}]:`, err);
        session.cleanup();
        this.sessions.delete(ws);
      });
    });

    this.wss.on('error', (err) => {
      logger.error('WebSocket Server error:', err);
    });
  }
}
