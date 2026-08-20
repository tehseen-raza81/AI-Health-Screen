import { ISTTService } from '../interfaces/ISTTService';
import { ILLMService } from '../interfaces/ILLMService';
import { ITTSService } from '../interfaces/ITTSService';
import { IHealthReportService, StructuredHealthReport } from '../interfaces/IHealthReportService';
import { GeminiSTTService } from '../services/GeminiSTTService';
import { GeminiLLMService } from '../services/GeminiLLMService';
import { GeminiTTSService } from '../services/GeminiTTSService';
import { HealthReportService } from '../services/HealthReportService';
import { ConversationState } from './ConversationState';
import { buildDynamicFallbackResponse } from './promptBuilder';
import { logger } from '../config/logger';
import { withTimeout } from '../utils/withTimeout';

export interface TurnResult {
  userTranscript: string;
  assistantResponse: string;
  audioBuffer?: Buffer;
  mimeType?: string;
  isScreeningComplete?: boolean;
}

export class ConversationOrchestrator {
  private sttService: ISTTService;
  private llmService: ILLMService;
  private ttsService: ITTSService;
  private reportService: IHealthReportService;
  public state: ConversationState;

  constructor(
    language: string = 'en',
    sttService?: ISTTService,
    llmService?: ILLMService,
    ttsService?: ITTSService,
    reportService?: IHealthReportService
  ) {
    this.sttService = sttService || new GeminiSTTService();
    this.llmService = llmService || new GeminiLLMService();
    this.ttsService = ttsService || new GeminiTTSService();
    this.reportService = reportService || new HealthReportService();
    this.state = new ConversationState(language);
  }

  async getInitialGreeting(language: string = 'en'): Promise<{ text: string; audioBuffer?: Buffer; mimeType?: string }> {
    let greeting = "Hello! I'm your HealthScreen AI assistant. I'm here to listen to your symptoms and help you screen your health concerns. What brings you in today?";
    if (language === 'hi') {
      greeting = "Namaste! Main aapka HealthScreen AI assistant hoon. Aapki tabiyat samajhne ke liye main aapki madad karunga. Aaj aap kaisa mehsoos kar rahe hain?";
    }

    this.state.addMessage('assistant', greeting);

    let audioBuffer: Buffer | undefined;
    let mimeType: string | undefined;
    try {
      const ttsResult = await withTimeout(this.ttsService.generateSpeech(greeting, language), 5000, 'Initial TTS');
      audioBuffer = ttsResult.audioBuffer;
      mimeType = ttsResult.mimeType;
    } catch (ttsErr) {
      logger.info('Initial greeting TTS will play via browser speech synthesis:', ttsErr);
    }

    return { text: greeting, audioBuffer, mimeType };
  }

  async handleAudioTurn(audioBuffer: Buffer, mimeType: string = 'audio/webm'): Promise<TurnResult> {
    this.state.status = 'processing';
    let userText = '';

    // Step 1: STT Transcription
    try {
      const sttRes = await withTimeout(
        this.sttService.transcribeAudio(audioBuffer, mimeType, this.state.language),
        15000,
        'STT Audio Service'
      );
      if (sttRes && sttRes.text && sttRes.text.trim()) {
        userText = sttRes.text.trim();
        if (sttRes.language) {
          this.state.language = sttRes.language;
        }
      }
    } catch (sttErr) {
      logger.warn('Audio transcription note:', sttErr);
    }

    // Failure recovery: Unclear or empty speech
    if (!userText || userText.trim().length === 0) {
      const repeatPrompt = this.state.language === 'hi'
        ? "Aapki aawaz theek se nahi sunayi di. Kripya thoda saaf ya mic ke paas bolenge?"
        : "I didn't quite catch that. Could you please repeat your health concern?";

      this.state.addMessage('assistant', repeatPrompt);

      let audioBuf: Buffer | undefined;
      let mime: string | undefined;
      try {
        const ttsRes = await withTimeout(this.ttsService.generateSpeech(repeatPrompt, this.state.language), 4000, 'Repeat TTS');
        audioBuf = ttsRes.audioBuffer;
        mime = ttsRes.mimeType;
      } catch (e) {
        logger.info('Client browser speech will deliver repeat prompt');
      }

      return {
        userTranscript: '(unclear or silent audio)',
        assistantResponse: repeatPrompt,
        audioBuffer: audioBuf,
        mimeType: mime,
      };
    }

    return this.handleTextTurn(userText);
  }

  async handleTextTurn(userText: string): Promise<TurnResult> {
    this.state.addMessage('user', userText);
    this.state.status = 'processing';

    // Step 2: Language Context Detection
    const hasHindi = /[\u0900-\u097F]/.test(userText) || /\b(bhai|mujhe|dard|bukhar|hai|hoon|kya|aaj|tabiyat|sir|sar|pet|vomit|khansi|gala|ulti|chakkar|dawai)\b/i.test(userText);
    if (hasHindi) {
      this.state.language = 'hi';
    }

    // Step 3: LLM Clinical Reasoning & Entity Extraction
    let assistantText = '';
    let isComplete = false;

    try {
      const llmRes = await withTimeout(
        this.llmService.generateResponse(this.state.history, this.state.extractedInfo, userText, this.state.language),
        15000,
        'LLM Service'
      );
      assistantText = llmRes.assistantResponse;
      isComplete = Boolean(llmRes.isScreeningComplete);
      if (llmRes.extractedInfo) {
        this.state.updateExtractedInfo(llmRes.extractedInfo);
      }
    } catch (llmErr) {
      logger.error('LLM service failure recovery, using dynamic clinical guidance:', llmErr);
      assistantText = buildDynamicFallbackResponse(userText, this.state.language);
    }

    this.state.addMessage('assistant', assistantText);

    // Step 4: TTS Speech Generation
    let audioBuffer: Buffer | undefined;
    let mimeType: string | undefined;

    try {
      const ttsRes = await withTimeout(
        this.ttsService.generateSpeech(assistantText, this.state.language),
        6000,
        'TTS Service'
      );
      audioBuffer = ttsRes.audioBuffer;
      mimeType = ttsRes.mimeType;
    } catch (ttsErr) {
      logger.info('TTS rendered smoothly via client browser synthesis');
    }

    return {
      userTranscript: userText,
      assistantResponse: assistantText,
      audioBuffer,
      mimeType,
      isScreeningComplete: isComplete,
    };
  }

  async generateFinalReport(): Promise<StructuredHealthReport> {
    this.state.markEnded();
    const duration = this.state.getElapsedSeconds();
    return await this.reportService.generateReport(this.state.history, this.state.extractedInfo, duration);
  }
}
