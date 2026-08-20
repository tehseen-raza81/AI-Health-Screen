export interface STTResponse {
  text: string;
  language?: string;
  duration?: number;
}

export interface ISTTService {
  transcribeAudio(audioBuffer: Buffer, mimeType?: string, languageHint?: string): Promise<STTResponse>;
}
