import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { AppServer } from './src/backend/websocket/AppServer';
import { ENV } from './src/backend/config/env';
import { logger } from './src/backend/config/logger';
import { GeminiAIService } from './src/backend/services/GeminiAIService';
import { GeminiTTSService } from './src/backend/services/GeminiTTSService';
import { HealthReportService } from './src/backend/services/HealthReportService';

async function startServer() {
  const app = express();
  const PORT = ENV.PORT || 3000;
  const geminiAI = new GeminiAIService();
  const geminiTTS = new GeminiTTSService();

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // REST API Routes
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      provider: 'Google Gemini AI',
      models: {
        chat: 'gemini-3.7-flash',
        stt: 'gemini-3.7-flash (multimodal audio)',
        tts: 'gemini-3.1-flash-tts-preview / Browser Speech Synthesis',
        report: 'gemini-3.7-flash',
      },
      configured: {
        gemini: Boolean(process.env.GEMINI_API_KEY || ENV.GEMINI_API_KEY),
      },
    });
  });

  // REST endpoint for direct Gemini Chat / Screening turn
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history = [], extractedInfo = {}, language = 'en' } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const response = await geminiAI.generateResponse(
        history,
        extractedInfo,
        message,
        language
      );
      res.json(response);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Chat Error';
      res.status(500).json({ error: msg });
    }
  });

  // REST fallback for direct TTS endpoint
  app.post('/api/tts', async (req, res) => {
    try {
      const { text, language } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }
      const speech = await geminiTTS.generateSpeech(text, language);
      res.set('Content-Type', speech.mimeType);
      res.send(speech.audioBuffer);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'TTS Error';
      res.status(500).json({ error: msg });
    }
  });

  // REST endpoint to generate health report
  app.post('/api/report', async (req, res) => {
    try {
      const { history, extractedInfo, sessionDurationSeconds } = req.body;
      const reportService = new HealthReportService();
      const report = await reportService.generateReport(
        history || [],
        extractedInfo || {
          name: '',
          mainConcern: '',
          duration: '',
          severity: '',
          relatedSymptoms: '',
          additionalInfo: '',
        },
        sessionDurationSeconds || 0
      );
      res.json(report);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Report Error';
      res.status(500).json({ error: msg });
    }
  });

  const server = http.createServer(app);

  // Initialize WebSocket AppServer on same HTTP server
  new AppServer(server);

  // Vite middleware for dev or static serving for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`HealthAI Voice Screening server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
