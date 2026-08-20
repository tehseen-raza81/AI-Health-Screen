import React, { useState, useRef, useEffect } from 'react';
import { CallStatus, Message } from '../types';

interface TranscriptProps {
  status: CallStatus;
  statusMessage: string;
  history: Message[];
  isRecording: boolean;
  liveTranscript?: string;
  isMicAvailable: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onSendText: (text: string) => void;
}

export const Transcript: React.FC<TranscriptProps> = ({
  status,
  statusMessage,
  history,
  isRecording,
  liveTranscript,
  isMicAvailable,
  onStartListening,
  onStopListening,
  onSendText,
}) => {
  const [inputText, setInputText] = useState('');
  const [showTextInput, setShowTextInput] = useState(!isMicAvailable);
  const scrollBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, status]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && status !== 'processing') {
      onSendText(inputText.trim());
      setInputText('');
    }
  };

  const getHeaderStatus = () => {
    if (status === 'speaking') {
      return (
        <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-[#0071e3]">
          <span className="w-2 h-2 rounded-full bg-[#0071e3] animate-pulse"></span>
          <span>AI Speaking</span>
          <span className="flex gap-0.5 text-[#0071e3]">
            <span className="animate-bounce">.</span>
            <span className="animate-bounce [animation-delay:0.2s]">.</span>
            <span className="animate-bounce [animation-delay:0.4s]">.</span>
          </span>
        </div>
      );
    }
    if (status === 'listening' || isRecording) {
      return (
        <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-[#0071e3]">
          <span className="w-2 h-2 rounded-full bg-[#0071e3] animate-ping"></span>
          <span>Listening... Speak now</span>
        </div>
      );
    }
    if (status === 'processing') {
      return (
        <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-[#ff9500]">
          <span className="w-2 h-2 rounded-full bg-[#ff9500] animate-spin"></span>
          <span>Processing response...</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-[#86868b]">
        <span className="w-2 h-2 rounded-full bg-[#d2d2d7]"></span>
        <span>{statusMessage || 'Connected'}</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-[#d2d2d7] flex flex-col h-full min-h-[540px] justify-between overflow-hidden">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-[#d2d2d7] flex items-center justify-between bg-[#f5f5f7]">
        {getHeaderStatus()}
        
        {/* Toggle Text Input fallback button */}
        <button
          type="button"
          onClick={() => setShowTextInput(!showTextInput)}
          className="text-[13px] font-medium text-[#86868b] hover:text-[#1d1d1f] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span>{showTextInput ? 'Hide keyboard' : 'Type message'}</span>
        </button>
      </div>

      {/* Message Chat Bubble Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {history.length === 0 && status === 'connecting' && (
          <div className="flex flex-col items-center justify-center h-48 text-[#86868b] text-sm">
            <div className="w-7 h-7 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin mb-3"></div>
            <span>Connecting to HealthScreen AI...</span>
          </div>
        )}

        {history.map((msg) => {
          const isAI = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed ${
                  isAI
                    ? 'bg-[#f5f5f7] border border-[#d2d2d7] text-[#1d1d1f] text-left'
                    : 'bg-white border border-[#0071e3]/40 text-[#1d1d1f] font-medium text-left shadow-2xs'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <div
                  className={`text-[10px] mt-1.5 font-mono ${
                    isAI ? 'text-[#86868b] text-right' : 'text-[#0071e3] text-right'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Live User Speech Bubble as user speaks */}
        {isRecording && (
          <div className="flex flex-col items-end">
            <div className="max-w-[85%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed bg-[#0071e3]/10 border border-[#0071e3]/50 text-[#1d1d1f] font-medium text-left shadow-xs">
              <div className="flex items-center gap-2 text-[11px] text-[#0071e3] font-semibold uppercase tracking-wide mb-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0071e3] animate-ping"></span>
                <span>Listening & Transcribing live...</span>
              </div>
              <p className="whitespace-pre-wrap min-h-[22px]">
                {liveTranscript ? (
                  <span>
                    {liveTranscript}
                    <span className="inline-block w-1.5 h-4 ml-1 bg-[#0071e3] animate-pulse align-middle"></span>
                  </span>
                ) : (
                  <span className="text-[#86868b] italic font-normal">
                    Speak your symptoms or health concern now...
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Processing Indicator Bubble */}
        {status === 'processing' && (
          <div className="flex items-start">
            <div className="bg-[#f5f5f7] border border-[#d2d2d7] rounded-2xl px-4 py-3 text-xs text-[#86868b] flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin"></div>
              <span>Health AI is analyzing your response...</span>
            </div>
          </div>
        )}

        <div ref={scrollBottomRef} />
      </div>

      {/* Bottom Voice Control Panel & Optional Keyboard Fallback */}
      <div className="p-6 border-t border-[#d2d2d7] bg-[#f5f5f7]/60 flex flex-col items-center gap-4">
        {/* Large Central Microphone / Control Button */}
        <div className="relative flex items-center justify-center">
          {/* Animated concentric ring during active listening */}
          {isRecording && (
            <>
              <div className="absolute -inset-3 rounded-full bg-[#0071e3]/15 animate-ping pointer-events-none"></div>
              <div className="absolute -inset-6 rounded-full border border-[#0071e3]/40 animate-pulse pointer-events-none"></div>
            </>
          )}

          <button
            id="mic-action-btn"
            onClick={() => {
              if (isRecording) {
                onStopListening();
              } else {
                onStartListening();
              }
            }}
            disabled={status === 'processing' || status === 'connecting'}
            className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-white transition-all cursor-pointer shadow-xs ${
              isRecording
                ? 'bg-[#ff3b30] hover:bg-[#e03126] active:scale-95 ring-4 ring-[#ff3b30]/20'
                : 'bg-[#0071e3] hover:bg-[#0077ed] active:scale-95'
            } ${status === 'processing' ? 'opacity-60 cursor-not-allowed' : ''}`}
            title={isRecording ? 'Tap to finish speaking' : 'Tap to speak'}
          >
            {isRecording ? (
              // Stop square glyph
              <div className="w-5 h-5 bg-white rounded-xs"></div>
            ) : (
              // Microphone glyph
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            )}
          </button>
        </div>

        {/* Action Label */}
        <div className="flex items-center justify-between w-full max-w-sm px-2 text-xs">
          <span className="text-[#86868b] font-medium">
            {isRecording ? 'Listening... Tap to finish' : status === 'speaking' ? 'AI is speaking...' : 'Tap microphone to speak'}
          </span>

          <div className="flex items-center gap-1.5 text-[#86868b] font-medium">
            <span>Mic</span>
            <span className={`w-2 h-2 rounded-full ${isMicAvailable ? 'bg-[#0071e3]' : 'bg-[#ff9500]'}`}></span>
            <span className="text-[#1d1d1f]">{isMicAvailable ? 'Ready' : 'Off'}</span>
          </div>
        </div>

        {/* Text Input Fallback */}
        {showTextInput && (
          <form onSubmit={handleTextSubmit} className="w-full flex items-center gap-2 pt-2">
            <input
              id="chat-text-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Or type your health symptom here..."
              disabled={status === 'processing'}
              className="flex-1 bg-white border border-[#d2d2d7] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0071e3] text-[#1d1d1f] placeholder:text-[#86868b]"
            />
            <button
              id="send-text-btn"
              type="submit"
              disabled={!inputText.trim() || status === 'processing'}
              className="bg-[#1d1d1f] hover:bg-[#2d2d2f] disabled:opacity-40 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
