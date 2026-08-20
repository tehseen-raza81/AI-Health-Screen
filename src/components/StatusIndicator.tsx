import React from 'react';
import { CallStatus } from '../types';

interface StatusIndicatorProps {
  status: CallStatus;
  customMessage?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  customMessage,
  size = 'md',
}) => {
  if (status === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin mb-3"></div>
        <div className="text-[14px] font-semibold text-[#1d1d1f] mb-1">Connecting</div>
        <p className="text-[13px] text-[#86868b]">{customMessage || 'Connecting to HealthScreen AI...'}</p>
      </div>
    );
  }

  if (status === 'listening') {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="relative w-16 h-16 flex items-center justify-center mb-3">
          <div className="absolute inset-0 rounded-full bg-[#0071e3]/20 animate-ping opacity-50"></div>
          <div className="absolute inset-2 rounded-full bg-[#0071e3]/10"></div>
          <div className="relative z-10 w-10 h-10 rounded-full bg-[#0071e3] flex items-center justify-center text-white shadow-xs">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </div>
        </div>
        <div className="text-[14px] font-semibold text-[#1d1d1f] mb-1">Listening</div>
        <p className="text-[13px] text-[#86868b]">{customMessage || 'Speak naturally...'}</p>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="relative w-12 h-12 flex items-center justify-center mb-3">
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#ff9500] animate-spin"></div>
        </div>
        <div className="text-[14px] font-semibold text-[#1d1d1f] mb-1">Processing</div>
        <p className="text-[13px] text-[#86868b]">{customMessage || 'Analyzing your response...'}</p>
      </div>
    );
  }

  if (status === 'speaking') {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="flex items-center gap-1.5 h-10 mb-2">
          <span className="w-1.5 bg-[#0071e3] rounded-full animate-bounce h-3"></span>
          <span className="w-1.5 bg-[#0071e3] rounded-full animate-bounce h-7 [animation-delay:0.15s]"></span>
          <span className="w-1.5 bg-[#0071e3] rounded-full animate-bounce h-10 [animation-delay:0.3s]"></span>
          <span className="w-1.5 bg-[#0071e3] rounded-full animate-bounce h-5 [animation-delay:0.45s]"></span>
          <span className="w-1.5 bg-[#0071e3] rounded-full animate-bounce h-8 [animation-delay:0.2s]"></span>
          <span className="w-1.5 bg-[#0071e3] rounded-full animate-bounce h-3 [animation-delay:0.35s]"></span>
        </div>
        <div className="text-[14px] font-semibold text-[#1d1d1f] mb-1">AI Speaking</div>
        <p className="text-[13px] text-[#86868b]">{customMessage || 'AI is speaking...'}</p>
      </div>
    );
  }

  if (status === 'ended') {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[#f5f5f7] border border-[#d2d2d7] flex items-center justify-center text-[#1d1d1f] mb-3">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="text-[14px] font-semibold text-[#1d1d1f] mb-1">Ended</div>
        <p className="text-[13px] text-[#86868b]">Call completed</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[#ff3b30]/10 border border-[#ff3b30] flex items-center justify-center text-[#ff3b30] mb-3">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="text-[14px] font-semibold text-[#ff3b30] mb-1">Connection Alert</div>
        <p className="text-[13px] text-[#86868b]">{customMessage || 'Something went wrong'}</p>
      </div>
    );
  }

  return null;
};
