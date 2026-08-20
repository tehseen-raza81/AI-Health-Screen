import { ExtractedHealthInfo, Message } from './IHealthReportService';

export interface LLMResponse {
  assistantResponse: string;
  extractedInfo?: Partial<ExtractedHealthInfo>;
  isScreeningComplete?: boolean;
  languageDetected?: string;
}

export interface ILLMService {
  generateResponse(
    history: Message[],
    currentState: ExtractedHealthInfo,
    userSpeech: string,
    preferredLanguage?: string
  ): Promise<LLMResponse>;
}
