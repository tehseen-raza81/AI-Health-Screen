import React from 'react';
import { CallStatus, Message } from '../types';

interface CallControlsProps {
  status: CallStatus;
  sessionFormatted: string;
  history: Message[];
  onEndCall: () => void;
}

export const CallControls: React.FC<CallControlsProps> = ({
  status,
  sessionFormatted,
  history,
  onEndCall,
}) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'connecting':
        return { text: 'Connecting...', dotClass: 'bg-[#ff9500] animate-pulse', color: 'text-[#ff9500]' };
      case 'listening':
        return { text: 'Listening...', dotClass: 'bg-[#0071e3] animate-ping', color: 'text-[#0071e3]' };
      case 'processing':
        return { text: 'Processing...', dotClass: 'bg-[#ff9500] animate-spin', color: 'text-[#ff9500]' };
      case 'speaking':
        return { text: 'AI Speaking', dotClass: 'bg-[#0071e3] animate-pulse', color: 'text-[#0071e3]' };
      case 'ended':
        return { text: 'Call Ended', dotClass: 'bg-[#86868b]', color: 'text-[#86868b]' };
      case 'error':
        return { text: 'Connection Error', dotClass: 'bg-[#ff3b30]', color: 'text-[#ff3b30]' };
      default:
        return { text: 'Active', dotClass: 'bg-[#0071e3]', color: 'text-[#0071e3]' };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="flex flex-col gap-4 w-full h-full justify-between">
      {/* 1. Call Status Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#d2d2d7] flex flex-col text-left">
        <span className="text-[12px] font-bold text-[#86868b] uppercase tracking-widest mb-3 block">
          Call Status
        </span>
        
        {/* Status Line */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-2.5 h-2.5 rounded-full ${statusInfo.dotClass}`}></span>
          <span className={`text-[14px] font-semibold uppercase tracking-[0.1em] ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>

        {/* Dynamic Sound Wave Visualizer */}
        <div className="flex items-center justify-between gap-1 h-8 px-3 py-1 bg-[#f5f5f7] rounded-lg border border-[#d2d2d7] mb-5">
          <span className={`w-1 rounded-full bg-[#0071e3] transition-all duration-150 ${status === 'speaking' || status === 'listening' ? 'h-3 animate-pulse' : 'h-1.5'}`}></span>
          <span className={`w-1 rounded-full bg-[#0071e3] transition-all duration-150 ${status === 'speaking' || status === 'listening' ? 'h-6 animate-pulse' : 'h-1.5'}`}></span>
          <span className={`w-1 rounded-full bg-[#0071e3]/60 transition-all duration-150 ${status === 'speaking' || status === 'listening' ? 'h-4 animate-pulse' : 'h-1.5'}`}></span>
          <span className={`w-1 rounded-full bg-[#0071e3] transition-all duration-150 ${status === 'speaking' || status === 'listening' ? 'h-7 animate-pulse' : 'h-1.5'}`}></span>
          <span className={`w-1 rounded-full bg-[#0071e3] transition-all duration-150 ${status === 'speaking' || status === 'listening' ? 'h-5 animate-pulse' : 'h-1.5'}`}></span>
          <span className={`w-1 rounded-full bg-[#0071e3]/60 transition-all duration-150 ${status === 'speaking' || status === 'listening' ? 'h-3 animate-pulse' : 'h-1.5'}`}></span>
          <span className={`w-1 rounded-full bg-[#0071e3] transition-all duration-150 ${status === 'speaking' || status === 'listening' ? 'h-6 animate-pulse' : 'h-1.5'}`}></span>
          <span className={`w-1 rounded-full bg-[#0071e3] transition-all duration-150 ${status === 'speaking' || status === 'listening' ? 'h-4 animate-pulse' : 'h-1.5'}`}></span>
          <span className={`w-1 rounded-full bg-[#0071e3] transition-all duration-150 ${status === 'speaking' || status === 'listening' ? 'h-7 animate-pulse' : 'h-1.5'}`}></span>
          <span className={`w-1 rounded-full bg-[#0071e3]/60 transition-all duration-150 ${status === 'speaking' || status === 'listening' ? 'h-2 animate-pulse' : 'h-1.5'}`}></span>
        </div>

        {/* Session Time */}
        <div className="flex flex-col text-left pt-2 border-t border-[#d2d2d7]">
          <span className="text-[12px] font-bold text-[#86868b] uppercase tracking-widest mb-1">Session Time</span>
          <span className="text-[26px] font-semibold text-[#1d1d1f] tracking-tight font-mono">{sessionFormatted}</span>
        </div>
      </div>

      {/* 2. Conversation Timeline Log */}
      <div className="bg-white rounded-2xl p-6 border border-[#d2d2d7] flex-1 flex flex-col min-h-[200px] max-h-[320px] overflow-hidden text-left">
        <span className="text-[12px] font-bold text-[#86868b] uppercase tracking-widest mb-3 block">
          Session Dialogue
        </span>
        
        <div className="overflow-y-auto pr-1 space-y-2.5 flex-1">
          {history.length === 0 ? (
            <div className="text-xs text-[#86868b] italic py-4 text-center">
              Session initializing...
            </div>
          ) : (
            history.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs transition-colors ${
                  msg.role === 'assistant'
                    ? 'bg-[#f5f5f7] border border-[#0071e3]/30 text-[#1d1d1f] font-medium'
                    : 'bg-white border border-[#d2d2d7] text-[#1d1d1f] font-medium'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    msg.role === 'assistant'
                      ? 'bg-[#0071e3] text-white'
                      : 'bg-[#d2d2d7] text-[#1d1d1f]'
                  }`}
                >
                  {msg.role === 'assistant' ? 'AI' : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate">{msg.role === 'assistant' ? 'HealthScreen AI' : 'Patient'}</span>
                    <span className="text-[10px] text-[#86868b] shrink-0 font-mono">{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. End Call Button & Instruction */}
      <div className="space-y-2">
        <button
          id="end-call-btn"
          onClick={onEndCall}
          className="w-full h-13 bg-[#ff3b30] hover:bg-[#e03126] active:bg-[#c9261c] text-white rounded-xl text-[16px] font-semibold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>End Call</span>
        </button>
        <div className="text-center text-[11px] text-[#86868b] uppercase tracking-widest font-bold">
          Tap microphone or type below
        </div>
      </div>
    </div>
  );
};
