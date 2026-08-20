export interface TTSResponse {
  audioBuffer: Buffer;
  mimeType: string;
  durationMs?: number;
}

export interface ITTSService {
  generateSpeech(text: string, languageHint?: string): Promise<TTSResponse>;
}
