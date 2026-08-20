import React from 'react';

export type ModalType = 'features' | 'howItWorks' | 'about' | 'privacy' | null;

interface InfoModalsProps {
  modalType: ModalType;
  onClose: () => void;
}

export const InfoModals: React.FC<InfoModalsProps> = ({ modalType, onClose }) => {
  if (!modalType) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1d1d1f]/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#d2d2d7] text-left relative">
        <button
          id="close-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 text-[#86868b] hover:text-[#1d1d1f] p-1.5 rounded-lg hover:bg-[#f5f5f7] transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {modalType === 'features' && (
          <div>
            <span className="text-[12px] font-bold text-[#86868b] uppercase tracking-widest mb-2 block">Specifications</span>
            <h2 className="text-xl font-semibold text-[#1d1d1f] mb-4">Core Capabilities</h2>
            <div className="space-y-3 text-sm text-[#1d1d1f]">
              <div className="p-4 bg-[#f5f5f7] rounded-xl border border-[#d2d2d7]">
                <span className="font-semibold text-[#1d1d1f] block mb-1">Real-time Voice Conversation</span>
                <span className="text-[#86868b] text-[13px]">Bi-directional voice screening via low-latency WebSocket streaming & Web Audio.</span>
              </div>
              <div className="p-4 bg-[#f5f5f7] rounded-xl border border-[#d2d2d7]">
                <span className="font-semibold text-[#1d1d1f] block mb-1">Adaptive Clinical Intake</span>
                <span className="text-[#86868b] text-[13px]">Google Gemini AI drives conversational triage, asking focused questions and offering medical comfort advice.</span>
              </div>
              <div className="p-4 bg-[#f5f5f7] rounded-xl border border-[#d2d2d7]">
                <span className="font-semibold text-[#1d1d1f] block mb-1">Doctor-Ready Intake Reports</span>
                <span className="text-[#86868b] text-[13px]">Instant synthesis of symptom history, severity, duration, and clinical observations powered by Gemini.</span>
              </div>
            </div>
          </div>
        )}

        {modalType === 'howItWorks' && (
          <div>
            <span className="text-[12px] font-bold text-[#86868b] uppercase tracking-widest mb-2 block">Workflow</span>
            <h2 className="text-xl font-semibold text-[#1d1d1f] mb-4">How It Works</h2>
            <ol className="space-y-3 text-sm text-[#1d1d1f] list-decimal list-inside">
              <li>Click <strong className="font-semibold">Start Call</strong> and describe your health concerns naturally in English or Hindi.</li>
              <li>Speech is processed using Google Gemini multimodal audio recognition.</li>
              <li>Google Gemini AI analyzes responses, reasons on symptoms, and extracts structured clinical entities.</li>
              <li>Audio speech is synthesized with natural voice playback.</li>
              <li>When finished, a structured doctor-ready summary is generated for download.</li>
            </ol>
          </div>
        )}

        {modalType === 'about' && (
          <div>
            <span className="text-[12px] font-bold text-[#86868b] uppercase tracking-widest mb-2 block">Overview</span>
            <h2 className="text-xl font-semibold text-[#1d1d1f] mb-4">About HealthScreen AI</h2>
            <p className="text-sm text-[#86868b] leading-relaxed mb-4">
              HealthScreen AI is a voice-first clinical intake assistant powered by Google Gemini, designed to streamline preliminary patient intake and symptom documentation.
            </p>
            <p className="text-xs text-[#86868b] bg-[#f5f5f7] p-3.5 rounded-xl border border-[#d2d2d7] leading-relaxed">
              Disclaimer: HealthScreen AI is an informational triage screening tool and does not provide medical diagnoses or prescriptions. Always consult a qualified physician for clinical care.
            </p>
          </div>
        )}

        {modalType === 'privacy' && (
          <div>
            <span className="text-[12px] font-bold text-[#86868b] uppercase tracking-widest mb-2 block">Security</span>
            <h2 className="text-xl font-semibold text-[#1d1d1f] mb-4">Privacy & Protection</h2>
            <p className="text-sm text-[#86868b] leading-relaxed mb-4">
              Your confidentiality is our top priority. Audio streams are processed in transient memory for real-time transcription and voice synthesis.
            </p>
            <ul className="text-sm text-[#86868b] space-y-2 list-disc list-inside">
              <li>No raw audio recordings are stored permanently on server disks.</li>
              <li>Screening reports are maintained locally in your active browser session.</li>
              <li>Communication is protected via encrypted TLS WebSocket and HTTPS channels.</li>
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
