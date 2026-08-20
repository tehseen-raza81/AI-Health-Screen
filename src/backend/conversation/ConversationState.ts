import { ExtractedHealthInfo, Message } from '../interfaces/IHealthReportService';

export type CallStatus = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'ended' | 'error';

export type ConversationStage =
  | 'greeting'
  | 'name'
  | 'main_concern'
  | 'duration'
  | 'severity'
  | 'related_symptoms'
  | 'history_and_comfort'
  | 'wrap_up';

function isGreetingOrName(str: string): boolean {
  if (!str) return true;
  const s = str.toLowerCase().trim();
  if (
    /^(hello|hi|hey|namaste|good morning|good evening|good afternoon|haan|theek hai|yes|no|okay|ok|fine|mera naam|my name is|i am|myself)\b/i.test(
      s
    )
  ) {
    return true;
  }
  if (s.includes('my name is') || s.includes('mera naam') || s.includes('name is') || s.includes('naam hai')) {
    return true;
  }
  return false;
}

export class ConversationState {
  public history: Message[] = [];
  public extractedInfo: ExtractedHealthInfo = {
    name: '',
    mainConcern: '',
    duration: '',
    severity: '',
    relatedSymptoms: '',
    additionalInfo: '',
  };
  public askedQuestions: string[] = [];
  public currentStage: ConversationStage = 'greeting';
  public status: CallStatus = 'idle';
  public startTime: number = 0;
  public endTime: number = 0;
  public language: string = 'en';

  constructor(language: string = 'en') {
    this.language = language;
    this.startTime = Date.now();
    this.currentStage = 'greeting';
  }

  addMessage(role: 'assistant' | 'user' | 'system', text: string): Message {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const message: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      role,
      text,
      timestamp: timeString,
    };

    this.history.push(message);

    if (role === 'assistant') {
      this.recordQuestion(text);
    }

    return message;
  }

  recordQuestion(questionText: string) {
    if (questionText && questionText.trim()) {
      this.askedQuestions.push(questionText.trim());
    }
  }

  updateExtractedInfo(partial: Partial<ExtractedHealthInfo>) {
    for (const [key, val] of Object.entries(partial)) {
      if (val && typeof val === 'string' && val.trim() !== '' && val.toLowerCase() !== 'not provided' && val.toLowerCase() !== 'not specified') {
        const typedKey = key as keyof ExtractedHealthInfo;
        const trimmed = val.trim();

        // Prevent greetings or introductions from polluting symptom fields
        if ((typedKey === 'mainConcern' || typedKey === 'relatedSymptoms') && isGreetingOrName(trimmed)) {
          continue;
        }

        this.extractedInfo[typedKey] = trimmed;
      }
    }
    this.updateStage();
  }

  getMissingInformation(): string[] {
    const missing: string[] = [];
    if (!this.extractedInfo.name || this.extractedInfo.name === 'Not provided') {
      missing.push('Patient Name');
    }
    if (!this.extractedInfo.mainConcern || this.extractedInfo.mainConcern === 'Not provided' || isGreetingOrName(this.extractedInfo.mainConcern)) {
      missing.push('Main Health Concern / Symptom');
    }
    if (!this.extractedInfo.duration || this.extractedInfo.duration === 'Not provided' || this.extractedInfo.duration === 'Not specified') {
      missing.push('Duration of Symptoms');
    }
    if (!this.extractedInfo.severity || this.extractedInfo.severity === 'Not provided' || this.extractedInfo.severity === 'Not specified') {
      missing.push('Severity Level');
    }
    if (!this.extractedInfo.relatedSymptoms || this.extractedInfo.relatedSymptoms === 'Not provided' || this.extractedInfo.relatedSymptoms === 'None reported') {
      missing.push('Related / Associated Symptoms');
    }
    if (!this.extractedInfo.additionalInfo || this.extractedInfo.additionalInfo === 'Not provided') {
      missing.push('Medical History & Medications');
    }
    return missing;
  }

  getCollectedInformation(): Partial<ExtractedHealthInfo> {
    const collected: Partial<ExtractedHealthInfo> = {};
    for (const [key, val] of Object.entries(this.extractedInfo)) {
      if (val && val.trim() !== '' && val.toLowerCase() !== 'not provided' && val.toLowerCase() !== 'not specified') {
        if ((key === 'mainConcern' || key === 'relatedSymptoms') && isGreetingOrName(val)) {
          continue;
        }
        (collected as Record<string, string>)[key] = val;
      }
    }
    return collected;
  }

  private updateStage() {
    if (!this.extractedInfo.name) {
      this.currentStage = 'name';
    } else if (!this.extractedInfo.mainConcern || isGreetingOrName(this.extractedInfo.mainConcern)) {
      this.currentStage = 'main_concern';
    } else if (!this.extractedInfo.duration) {
      this.currentStage = 'duration';
    } else if (!this.extractedInfo.severity) {
      this.currentStage = 'severity';
    } else if (!this.extractedInfo.relatedSymptoms) {
      this.currentStage = 'related_symptoms';
    } else if (!this.extractedInfo.additionalInfo) {
      this.currentStage = 'history_and_comfort';
    } else {
      this.currentStage = 'wrap_up';
    }
  }

  getElapsedSeconds(): number {
    const end = this.endTime > 0 ? this.endTime : Date.now();
    return Math.max(0, Math.floor((end - this.startTime) / 1000));
  }

  markEnded() {
    this.endTime = Date.now();
    this.status = 'ended';
  }
}
