import React, { useState } from 'react';
import { useCallState } from './hooks/useCallState';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { CallControls } from './components/CallControls';
import { Transcript } from './components/Transcript';
import { InformationCollected } from './components/InformationCollected';
import { HealthReport } from './components/HealthReport';
import { InfoModals, ModalType } from './components/InfoModals';

export default function App() {
  const {
    currentScreen,
    status,
    statusMessage,
    history,
    extractedInfo,
    report,
    language,
    setLanguage,
    sessionFormatted,
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
  } = useCallState();

  const [activeModal, setActiveModal] = useState<ModalType>(null);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col selection:bg-[#0071e3]/15 selection:text-[#0071e3]">
      {/* Top Navigation */}
      <Navbar
        currentScreen={currentScreen}
        onStartCall={() => startCall(language)}
        onGoHome={resetToHome}
        language={language}
        onLanguageChange={setLanguage}
        onOpenModal={setActiveModal}
      />

      {/* Main Content Body */}
      <main className="flex-1 flex flex-col">
        {/* Error Notification Banner if any */}
        {errorMessage && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
            <div className="bg-[#fff2f2] border border-[#ffcfcf] text-[#ff3b30] text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff3b30]"></span>
                <span className="font-medium">{errorMessage}</span>
              </div>
              <button
                onClick={() => startCall(language)}
                className="bg-[#ff3b30] hover:bg-[#e03126] text-white font-medium px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* 1. Landing Screen */}
        {currentScreen === 'landing' && (
          <LandingPage
            onStartCall={() => startCall(language)}
            language={language}
            onLanguageChange={setLanguage}
          />
        )}

        {/* 2. Active Call Conversation Screen (3-Column Layout) */}
        {currentScreen === 'active_call' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[580px]">
              {/* Left Column: Call Status & Session History Summary */}
              <div className="lg:col-span-3 flex flex-col">
                <CallControls
                  status={status}
                  sessionFormatted={sessionFormatted}
                  history={history}
                  onEndCall={endCall}
                />
              </div>

              {/* Center Column: Live Conversation & Voice Controls */}
              <div className="lg:col-span-6 flex flex-col">
                <Transcript
                  status={status}
                  statusMessage={statusMessage}
                  history={history}
                  isRecording={isRecording}
                  liveTranscript={liveTranscript}
                  isMicAvailable={isMicAvailable}
                  onStartListening={startListening}
                  onStopListening={stopListeningAndSend}
                  onSendText={sendTextMessage}
                />
              </div>

              {/* Right Column: Information Collected Live Tracker */}
              <div className="lg:col-span-3 flex flex-col">
                <InformationCollected extractedInfo={extractedInfo} />
              </div>
            </div>
          </div>
        )}

        {/* 3. Health Report Screen */}
        {currentScreen === 'health_report' && report && (
          <HealthReport
            report={report}
            onStartNewCall={() => startCall(language)}
            onGoHome={resetToHome}
          />
        )}
      </main>

      {/* Navigation Info Modals */}
      <InfoModals modalType={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}
