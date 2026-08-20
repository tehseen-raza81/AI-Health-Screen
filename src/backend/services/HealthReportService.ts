import {
  ExtractedHealthInfo,
  IHealthReportService,
  Message,
  StructuredHealthReport,
} from '../interfaces/IHealthReportService';
import { GeminiAIService } from './GeminiAIService';

export class HealthReportService implements IHealthReportService {
  private gemini: GeminiAIService;

  constructor() {
    this.gemini = new GeminiAIService();
  }

  async generateReport(
    history: Message[],
    extractedInfo: ExtractedHealthInfo,
    sessionDurationSeconds: number
  ): Promise<StructuredHealthReport> {
    return this.gemini.generateReport(history, extractedInfo, sessionDurationSeconds);
  }
}
