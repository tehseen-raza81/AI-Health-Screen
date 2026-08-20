export type CallStatus =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'ended'
  | 'error';

export interface Message {
  id: string;
  role: 'assistant' | 'user' | 'system';
  text: string;
  timestamp: string;
}

export interface ExtractedHealthInfo {
  name: string;
  mainConcern: string;
  duration: string;
  severity: string;
  relatedSymptoms: string;
  additionalInfo: string;
}

export interface StructuredHealthReport {
  generatedAt: string;
  sessionDuration: string;
  patient: string;
  mainConcern: string;
  keySymptoms: string;
  duration: string;
  severity: string;
  relatedSymptoms: string;
  importantInformation: string;
  followUpConsiderations: string;
  informationNotProvided: string[];
  clinicalSummary: string;
  disclaimer: string;
  transcript: Message[];
}

export type LanguageOption = 'en' | 'hi';
