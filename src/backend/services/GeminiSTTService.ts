import { ISTTService, STTResponse } from '../interfaces/ISTTService';
import { GeminiAIService } from './GeminiAIService';
import { logger } from '../config/logger';

export class GeminiSTTService implements ISTTService {
  private geminiAI: GeminiAIService;

  constructor(geminiAI?: GeminiAIService) {
    this.geminiAI = geminiAI || new GeminiAIService();
  }

  async transcribeAudio(
    audioBuffer: Buffer,
    mimeType: string = 'audio/webm',
    languageHint?: string
  ): Promise<STTResponse> {
    logger.info(`[GeminiSTTService] Transcribing audio buffer (${audioBuffer.length} bytes, ${mimeType})`);
    return await this.geminiAI.transcribeAudio(audioBuffer, mimeType, languageHint);
  }
}
