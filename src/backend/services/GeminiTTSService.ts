import { GoogleGenAI, Modality } from '@google/genai';
import { ITTSService, TTSResponse } from '../interfaces/ITTSService';
import { logger } from '../config/logger';
import { ENV } from '../config/env';

export class GeminiTTSService implements ITTSService {
  private static quotaExhaustedUntil: number = 0;

  private getAi(): GoogleGenAI {
    const apiKey = ENV.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'healthai-voice-screening',
        },
      },
    });
  }

  async generateSpeech(text: string, _languageHint?: string): Promise<TTSResponse> {
    if (!text || !text.trim()) {
      throw new Error('Cannot synthesize empty speech');
    }

    const apiKey = ENV.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.length < 5) {
      throw new Error('GEMINI_API_KEY not found');
    }

    // If quota was recently exhausted, skip server call to avoid rate limit spam and let browser TTS speak instantly
    if (Date.now() < GeminiTTSService.quotaExhaustedUntil) {
      throw new Error('Server TTS quota resting, browser synthesis active');
    }

    const cleanText = text.replace(/[\n\r]+/g, ' ').trim();
    logger.info(`[Gemini TTS] Generating audio for: "${cleanText.substring(0, 50)}..."`);

    try {
      const ai = this.getAi();
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: cleanText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      const mimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/wav';

      if (base64Audio) {
        const buffer = Buffer.from(base64Audio, 'base64');
        logger.info(`[Gemini TTS] Generated ${buffer.length} bytes audio`);
        return {
          audioBuffer: buffer,
          mimeType,
        };
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
        // Cool down for 60 seconds before trying server TTS again
        GeminiTTSService.quotaExhaustedUntil = Date.now() + 60000;
        logger.warn(`[Gemini TTS] Free tier quota reached. Seamlessly using client browser synthesis.`);
      } else {
        logger.warn(`[Gemini TTS] Server TTS unavailable (${msg}). Client browser synthesis will play.`);
      }
    }

    throw new Error('Server TTS unavailable');
  }
}
