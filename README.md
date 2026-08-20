# HealthAI: Real-Time Voice Health Screening Call App

A real-time, bi-directional voice health screening web application where patients conduct a natural spoken conversation with an AI health screening assistant. The assistant systematically and adaptively collects patient concerns, symptom details, duration, severity, and related factors before compiling a structured clinical intake report.

---

## 1. Overview

HealthAI simulates a preliminary clinical intake phone triage session. Patients can click **Start Call**, speak through their microphone in **English** or **Hindi / Hinglish**, receive real-time spoken voice responses from the AI, watch their clinical details update dynamically on screen, and end the call at any point to receive a structured, downloadable health report.

### Key Capabilities
- **Real Voice Calling**: Live microphone capture, real-time WebSocket audio streaming, automated transcription, conversational clinical reasoning, and spoken audio playback.
- **Adaptive Conversation**: No static or rigid scripts. HealthAI responds contextually to patient inquiries, suggests comforting home care (hydration, rest, steam), handles red flags, and gently collects missing details without repeating previously answered questions.
- **Bilingual Fluency**: Seamlessly supports English and Hindi/Hinglish dialogues with automatic language context detection.
- **Robust Session Tracking**: Live conversation state tracks asked questions, collected information, missing information, and current screening stages.
- **Structured Health Report**: Produces a clean clinical summary categorized into patient name, main complaint, key symptoms, duration, severity, related symptoms, important context, follow-up considerations, and uncollected information.
- **Graceful Failure & Short Call Handling**: Handles silent audio, background noise, rate limits, network timeouts, and premature call termination safely without crashing or hallucinating facts.

---

## 2. Tech Stack

| Component | Technology / Provider | Implementation |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 + TypeScript + Vite + Tailwind CSS** | Single-page voice application with live clinical state display, audio wave visualizers, and transcript feeds. |
| **Backend Framework** | **Node.js + Express + TypeScript** | Unified server running on port 3000 handling REST APIs and WebSocket connections. |
| **Real-Time Transport** | **WebSocket (`ws`)** | Full duplex bidirectional transport (`/ws`) for audio chunk transmission, live transcript updates, and status messages. |
| **STT (Speech-to-Text)** | **Google Gemini Multimodal Audio** (`@google/genai`) | High-accuracy audio transcription supporting multilingual nuances in English and Hindi. |
| **LLM (Clinical Reasoning)** | **Google Gemini Models** (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-3.7-flash`) | Structured JSON extraction, conversational triage reasoning, empathy, and adaptive stage progression. |
| **TTS (Text-to-Speech)** | **Google Gemini Audio Synthesis** & **Web Speech API** | Server-side Gemini TTS (`gemini-3.1-flash-tts-preview`) with seamless fallback to client-side browser speech synthesis. |
| **Audio Capture & Playback** | **Web Audio API / MediaRecorder** | HTML5 audio capture, blob/base64 encoding, and audio queue management. |

---

## 3. Architecture

```
                 [ User Microphone ]
                         │
                         ▼
             [ Frontend Audio Capture ]
              (MediaRecorder / Base64)
                         │
                         ▼
             [ Real-Time WebSocket ]
                  (Path: /ws)
                         │
                         ▼
             [ Node.js Backend Server ]
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
[ ISTTService ]  [ ConversationState ]  [ ITTSService ]
 (Gemini STT)     (History & Info)      (Gemini / WebTTS)
       │                 │                 │
       └────────► [ ILLMService ] ◄────────┘
                   (Gemini LLM)
                         │
                         ▼
              [ HealthReportService ]
                         │
                         ▼
            [ WebSocket Server Message ]
          (Audio buffer + State updates)
                         │
                         ▼
              [ Frontend Audio Player ]
                         │
                         ▼
                  [ User Speaker ]
```

### Turn-by-Turn Flow
1. **Call Start**: Patient clicks "Start Call". The backend creates a new `CallSession`, initializes `ConversationState`, generates an initial spoken greeting, and streams audio to the client.
2. **Patient Speech**: Patient speaks into the microphone. Audio is encoded and sent as an `audio_turn_complete` payload over WebSocket.
3. **Speech-to-Text**: `ISTTService` (`GeminiSTTService`) transcribes audio chunks into text.
4. **Adaptive Processing**: `ConversationOrchestrator` passes dialogue history, current clinical facts, and user speech to `ILLMService` (`GeminiLLMService`).
5. **Entity Extraction**: Extracted fields (name, symptoms, duration, severity, history) are updated in `ConversationState` and pushed to the UI.
6. **Voice Synthesis**: `ITTSService` (`GeminiTTSService`) converts the assistant's clinical response to audio.
7. **Playback**: The client plays the audio stream and automatically resumes listening.
8. **Call Conclusion**: Clicking "End Call" stops audio streams, cancels pending requests, invokes `HealthReportService`, and displays the final clinical report.

---

## 4. Setup & Installation

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))

### Installation Steps
```bash
# 1. Clone the repository
git clone <repository_url>
cd Call-Chat-AI

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
```

---

## 5. Environment Variables

Define the following in your `.env` file:

```env
# Google Gemini API Key (Server-side secret, never exposed to browser)
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

> **Security Note**: Never commit your actual API keys. The `.env` file is excluded from source control.

---

## 6. Running the Application

### Development Mode
```bash
npm run dev
```
Starts the Node.js backend server with hot module reload via Vite on `http://localhost:3000`.

### Production Build & Run
```bash
# Build the client and server bundle
npm run build

# Start the production server
npm start
```

---

## 7. Browser Requirements

- **Microphone Access**: The browser will request microphone permissions (`getUserMedia`) upon starting the call.
- **Supported Browsers**: Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge.
- **HTTPS / Localhost**: Microphone capture requires a secure context (HTTPS or `localhost`).

---

## 8. Architecture Decisions

1. **Dedicated Service Interfaces (`ISTTService`, `ILLMService`, `ITTSService`, `IHealthReportService`)**:
   Decouples business logic from external SDK implementations. Enables testing, provider switching, and independent error recovery without modifying the conversation orchestrator.

2. **WebSocket for Real-Time State & Audio Streaming**:
   Enables continuous, low-latency, bi-directional communication for audio chunks, live transcripts, and structured state updates in a single connection.

3. **Multi-Model Fallback Hierarchy**:
   Protects against rate limits (HTTP 429) by automatically cycling through high-capacity models (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-3.7-flash`) with dynamic heuristic clinical guidance as an emergency safeguard.

4. **Independent Playback Generation Guard**:
   Prevents overlapping audio streams and race conditions when users toggle microphone or end the call abruptly.

---

## 9. Known Limitations

- **Turn-Based Interaction**: The system utilizes reliable push-to-talk / turn-taking rather than full-duplex continuous barge-in.
- **Network Latency**: Response time depends on remote API roundtrip latency (typically 1.0–2.0s for combined STT+LLM+TTS).
- **Client Speech Recognition Availability**: Live browser transcript preview depends on browser Web Speech API support; fallback server transcription is always performed.

---

## 10. Medical Disclaimer

HealthAI is an automated clinical intake screening demonstration tool. It does **not** provide formal medical diagnoses, write prescriptions, or replace direct consultation with a qualified medical professional.