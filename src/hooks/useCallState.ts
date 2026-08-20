import { useState, useEffect, useRef, useCallback } from 'react';
import { CallStatus, ExtractedHealthInfo, Message, StructuredHealthReport, LanguageOption } from '../types';
import { WebSocketClient } from '../services/WebSocketClient';
import { audioService } from '../services/AudioService';

export function useCallState() {
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'active_call' | 'health_report'>('landing');
  const [status, setStatus] = useState<CallStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [history, setHistory] = useState<Message[]>([]);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedHealthInfo>({
    name: 'Not provided',
    mainConcern: 'Not provided',
    duration: 'Not provided',
    severity: 'Not provided',
    relatedSymptoms: 'Not provided',
    additionalInfo: 'Not provided',
  });
  const [report, setReport] = useState<StructuredHealthReport | null>(null);
  const [language, setLanguage] = useState<LanguageOption>('en');
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMicAvailable, setIsMicAvailable] = useState<boolean>(true);

  const wsClientRef = useRef<WebSocketClient | null>(null);
  const timerRef = useRef<number | null>(null);
  const speakingWatchdogRef = useRef<number | null>(null);
  const speechRecognitionActiveRef = useRef<boolean>(false);
  const liveTranscriptRef = useRef<string>('');
  const isCallActiveRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<number | null>(null);

  // Timer for session duration
  useEffect(() => {
    if (currentScreen === 'active_call' && isCallActiveRef.current && status !== 'ended' && status !== 'idle') {
      timerRef.current = window.setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentScreen, status]);

  const formatSessionTime = useCallback((totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  const clearSpeakingWatchdog = () => {
    if (speakingWatchdogRef.current) {
      clearTimeout(speakingWatchdogRef.current);
      speakingWatchdogRef.current = null;
    }
  };

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const stopListeningAndSend = useCallback(async () => {
    clearSilenceTimer();
    if (!isRecording && !liveTranscriptRef.current) return;
    setIsRecording(false);
    audioService.stopSpeechRecognition();
    const liveText = liveTranscriptRef.current.trim();

    if (!isCallActiveRef.current) {
      audioService.cleanup();
      return;
    }

    setStatus('processing');
    setStatusMessage('Gemini AI is analyzing your response...');

    try {
      const { base64, mimeType } = await audioService.stopRecording();
      setLiveTranscript('');
      liveTranscriptRef.current = '';
      if (!isCallActiveRef.current) return;

      if (wsClientRef.current) {
        if (liveText && liveText.length > 0) {
          wsClientRef.current.sendUserText(liveText);
        } else if (base64 && base64.length > 20) {
          wsClientRef.current.sendAudioTurn(base64, mimeType);
        } else {
          setStatus('listening');
          setStatusMessage('No audio captured. Please speak or type.');
        }
      }
    } catch (err) {
      console.warn('Error finalizing audio turn:', err);
      setLiveTranscript('');
      liveTranscriptRef.current = '';
      if (!isCallActiveRef.current) return;
      if (liveText && wsClientRef.current) {
        wsClientRef.current.sendUserText(liveText);
      } else {
        setStatus('listening');
        setStatusMessage('Tap microphone to speak again or type below.');
      }
    }
  }, [isRecording]);

  const startListening = useCallback(async () => {
    if (!isCallActiveRef.current) return;
    clearSpeakingWatchdog();
    clearSilenceTimer();
    try {
      setIsRecording(true);
      setLiveTranscript('');
      setStatus('listening');
      setStatusMessage('Speak now or type below');
      liveTranscriptRef.current = '';

      // Start browser speech recognition
      audioService.startSpeechRecognition(
        (transcript, isFinal) => {
          if (!isCallActiveRef.current) return;
          liveTranscriptRef.current = transcript;
          setLiveTranscript(transcript);

          // Auto-send on silence detection after user spoke
          clearSilenceTimer();
          if (transcript.trim().length > 2) {
            silenceTimerRef.current = window.setTimeout(() => {
              if (isCallActiveRef.current && liveTranscriptRef.current.trim().length > 2) {
                console.log('Silence detected after speech, auto-submitting turn...');
                stopListeningAndSend();
              }
            }, isFinal ? 1200 : 2200);
          }
        },
        () => {
          speechRecognitionActiveRef.current = false;
        },
        language
      );
      speechRecognitionActiveRef.current = true;

      // Start raw audio recording
      await audioService.startRecording(undefined, (volume) => {
        if (volume > 20 && liveTranscriptRef.current.length > 2) {
          clearSilenceTimer();
        }
      });
    } catch (err) {
      console.warn('Microphone start error:', err);
      setIsRecording(false);
      setLiveTranscript('');
      setIsMicAvailable(false);
      if (isCallActiveRef.current) {
        setStatus('listening');
        setStatusMessage('Type your message below');
      }
    }
  }, [language, stopListeningAndSend]);

  const handleAssistantSpeaking = useCallback(
    (assistantText: string, audioBase64?: string, mimeType: string = 'audio/mpeg') => {
      if (!isCallActiveRef.current) {
        audioService.cleanup();
        return;
      }

      clearSpeakingWatchdog();
      clearSilenceTimer();
      setStatus('speaking');
      setStatusMessage('AI Speaking...');

      const onSpeakingFinished = () => {
        if (!isCallActiveRef.current) {
          audioService.cleanup();
          return;
        }
        clearSpeakingWatchdog();
        setStatus('listening');
        setStatusMessage('Speak now or type below');
        startListening();
      };

      // Play audio or speak with browser TTS
      audioService.playAudioOrSpeak(audioBase64, mimeType, assistantText, language, onSpeakingFinished);

      // Safety watchdog: ensure UI never stays stuck on 'speaking'
      const maxSpeakingTimeMs = Math.max(4000, (assistantText.length / 10) * 1000 + 3000);
      speakingWatchdogRef.current = window.setTimeout(() => {
        if (isCallActiveRef.current) {
          console.log('Speaking watchdog triggered, transitioning to listening');
          onSpeakingFinished();
        }
      }, maxSpeakingTimeMs);
    },
    [language, startListening]
  );

  const sendTextMessage = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || !isCallActiveRef.current) return;
      clearSilenceTimer();
      audioService.stopPlayback();
      audioService.stopSpeechRecognition();
      setIsRecording(false);
      setStatus('processing');
      setStatusMessage('Gemini AI is analyzing your response...');

      // Try WebSocket first
      if (wsClientRef.current) {
        try {
          wsClientRef.current.sendUserText(clean);
          return;
        } catch (e) {
          console.warn('WS send failed, falling back to HTTP /api/chat:', e);
        }
      }

      // HTTP fallback
      try {
        const userMsg: Message = {
          id: `msg-${Date.now()}-user`,
          role: 'user',
          text: clean,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        const updatedHistory = [...history, userMsg];
        setHistory(updatedHistory);

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: clean,
            history: updatedHistory,
            extractedInfo,
            language,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!isCallActiveRef.current) return;

        const assistantMsg: Message = {
          id: `msg-${Date.now()}-ai`,
          role: 'assistant',
          text: data.assistantResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setHistory([...updatedHistory, assistantMsg]);
        if (data.extractedInfo) {
          setExtractedInfo((prev) => ({ ...prev, ...data.extractedInfo }));
        }

        handleAssistantSpeaking(data.assistantResponse);
      } catch (err: any) {
        console.error('Chat error:', err);
        if (isCallActiveRef.current) {
          setStatus('listening');
          setStatusMessage('Please speak or type your symptoms.');
        }
      }
    },
    [history, extractedInfo, language, handleAssistantSpeaking]
  );

  const startCall = useCallback(async (selectedLang?: LanguageOption) => {
    const lang = selectedLang || language;
    isCallActiveRef.current = true;
    clearSpeakingWatchdog();
    clearSilenceTimer();
    audioService.cleanup();
    setErrorMessage(null);
    setStatus('connecting');
    setStatusMessage('Connecting to HealthScreen AI...');
    setCurrentScreen('active_call');
    setSessionSeconds(0);
    setHistory([]);
    setExtractedInfo({
      name: 'Not provided',
      mainConcern: 'Not provided',
      duration: 'Not provided',
      severity: 'Not provided',
      relatedSymptoms: 'Not provided',
      additionalInfo: 'Not provided',
    });

    try {
      await audioService.requestMicrophone();
      setIsMicAvailable(true);
    } catch {
      console.warn('Microphone permission not granted.');
      setIsMicAvailable(false);
    }

    if (wsClientRef.current) {
      wsClientRef.current.disconnect();
    }

    let pendingAudioBase64: string | undefined = undefined;
    let pendingMimeType: string = 'audio/mpeg';

    const client = new WebSocketClient({
      onStatusChange: (newStatus, msg) => {
        if (!isCallActiveRef.current && newStatus !== 'ended') return;
        setStatus(newStatus);
        if (msg) setStatusMessage(msg);
      },
      onHistoryUpdate: (newHistory) => {
        if (!isCallActiveRef.current) return;
        setHistory(newHistory);
        const lastMsg = newHistory[newHistory.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          handleAssistantSpeaking(lastMsg.text, pendingAudioBase64, pendingMimeType);
          pendingAudioBase64 = undefined;
        }
      },
      onExtractedInfoUpdate: (info) => {
        if (!isCallActiveRef.current) return;
        setExtractedInfo((prev) => ({
          ...prev,
          ...info,
        }));
      },
      onAudioResponse: (audioBase64, mimeType) => {
        if (!isCallActiveRef.current) return;
        pendingAudioBase64 = audioBase64;
        pendingMimeType = mimeType;
      },
      onReportReady: (generatedReport) => {
        isCallActiveRef.current = false;
        clearSpeakingWatchdog();
        clearSilenceTimer();
        audioService.cleanup();
        setReport(generatedReport);
        setStatus('ended');
        setCurrentScreen('health_report');
      },
      onError: (err) => {
        if (!isCallActiveRef.current) return;
        clearSpeakingWatchdog();
        clearSilenceTimer();
        audioService.cleanup();
        setErrorMessage(err);
        setStatus('error');
      },
    });

    wsClientRef.current = client;

    try {
      await client.connect();
      client.startCall(lang);
    } catch (err) {
      console.error('Failed to initiate call:', err);
      setErrorMessage('Could not connect to health screening server. Please click Retry.');
      setStatus('error');
    }
  }, [language, handleAssistantSpeaking]);

  const endCall = useCallback(() => {
    isCallActiveRef.current = false;
    clearSpeakingWatchdog();
    clearSilenceTimer();
    audioService.cleanup();
    setIsRecording(false);
    setStatus('processing');
    setStatusMessage('Generating your structured health screening report...');

    if (wsClientRef.current) {
      wsClientRef.current.endCall();
    } else {
      fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history,
          extractedInfo,
          sessionDurationSeconds: sessionSeconds,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setReport(data);
          setStatus('ended');
          setCurrentScreen('health_report');
        })
        .catch(() => {
          setStatus('ended');
          setCurrentScreen('health_report');
        });
    }
  }, [history, extractedInfo, sessionSeconds]);

  const resetToHome = useCallback(() => {
    isCallActiveRef.current = false;
    clearSpeakingWatchdog();
    clearSilenceTimer();
    audioService.cleanup();
    if (wsClientRef.current) {
      wsClientRef.current.disconnect();
      wsClientRef.current = null;
    }
    setIsRecording(false);
    setStatus('idle');
    setReport(null);
    setCurrentScreen('landing');
  }, []);

  return {
    currentScreen,
    setCurrentScreen,
    status,
    statusMessage,
    history,
    extractedInfo,
    report,
    language,
    setLanguage,
    sessionSeconds,
    sessionFormatted: formatSessionTime(sessionSeconds),
    isRecording,
    liveTranscript,
    errorMessage,
    isMicAvailable,
    startCall,
    endCall,
    startListening,
    stopListeningAndSend,
    sendTextMessage,
    resetToHome,
  };
}
