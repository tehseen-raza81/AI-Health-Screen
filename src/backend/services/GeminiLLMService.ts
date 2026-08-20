import { ILLMService, LLMResponse } from '../interfaces/ILLMService';
import { ExtractedHealthInfo, Message } from '../interfaces/IHealthReportService';
import { GeminiAIService } from './GeminiAIService';
import { logger } from '../config/logger';

export class GeminiLLMService implements ILLMService {
  private geminiAI: GeminiAIService;

  constructor(geminiAI?: GeminiAIService) {
    this.geminiAI = geminiAI || new GeminiAIService();
  }

  async generateResponse(
    history: Message[],
    currentState: ExtractedHealthInfo,
    userSpeech: string,
    preferredLanguage?: string
  ): Promise<LLMResponse> {
    logger.info(`[GeminiLLMService] Generating clinical response for user input: "${userSpeech.substring(0, 40)}..."`);
    return await this.geminiAI.generateResponse(history, currentState, userSpeech, preferredLanguage);
  }
}
