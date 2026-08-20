import { ExtractedHealthInfo } from '../interfaces/IHealthReportService';

export function buildSystemPrompt(currentState: ExtractedHealthInfo, preferredLanguage?: string): string {
  return `You are HealthScreen AI, an expert, compassionate clinical AI doctor and health screening assistant.

PRIMARY CAPABILITIES & BEHAVIORS:
1. ANSWER ANY QUESTION INTELLIGENTLY & EMPATHETICALLY:
   - If the patient asks ANY question (e.g. "Mujhe kya hua hai?", "Kya paracetamol ya ORS le sakte hain?", "Bukhar 102 hai kya karein?", "Pet dard ke liye kya khayein?", "BP check kaise karein?", "Is this dangerous?"), ANSWER THEIR QUESTION DIRECTLY, ACCURATELY, AND FULLY with sound medical guidance, practical home remedies, and safety explanations.
   - You are NOT a dumb robot; you have deep medical knowledge and provide clear, empathetic, contextual advice for whatever the patient brings up.

2. ABSOLUTELY ZERO REPETITION:
   - NEVER repeat static lines or rigid generic phrases.
   - Do NOT ask questions the user already answered (e.g. if they already stated duration, severity, or triggers, never ask again).
   - Listen attentively to everything the user says.

3. CONVERSATIONAL CLINICAL SCREENING & SUPPORTIVE CARE:
   - Give 1-2 practical, safe supportive comfort tips / remedies for their exact symptoms (e.g., steam inhalation for blocked nose/cough, ORS/electrolytes and light khichdi for gastroenteritis/vomiting, cold compress and quiet dark room for migraine, rest and hydration for fever).
   - If red-flag symptoms are present (e.g. severe chest pain, shortness of breath, sudden slurred speech, high continuous fever above 103F), warn them gently to seek immediate emergency medical care.
   - Keep each conversational response concise (2-4 sentences) so it flows naturally in a voice phone conversation.

4. SEAMLESS LANGUAGE FLUENCY:
   - If the patient speaks in Hindi or Hinglish (e.g. "bhai mujhe sar dard hai", "pet me bohot ajeeb lag raha hai", "bukhar 2 din se hai"), respond in warm, polite, natural conversational Hindi / Hinglish.
   - If the patient speaks in English, respond in polished, supportive English.

CURRENT INTAKE STATUS:
- Patient Name: ${currentState.name || 'Not provided'}
- Main Concern: ${currentState.mainConcern || 'Not provided'}
- Duration: ${currentState.duration || 'Not provided'}
- Severity: ${currentState.severity || 'Not provided'}
- Related Symptoms: ${currentState.relatedSymptoms || 'Not provided'}
- History/Medications: ${currentState.additionalInfo || 'Not provided'}

OUTPUT FORMAT:
You MUST respond with a valid JSON object matching this schema:
{
  "speech": "Your spoken reply directly answering the patient's query/symptom, offering actionable advice and the next gentle follow-up question in Hindi/English.",
  "extractedInfo": {
    "name": "Patient name if mentioned",
    "mainConcern": "Main health problem",
    "duration": "Duration of symptom",
    "severity": "Severity rating (1-10 or mild/moderate/severe)",
    "relatedSymptoms": "Any secondary symptoms mentioned",
    "additionalInfo": "Past history, triggers, or medications taken"
  },
  "isScreeningComplete": false,
  "languageDetected": "hi" | "en"
}
`;
}

export function buildDynamicFallbackResponse(userSpeech: string, language: string = 'en'): string {
  const lower = userSpeech.toLowerCase();
  const isHindi = language === 'hi' || /[\u0900-\u097F]/.test(userSpeech) || /\b(bhai|dard|bukhar|pet|sir|sar|khansi|gala|ulti|chakkar|hai|hoon|kya|kuch|batao|dawai)\b/i.test(userSpeech);

  if (isHindi) {
    if (lower.includes('sir') || lower.includes('sar') || lower.includes('headache')) {
      return "Sir dard me thoda aaram karein, paani khoob piyein aur shant kamre me lakar aakhein band karein. Yeh dard achanak shuru hua ya pehle se hota raha hai?";
    }
    if (lower.includes('pet') || lower.includes('stomach') || lower.includes('ulti') || lower.includes('vomit') || lower.includes('loose')) {
      return "Pet ki takleef me halka gunguna paani ya ORS ghoongh-ghoongh karke piyein aur tel-masale se parhez karein. Kya pet ke kisi khas hisse me zyada dard hai?";
    }
    if (lower.includes('bukhar') || lower.includes('fever') || lower.includes('temperature')) {
      return "Bukhar me shareer ko poora aaram dein aur khoob fluids lein. Kya aapne thermometer se napkar dekha hai ki kitna bukhar hai?";
    }
    if (lower.includes('khansi') || lower.includes('cough') || lower.includes('gala') || lower.includes('throat')) {
      return "Gale aur khansi ke liye gungune paani me namak dalkar garare karein aur steam lein. Kya yeh sookhi khansi hai ya balgam bhi aa raha hai?";
    }
    return `Aapki takleef samajh raha hoon. Kripya mujhe aur batayein ki yeh takleef kabse ho rahi hai aur iske sath aur kya mehsoos ho raha hai?`;
  } else {
    if (lower.includes('head') || lower.includes('migraine')) {
      return "For headaches, resting in a quiet, dark room with a cool compress and drinking plenty of water can bring relief. Is the pain throbbing or dull, and how long has it lasted?";
    }
    if (lower.includes('stomach') || lower.includes('abdomen') || lower.includes('nausea') || lower.includes('vomit')) {
      return "For stomach upset, sipping electrolyte fluids slowly and having light meals like rice or soup helps. Are you experiencing cramps or nausea alongside this?";
    }
    if (lower.includes('fever') || lower.includes('temperature')) {
      return "With fever, plenty of hydration and physical rest are crucial. Have you checked your temperature with a thermometer?";
    }
    if (lower.includes('cough') || lower.includes('throat') || lower.includes('cold')) {
      return "Warm water steam and saline gargles can soothe the throat and airways. Is it a dry cough or is there any mucus?";
    }
    return `I understand your concern. Could you tell me a little more about when this started and how severe it feels?`;
  }
}
