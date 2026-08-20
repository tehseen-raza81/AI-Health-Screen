import React from 'react';
import { LanguageOption } from '../types';

interface LandingPageProps {
  onStartCall: () => void;
  language: LanguageOption;
  onLanguageChange: (lang: LanguageOption) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartCall }) => {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col justify-between py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Hero Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center pt-4 pb-12">
          {/* Left Column: Headline, Description, Call CTA */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Category Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#f5f5f7] border border-[#d2d2d7] text-[#0071e3] text-[12px] font-bold uppercase tracking-widest mb-6">
              <span className="w-2 h-2 rounded-full bg-[#0071e3]"></span>
              HealthScreen AI
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-semibold tracking-tight text-[#1d1d1f] leading-tight mb-6">
              Voice-First Health <br />
              Screening & Intake
            </h1>

            {/* Subtitle */}
            <p className="text-[17px] sm:text-[19px] text-[#86868b] leading-relaxed max-w-xl mb-8 font-normal">
              Speak naturally with our intelligent clinical assistant to conduct rapid preliminary screening and generate a structured physician-ready intake summary.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <button
                id="hero-start-call-btn"
                onClick={onStartCall}
                className="group inline-flex items-center gap-3 bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] text-white font-semibold text-[17px] px-8 py-3.5 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                {/* SVG Mic Icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
                <span>Start Call</span>
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14m-7-7 7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Disclaimer */}
            <div className="flex items-center gap-2 text-[13px] text-[#86868b] font-medium">
              <svg className="w-4 h-4 text-[#86868b] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>Preliminary triage assessment. Consult a healthcare professional for clinical decisions.</span>
            </div>
          </div>

          {/* Right Column: Hero Visual Graphic with Concentric Waves & Mic */}
          <div className="lg:col-span-5 flex items-center justify-center relative py-6">
            <div className="relative w-72 h-72 sm:w-88 sm:h-88 flex items-center justify-center">
              {/* Outer clean minimalist concentric pulse rings */}
              <div className="w-64 h-64 sm:w-76 sm:h-76 rounded-full border-2 border-[#0071e3] flex items-center justify-center relative">
                <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-full bg-[#0071e3] opacity-10"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#0071e3] flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform">
                    <svg className="w-9 h-9 sm:w-11 sm:h-11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Feature Cards (4 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-6 border border-[#d2d2d7] hover:border-[#0071e3] transition-all flex flex-col items-start text-left">
            <div className="w-10 h-10 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7] flex items-center justify-center text-[#0071e3] mb-4">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#1d1d1f] text-[17px] mb-1.5">Voice Conversation</h3>
            <p className="text-[14px] text-[#86868b] leading-relaxed">
              Speak naturally. AI listens and responds in real time.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-6 border border-[#d2d2d7] hover:border-[#0071e3] transition-all flex flex-col items-start text-left">
            <div className="w-10 h-10 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7] flex items-center justify-center text-[#0071e3] mb-4">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#1d1d1f] text-[17px] mb-1.5">Adaptive Questions</h3>
            <p className="text-[14px] text-[#86868b] leading-relaxed">
              Questions adapt to your symptoms and responses.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-6 border border-[#d2d2d7] hover:border-[#0071e3] transition-all flex flex-col items-start text-left">
            <div className="w-10 h-10 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7] flex items-center justify-center text-[#0071e3] mb-4">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#1d1d1f] text-[17px] mb-1.5">Structured Report</h3>
            <p className="text-[14px] text-[#86868b] leading-relaxed">
              Receive a comprehensive doctor-ready intake summary.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl p-6 border border-[#d2d2d7] hover:border-[#0071e3] transition-all flex flex-col items-start text-left">
            <div className="w-10 h-10 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7] flex items-center justify-center text-[#0071e3] mb-4">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#1d1d1f] text-[17px] mb-1.5">Privacy First</h3>
            <p className="text-[14px] text-[#86868b] leading-relaxed">
              Audio is processed in memory and encrypted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
