import { GoogleGenAI, Type } from '@google/genai';
import { ExtractedHealthInfo, Message, StructuredHealthReport } from '../interfaces/IHealthReportService';
import { LLMResponse } from '../interfaces/ILLMService';
import { STTResponse } from '../interfaces/ISTTService';
import { buildSystemPrompt, buildDynamicFallbackResponse } from '../conversation/promptBuilder';
import { logger } from '../config/logger';
import { ENV } from '../config/env';

function isGreetingOrNamePhrase(str: string): boolean {
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

function sanitizeExtractedField(field: string | undefined, isSymptomField: boolean = false): string | undefined {
  if (!field) return undefined;
  const trimmed = field.trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'not provided' || trimmed.toLowerCase() === 'not specified') {
    return undefined;
  }
  if (isSymptomField && isGreetingOrNamePhrase(trimmed)) {
    return undefined;
  }
  return trimmed;
}

export class GeminiAIService {
  private prioritizedModels = [
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.1-pro-preview',
  ];

  private getAi(): GoogleGenAI {
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY ||
      ENV.GEMINI_API_KEY ||
      '';
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
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

  isAvailable(): boolean {
    const key =
      process.env.GEMINI_API_KEY ||
      process.env.API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY ||
      ENV.GEMINI_API_KEY;
    return Boolean(key && key.length > 5 && !key.includes('your_gemini_api_key'));
  }

  private async generateWithFallback(params: {
    systemInstruction?: string;
    contents: any;
    temperature?: number;
    responseMimeType?: string;
    responseSchema?: any;
  }): Promise<string> {
    const ai = this.getAi();
    let lastError: any = null;

    for (const model of this.prioritizedModels) {
      try {
        logger.info(`[GeminiAIService] Invoking Gemini model: ${model}`);
        const config: any = {};
        if (params.systemInstruction) {
          config.systemInstruction = params.systemInstruction;
        }
        if (typeof params.temperature === 'number') {
          config.temperature = params.temperature;
        }
        if (params.responseMimeType) {
          config.responseMimeType = params.responseMimeType;
        }
        if (params.responseSchema) {
          config.responseSchema = params.responseSchema;
        }

        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: Object.keys(config).length > 0 ? config : undefined,
        });

        if (response && response.text && response.text.trim()) {
          logger.info(`[GeminiAIService] Successfully received response from ${model}`);
          return response.text.trim();
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');
        if (isQuota) {
          logger.warn(`[GeminiAIService] Model ${model} quota reached, switching immediately to next model...`);
        } else {
          logger.warn(`[GeminiAIService] Model ${model} returned error: ${errMsg}. Trying next model...`);
        }
      }
    }

    throw lastError || new Error('All Gemini models exhausted');
  }

