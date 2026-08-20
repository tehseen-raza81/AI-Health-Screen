import React from 'react';
import { LanguageOption } from '../types';

interface NavbarProps {
  currentScreen: 'landing' | 'active_call' | 'health_report';
  onStartCall: () => void;
  onGoHome: () => void;
  language: LanguageOption;
  onLanguageChange: (lang: LanguageOption) => void;
  onOpenModal: (type: 'features' | 'howItWorks' | 'about' | 'privacy') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onStartCall,
  onGoHome,
  language,
  onLanguageChange,
  onOpenModal,
}) => {
  return (
    <header className="w-full bg-white border-b border-[#d2d2d7] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          id="nav-logo-btn"
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
        >
          <div className="w-7 h-7 rounded-md bg-[#0071e3] flex items-center justify-center text-white">
            {/* Minimalist medical cross geometry */}
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14m-7-7h14" />
            </svg>
          </div>
          <span className="font-semibold text-[19px] tracking-tight text-[#1d1d1f]">
            HealthScreen <span className="text-[#0071e3]">AI</span>
          </span>
        </button>

        {/* Navigation Links (Visible on Landing/Home) */}
        {currentScreen === 'landing' ? (
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-[#86868b]">
            <button
              id="nav-features-btn"
              onClick={() => onOpenModal('features')}
              className="hover:text-[#1d1d1f] transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              id="nav-how-it-works-btn"
              onClick={() => onOpenModal('howItWorks')}
              className="hover:text-[#1d1d1f] transition-colors cursor-pointer"
            >
              How it works
            </button>
            <button
              id="nav-about-btn"
              onClick={() => onOpenModal('about')}
              className="hover:text-[#1d1d1f] transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              id="nav-privacy-btn"
              onClick={() => onOpenModal('privacy')}
              className="hover:text-[#1d1d1f] transition-colors cursor-pointer"
            >
              Privacy
            </button>
          </nav>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 bg-[#f5f5f7] border border-[#d2d2d7] rounded-md">
            <span className="w-2 h-2 rounded-full bg-[#0071e3] animate-pulse"></span>
            <span className="text-[12px] font-semibold text-[#86868b] uppercase tracking-wider">Session Active</span>
          </div>
        )}

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center bg-[#f5f5f7] p-0.5 rounded-lg border border-[#d2d2d7] text-xs font-medium">
            <button
              id="lang-en-btn"
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-white text-[#0071e3] shadow-xs font-semibold'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              EN
            </button>
            <button
              id="lang-hi-btn"
              onClick={() => onLanguageChange('hi')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                language === 'hi'
                  ? 'bg-white text-[#0071e3] shadow-xs font-semibold'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              हिंदी (HI)
            </button>
          </div>

          {/* Primary Action Button */}
          {currentScreen === 'landing' && (
            <button
              id="nav-start-call-btn"
              onClick={onStartCall}
              className="bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] text-white text-[14px] font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Start Call
            </button>
          )}

          {currentScreen === 'health_report' && (
            <button
              id="nav-new-call-btn"
              onClick={onStartCall}
              className="bg-[#0071e3] hover:bg-[#0077ed] text-white text-[14px] font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Start New Call
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