  async transcribeAudio(
    audioBuffer: Buffer,
    mimeType: string = 'audio/webm',
    languageHint?: string
  ): Promise<STTResponse> {
    try {
      logger.info(`[Gemini STT] Transcribing audio with Google Gemini (${audioBuffer.length} bytes, ${mimeType})...`);

      const cleanMime = (mimeType || 'audio/webm').split(';')[0].trim();
      const base64Audio = audioBuffer.toString('base64');

      let instruction =
        'You are an expert clinical transcription system. Listen to the patient audio carefully and return ONLY the exact words spoken in Hindi, Hinglish, or English. Do not add explanations, conversational answers, or punctuation marks.';
      if (languageHint === 'hi') {
        instruction += ' The speaker is speaking Hindi or Hinglish. Transcribe accurately in Roman script or Devanagari.';
      }

      const audioPart = {
        inlineData: {
          mimeType: cleanMime,
          data: base64Audio,
        },
      };
      const textPart = {
        text: 'Transcribe this patient audio recording verbatim. Output only what the user said in Hindi, Hinglish, or English.',
      };

      const raw = await this.generateWithFallback({
        systemInstruction: instruction,
        contents: [audioPart, textPart],
        temperature: 0.1,
      });

      const cleanText = raw.replace(/^["']|["']$/g, '').trim();
      logger.info(`[Gemini STT] Transcription result: "${cleanText}"`);

      const isHindi =
        /[\u0900-\u097F]/.test(cleanText) ||
        /\b(bhai|mujhe|dard|bukhar|hai|hoon|kya|aaj|tabiyat|sir|sar|pet|khansi|gala|ulti|chakkar|dawai|kuch|batao|naam|takleef)\b/i.test(
          cleanText
        );

      return {
        text: cleanText,
        language: isHindi ? 'hi' : 'en',
      };
    } catch (err) {
      logger.error('[Gemini STT] Gemini audio transcription error:', err);
      throw err;
    }
  }

  async generateResponse(
    history: Message[],
    currentState: ExtractedHealthInfo,
    userSpeech: string,
    preferredLanguage?: string
  ): Promise<LLMResponse> {
    const isUserHindi =
      preferredLanguage === 'hi' ||
      /[\u0900-\u097F]/.test(userSpeech) ||
      /\b(bhai|mujhe|dard|bukhar|hai|hoon|kya|aaj|tabiyat|sir|sar|pet|khansi|gala|ulti|chakkar|dawai|kuch|batao|naam|takleef)\b/i.test(
        userSpeech
      );

    try {
      const systemPrompt = buildSystemPrompt(currentState, isUserHindi ? 'hi' : 'en');

      const historyFormatted = history
        .filter((m) => m.text && m.text.trim())
        .map((m) => `${m.role === 'assistant' ? 'AI Doctor' : 'Patient'}: ${m.text}`)
        .join('\n');

      const userPrompt = `PATIENT INTAKE RECORD SO FAR:
- Name: ${currentState.name || 'Not provided yet'}
- Main Complaint: ${currentState.mainConcern || 'Not provided yet'}
- Duration: ${currentState.duration || 'Not provided yet'}
- Severity: ${currentState.severity || 'Not provided yet'}
- Associated Symptoms: ${currentState.relatedSymptoms || 'Not provided yet'}
- History/Medications: ${currentState.additionalInfo || 'Not provided yet'}

CONVERSATION TRANSCRIPT:
${historyFormatted || '(Call started)'}

LATEST PATIENT STATEMENT / QUESTION:
"${userSpeech}"

CRITICAL INSTRUCTIONS:
1. Speak directly in ${isUserHindi ? 'warm, empathetic Hindi / Hinglish' : 'compassionate, clear English'}.
2. DIRECTLY answer whatever the patient said or asked (e.g. explain what causes their symptom, suggest comfort measures like hydration/steam/rest/diet, warn about red flags, answer questions).
3. Do NOT repeat previous questions if already answered.
4. Keep the spoken response natural, warm, and concise (2-4 sentences).
5. In extractedInfo: ONLY extract 'name' if the user stated their name. ONLY extract 'mainConcern' if the user stated an actual medical symptom/complaint. NEVER put the user's name or greeting into 'mainConcern'.`;

      logger.info(`[Gemini LLM] Generating doctor response with Gemini AI...`);

      const raw = await this.generateWithFallback({
        systemInstruction: systemPrompt,
        contents: userPrompt,
        temperature: 0.6,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            speech: {
              type: Type.STRING,
              description: 'The spoken response to the patient answering their question with medical empathy and comfort advice',
            },
            extractedInfo: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                mainConcern: { type: Type.STRING },
                duration: { type: Type.STRING },
                severity: { type: Type.STRING },
                relatedSymptoms: { type: Type.STRING },
                additionalInfo: { type: Type.STRING },
              },
            },
            isScreeningComplete: { type: Type.BOOLEAN },
            languageDetected: { type: Type.STRING },
          },
          required: ['speech'],
        },
      });

      let parsed: {
        speech?: string;
        extractedInfo?: Partial<ExtractedHealthInfo>;
        isScreeningComplete?: boolean;
        languageDetected?: string;
      } = {};

      try {
        parsed = JSON.parse(raw);
      } catch {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch {
            parsed = { speech: raw };
          }
        } else {
          parsed = { speech: raw };
        }
      }

      let speechText = (parsed.speech || '').trim();
      if (!speechText) {
        speechText = isUserHindi
          ? `Aapki baat samajh raha hoon. Kripya mujhe thoda aur batayein ki aapko kya takleef ya lakshan mehsoos ho rahe hain?`
          : `I hear you clearly. Could you tell me a little more about any symptoms or concerns you are experiencing?`;
      }

      const cleanedExtracted: Partial<ExtractedHealthInfo> = {};
      if (parsed.extractedInfo) {
        const name = sanitizeExtractedField(parsed.extractedInfo.name);
        const mainConcern = sanitizeExtractedField(parsed.extractedInfo.mainConcern, true);
        const duration = sanitizeExtractedField(parsed.extractedInfo.duration);
        const severity = sanitizeExtractedField(parsed.extractedInfo.severity);
        const relatedSymptoms = sanitizeExtractedField(parsed.extractedInfo.relatedSymptoms, true);
        const additionalInfo = sanitizeExtractedField(parsed.extractedInfo.additionalInfo);

        if (name) cleanedExtracted.name = name;
        if (mainConcern) cleanedExtracted.mainConcern = mainConcern;
        if (duration) cleanedExtracted.duration = duration;
        if (severity) cleanedExtracted.severity = severity;
        if (relatedSymptoms) cleanedExtracted.relatedSymptoms = relatedSymptoms;
        if (additionalInfo) cleanedExtracted.additionalInfo = additionalInfo;
      }

      return {
        assistantResponse: speechText,
        extractedInfo: cleanedExtracted,
        isScreeningComplete: Boolean(parsed.isScreeningComplete),
        languageDetected: parsed.languageDetected || (isUserHindi ? 'hi' : 'en'),
      };
    } catch (err: any) {
      logger.error('[Gemini LLM] generateResponse fallback triggered:', err?.message || err);

      const extractedFallback = this.heuristicExtract(userSpeech, currentState);
      const dynamicAdvice = buildDynamicFallbackResponse(userSpeech, isUserHindi ? 'hi' : 'en');

      return {
        assistantResponse: dynamicAdvice,
        extractedInfo: extractedFallback,
        isScreeningComplete: false,
        languageDetected: isUserHindi ? 'hi' : 'en',
      };
    }
  }

  private heuristicExtract(text: string, current: ExtractedHealthInfo): Partial<ExtractedHealthInfo> {
    const extracted: Partial<ExtractedHealthInfo> = {};
    const lower = text.toLowerCase();

    // 1. Name extraction: Matches "my name is Sachin Raza", "mera naam Sachin Raza hai", "I am Sachin Raza"
    const nameMatch = text.match(/(?:my name is|mera naam|name is|i am|naam)\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)/i);
    if (nameMatch && nameMatch[1] && (!current.name || current.name === 'Not provided')) {
      const extractedName = nameMatch[1].trim();
      if (!/^(doctor|patient|fine|good|sick|theek|bhai|hello|hi)\b/i.test(extractedName)) {
        extracted.name = extractedName;
      }
    }

    // 2. Main concern extraction (ONLY when actual medical symptoms are present)
    const hasExistingConcern = current.mainConcern && current.mainConcern !== 'Not provided' && !isGreetingOrNamePhrase(current.mainConcern);
    if (!hasExistingConcern) {
      if (lower.includes('sir') || lower.includes('sar') || lower.includes('headache') || lower.includes('migraine')) {
        extracted.mainConcern = 'Headache / Sir Dard';
      } else if (lower.includes('bukhar') || lower.includes('fever') || lower.includes('temperature') || lower.includes('tapmaan')) {
        extracted.mainConcern = 'Fever / Bukhar';
      } else if (lower.includes('pet') || lower.includes('stomach') || lower.includes('cramp') || lower.includes('abdomen') || lower.includes('belly')) {
        extracted.mainConcern = 'Stomach Pain / Pet Dard';
      } else if (lower.includes('khansi') || lower.includes('cough') || lower.includes('gala') || lower.includes('throat')) {
        extracted.mainConcern = 'Cough / Sore Throat';
      } else if (lower.includes('vomit') || lower.includes('ulti') || lower.includes('nausea') || lower.includes('jee ghabrana')) {
        extracted.mainConcern = 'Nausea & Vomiting';
      } else if (lower.includes('chest pain') || lower.includes('chaati') || lower.includes('seene')) {
        extracted.mainConcern = 'Chest Discomfort / Pain';
      } else if (lower.includes('dast') || lower.includes('diarrhea') || lower.includes('loose motion')) {
        extracted.mainConcern = 'Diarrhea / Loose Motion';
      } else if (lower.includes('body pain') || lower.includes('badan dard') || lower.includes('thakan') || lower.includes('weakness') || lower.includes('kamzori')) {
        extracted.mainConcern = 'Body Ache / Weakness';
      }
    }

    // 3. Duration extraction
    const durationMatch = text.match(/(\d+\s*(?:din|days?|hours?|ghante|weeks?|hafte|mahine|months?))/i);
    if (durationMatch) {
      extracted.duration = durationMatch[1];
    } else if (lower.includes('aaj') || lower.includes('today') || lower.includes('subah') || lower.includes('morning')) {
      extracted.duration = 'Since today morning';
    } else if (lower.includes('kal') || lower.includes('yesterday')) {
      extracted.duration = 'Since yesterday';
    }

    // 4. Severity extraction
    const severityMatch = text.match(/(\b\d{1,2}\b\s*(?:\/|\s*out of\s*)?10|\b(?:mild|moderate|severe|zyada|bohot zyada|thoda|halka|unbearable)\b)/i);
    if (severityMatch) {
      extracted.severity = severityMatch[1];
    }

    // 5. Related symptoms extraction
    const related: string[] = [];
    if (lower.includes('ulti') || lower.includes('vomit')) related.push('Vomiting');
    if (lower.includes('chakkar') || lower.includes('dizzy')) related.push('Dizziness');
    if (lower.includes('kamzori') || lower.includes('weakness')) related.push('Weakness');
    if (lower.includes('thand') || lower.includes('chills')) related.push('Chills');
    if (lower.includes('loose') || lower.includes('dast')) related.push('Loose motion');
    if (related.length > 0) {
      extracted.relatedSymptoms = related.join(', ');
    }

    return extracted;
  }

  async generateReport(
    history: Message[],
    extractedInfo: ExtractedHealthInfo,
    sessionDurationSeconds: number
  ): Promise<StructuredHealthReport> {
    const mins = Math.floor(sessionDurationSeconds / 60);
    const secs = sessionDurationSeconds % 60;
    const formattedDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const now = new Date();
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    const generatedAt = now.toLocaleString('en-US', dateOptions).replace(',', ' •');

    const validPatientName = sanitizeExtractedField(extractedInfo.name);
    const validMainConcern = sanitizeExtractedField(extractedInfo.mainConcern, true);
    const validDuration = sanitizeExtractedField(extractedInfo.duration);
    const validSeverity = sanitizeExtractedField(extractedInfo.severity);
    const validRelated = sanitizeExtractedField(extractedInfo.relatedSymptoms, true);
    const validInfo = sanitizeExtractedField(extractedInfo.additionalInfo);

    const safeExtracted: ExtractedHealthInfo = {
      name: validPatientName || '',
      mainConcern: validMainConcern || '',
      duration: validDuration || '',
      severity: validSeverity || '',
      relatedSymptoms: validRelated || '',
      additionalInfo: validInfo || '',
    };

    if (!history || history.length <= 1) {
      return {
        generatedAt,
        sessionDuration: formattedDuration,
        patient: safeExtracted.name || 'Not provided',
        mainConcern: safeExtracted.mainConcern || 'Not provided',
        keySymptoms: safeExtracted.mainConcern || 'None reported during brief session',
        duration: safeExtracted.duration || 'Not specified',
        severity: safeExtracted.severity || 'Not specified',
        relatedSymptoms: safeExtracted.relatedSymptoms || 'None reported',
        importantInformation: 'The call concluded before medical intake questions could be completed.',
        followUpConsiderations: 'Recommend consulting a qualified healthcare professional directly.',
        informationNotProvided: this.calculateMissingInfo(safeExtracted),
        clinicalSummary: safeExtracted.name
          ? `Patient introduced themselves as ${safeExtracted.name}, but the screening was ended before symptoms were discussed.`
          : 'Brief screening recorded. No medical symptoms were discussed before call concluded.',
        disclaimer: 'This is a basic health screening report, not a medical diagnosis. Please consult a qualified healthcare professional.',
        transcript: history || [],
      };
    }

    try {
      const transcriptText = history
        .map((m) => `${m.role === 'assistant' ? 'AI Doctor' : 'Patient'}: ${m.text}`)
        .join('\n');

      const prompt = `You are a clinical documentation specialist.
Analyze this health screening session and generate a structured clinical summary.

TRANSCRIPT:
${transcriptText}

EXTRACTED DATA:
${JSON.stringify(safeExtracted, null, 2)}

DURATION: ${formattedDuration}

CRITICAL RULES:
1. NEVER copy the patient's name or greeting ("hello", "my name is Sachin Raza", etc.) into "mainConcern" or "keySymptoms".
2. If the patient only stated their name and did NOT mention any health complaints, set mainConcern: "Not provided", keySymptoms: "None reported", duration: "Not specified", severity: "Not specified", and explain in clinicalSummary that the call ended before symptoms were provided.
3. If symptoms were provided, summarize them clearly and accurately.
4. Never fabricate missing data. If duration or severity was not stated, use "Not specified".`;

      const raw = await this.generateWithFallback({
        systemInstruction:
          'You generate professional clinical screening reports from patient intake conversations in strictly valid JSON format without duplicating names or greetings into symptom fields.',
        contents: prompt,
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patient: { type: Type.STRING },
            mainConcern: { type: Type.STRING },
            keySymptoms: { type: Type.STRING },
            duration: { type: Type.STRING },
            severity: { type: Type.STRING },
            relatedSymptoms: { type: Type.STRING },
            importantInformation: { type: Type.STRING },
            followUpConsiderations: { type: Type.STRING },
            informationNotProvided: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            clinicalSummary: { type: Type.STRING },
          },
          required: [
            'patient',
            'mainConcern',
            'keySymptoms',
            'duration',
            'severity',
            'relatedSymptoms',
            'importantInformation',
            'followUpConsiderations',
            'informationNotProvided',
            'clinicalSummary',
          ],
        },
      });

      const parsed = JSON.parse(raw);

      const parsedPatient = sanitizeExtractedField(parsed.patient) || safeExtracted.name || 'Not provided';
      const parsedConcern = sanitizeExtractedField(parsed.mainConcern, true) || safeExtracted.mainConcern || 'Not provided';
      const parsedSymptoms = sanitizeExtractedField(parsed.keySymptoms, true) || (parsedConcern !== 'Not provided' ? parsedConcern : 'None reported');
      const parsedDuration = sanitizeExtractedField(parsed.duration) || safeExtracted.duration || 'Not specified';
      const parsedSeverity = sanitizeExtractedField(parsed.severity) || safeExtracted.severity || 'Not specified';
      const parsedRelated = sanitizeExtractedField(parsed.relatedSymptoms, true) || safeExtracted.relatedSymptoms || 'None reported';

      return {
        generatedAt,
        sessionDuration: formattedDuration,
        patient: parsedPatient,
        mainConcern: parsedConcern,
        keySymptoms: parsedSymptoms,
        duration: parsedDuration,
        severity: parsedSeverity,
        relatedSymptoms: parsedRelated,
        importantInformation: parsed.importantInformation || safeExtracted.additionalInfo || 'No additional medical history or medications reported.',
        followUpConsiderations: parsed.followUpConsiderations || 'Consult a healthcare professional if symptoms develop or persist.',
        informationNotProvided:
          Array.isArray(parsed.informationNotProvided) && parsed.informationNotProvided.length > 0
            ? parsed.informationNotProvided
            : this.calculateMissingInfo({
                name: parsedPatient,
                mainConcern: parsedConcern,
                duration: parsedDuration,
                severity: parsedSeverity,
                relatedSymptoms: parsedRelated,
                additionalInfo: safeExtracted.additionalInfo,
              }),
        clinicalSummary: parsed.clinicalSummary || 'Intake screening completed.',
        disclaimer: 'This is a basic health screening tool, not a medical diagnosis. Please consult a healthcare professional for medical advice.',
        transcript: history,
      };
    } catch (err) {
      logger.warn('[Gemini Report] Falling back to structured local clinical report generator:', err);

      const patientName = safeExtracted.name || 'Not provided';
      const mainConcern = safeExtracted.mainConcern || 'Not provided';
      const hasSymptoms = mainConcern !== 'Not provided' && mainConcern !== '';
      const keySymptoms = hasSymptoms
        ? [mainConcern, safeExtracted.relatedSymptoms].filter(s => s && s !== 'None reported' && s !== 'Not provided').join(', ')
        : 'None reported';

      return {
        generatedAt,
        sessionDuration: formattedDuration,
        patient: patientName,
        mainConcern: mainConcern,
        keySymptoms: keySymptoms,
        duration: safeExtracted.duration || 'Not specified',
        severity: safeExtracted.severity || 'Not specified',
        relatedSymptoms: safeExtracted.relatedSymptoms || 'None reported',
        importantInformation: safeExtracted.additionalInfo || 'Preliminary voice screening recorded.',
        followUpConsiderations: hasSymptoms
          ? 'Monitor symptoms and consult a licensed physician or clinic if symptoms persist or worsen.'
          : 'Consult a qualified physician if any concerning symptoms arise.',
        informationNotProvided: this.calculateMissingInfo(safeExtracted),
        clinicalSummary: hasSymptoms
          ? `Patient completed voice intake screening. Primary complaint reported: ${mainConcern}. Recommended supportive comfort measures and direct physician consultation.`
          : patientName !== 'Not provided'
          ? `Patient introduced themselves as ${patientName}. The call was concluded before health complaints or symptoms were discussed.`
          : 'Brief intake session concluded before medical symptoms were discussed.',
        disclaimer: 'This is a basic health screening tool, not a medical diagnosis. Please consult a healthcare professional for medical advice.',
        transcript: history,
      };
    }
  }

  private calculateMissingInfo(extracted: ExtractedHealthInfo): string[] {
    const missing: string[] = [];
    if (!extracted.name || extracted.name === 'Not provided' || extracted.name === '') missing.push('Patient Name');
    if (!extracted.mainConcern || extracted.mainConcern === 'Not provided' || extracted.mainConcern === '' || isGreetingOrNamePhrase(extracted.mainConcern)) missing.push('Main Health Concern / Symptom');
    if (!extracted.duration || extracted.duration === 'Not specified' || extracted.duration === 'Not provided' || extracted.duration === '') missing.push('Duration of Symptoms');
    if (!extracted.severity || extracted.severity === 'Not specified' || extracted.severity === 'Not provided' || extracted.severity === '') missing.push('Severity Rating');
    if (!extracted.relatedSymptoms || extracted.relatedSymptoms === 'None reported' || extracted.relatedSymptoms === 'Not provided' || extracted.relatedSymptoms === '') missing.push('Related / Associated Symptoms');
    if (!extracted.additionalInfo || extracted.additionalInfo === 'Not provided' || extracted.additionalInfo === '') missing.push('Medical History & Medications');
    return missing.length > 0 ? missing : ['None — complete intake recorded'];
  }
}
