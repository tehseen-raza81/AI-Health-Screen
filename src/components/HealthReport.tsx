import React, { useState } from 'react';
import { StructuredHealthReport } from '../types';

interface HealthReportProps {
  report: StructuredHealthReport;
  onStartNewCall: () => void;
  onGoHome: () => void;
}

export const HealthReport: React.FC<HealthReportProps> = ({
  report,
  onStartNewCall,
  onGoHome,
}) => {
  const [showTranscript, setShowTranscript] = useState(false);

  const handleDownload = () => {
    const reportText = `=====================================================
HEALTHSCREEN AI SCREENING REPORT
Generated: ${report.generatedAt}
Session Duration: ${report.sessionDuration}
=====================================================

PATIENT INFORMATION:
• Patient: ${report.patient}
• Main Concern: ${report.mainConcern}
• Key Symptoms: ${report.keySymptoms}

CLINICAL INTAKE DETAILS:
• Duration: ${report.duration}
• Severity: ${report.severity}
• Related Symptoms: ${report.relatedSymptoms}

IMPORTANT INFORMATION & CONTEXT:
${report.importantInformation}

FOLLOW-UP CONSIDERATIONS:
${report.followUpConsiderations}

INFORMATION NOT PROVIDED / UNANSWERED:
${report.informationNotProvided.map((item) => `• ${item}`).join('\n')}

DISCLAIMER:
${report.disclaimer}

=====================================================
CONVERSATION TRANSCRIPT:
=====================================================
${report.transcript.map((m) => `[${m.timestamp}] ${m.role === 'assistant' ? 'HealthScreen AI' : 'Patient'}: ${m.text}`).join('\n')}
`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HealthScreenAI-Report-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Report Summary & Actions (Col span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Report Summary Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#d2d2d7] flex flex-col text-left">
            <span className="text-[12px] font-bold text-[#86868b] uppercase tracking-widest mb-4 block">
              Intake Summary
            </span>
            
            <div className="space-y-4 mb-6">
              <div>
                <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider block mb-0.5">Completed Date</span>
                <span className="text-[14px] font-semibold text-[#1d1d1f]">{report.generatedAt}</span>
              </div>
              
              <div>
                <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider block mb-0.5">Session Duration</span>
                <span className="text-[22px] font-semibold font-mono text-[#1d1d1f]">{report.sessionDuration}</span>
              </div>
            </div>

            <button
              id="download-report-btn"
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] text-white font-semibold text-[15px] transition-colors cursor-pointer shadow-xs"
            >
              <span>Download Full Summary</span>
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>

          {/* Actions Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#d2d2d7] flex flex-col text-left">
            <span className="text-[12px] font-bold text-[#86868b] uppercase tracking-widest mb-4 block">
              Session Navigation
            </span>

            <div className="space-y-3">
              <button
                id="report-new-call-btn"
                onClick={onStartNewCall}
                className="w-full flex items-center gap-2.5 py-3 px-4 rounded-xl border border-[#d2d2d7] bg-white hover:bg-[#f5f5f7] active:bg-[#e5e5ea] text-[#0071e3] font-semibold text-[14px] transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 text-[#0071e3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span>Start New Screening</span>
              </button>

              <button
                id="report-go-home-btn"
                onClick={onGoHome}
                className="w-full flex items-center gap-2.5 py-3 px-4 rounded-xl border border-[#d2d2d7] bg-white hover:bg-[#f5f5f7] active:bg-[#e5e5ea] text-[#1d1d1f] font-semibold text-[14px] transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 text-[#86868b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Return to Overview</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Health Screening Report (Col span 8) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-8 border border-[#d2d2d7] flex flex-col text-left">
          {/* Header */}
          <div className="mb-6 pb-4 border-b border-[#d2d2d7]">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] tracking-tight mb-2">
              Clinical Screening Report
            </h1>
            <p className="text-[13px] sm:text-[14px] text-[#86868b]">
              Structured preliminary summary generated from the voice intake dialogue. Consult a medical professional for diagnostic verification.
            </p>
          </div>

          {/* Row 1: 3 Column Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]">
              <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider block mb-1">Patient</span>
              <span className="text-[14px] font-semibold text-[#1d1d1f]">{report.patient || 'Not provided'}</span>
            </div>

            <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]">
              <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider block mb-1">Main Concern</span>
              <span className="text-[14px] font-semibold text-[#1d1d1f]">{report.mainConcern || 'Not provided'}</span>
            </div>

            <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]">
              <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider block mb-1">Key Symptoms</span>
              <span className="text-[14px] font-semibold text-[#1d1d1f]">{report.keySymptoms || 'Not provided'}</span>
            </div>
          </div>

          {/* Row 2: 3 Column Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]">
              <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider block mb-1">Duration</span>
              <span className="text-[14px] font-semibold text-[#1d1d1f]">{report.duration || 'Not provided'}</span>
            </div>

            <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]">
              <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider block mb-1">Severity</span>
              <span className="text-[14px] font-semibold text-[#1d1d1f]">{report.severity || 'Not provided'}</span>
            </div>

            <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]">
              <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider block mb-1">Related Symptoms</span>
              <span className="text-[14px] font-semibold text-[#1d1d1f]">{report.relatedSymptoms || 'Not provided'}</span>
            </div>
          </div>

          {/* Important Information */}
          <div className="mb-6 p-5 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]">
            <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider block mb-2">Important Information</span>
            <p className="text-[14px] text-[#1d1d1f] leading-relaxed">
              {report.importantInformation || 'No additional contextual details provided.'}
            </p>
          </div>

          {/* Follow-up Considerations */}
          <div className="mb-6 p-5 rounded-xl bg-[#f5f5f7] border border-[#0071e3]/40">
            <span className="text-[11px] font-bold text-[#0071e3] uppercase tracking-wider block mb-2">Follow-up Considerations</span>
            <p className="text-[14px] text-[#1d1d1f] leading-relaxed">
              {report.followUpConsiderations || 'Consult a healthcare professional if symptoms persist or worsen.'}
            </p>
          </div>

          {/* Information Not Provided */}
          <div className="mb-6 p-5 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]">
            <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider block mb-3">Information Not Provided</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[13px] text-[#86868b]">
              {report.informationNotProvided.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d2d2d7]"></span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Collapsible Full Transcript */}
          <div className="pt-4 border-t border-[#d2d2d7]">
            <button
              id="toggle-transcript-btn"
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-[13px] font-semibold text-[#0071e3] hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <span>{showTranscript ? 'Hide Full Conversation Transcript' : 'View Full Conversation Transcript'}</span>
              <svg className={`w-3.5 h-3.5 transition-transform ${showTranscript ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showTranscript && (
              <div className="mt-4 p-4 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7] space-y-3 max-h-72 overflow-y-auto">
                {report.transcript.map((msg) => (
                  <div key={msg.id} className="text-xs">
                    <span className="font-semibold text-[#1d1d1f]">
                      [{msg.timestamp}] {msg.role === 'assistant' ? 'HealthScreen AI' : 'Patient'}:
                    </span>{' '}
                    <span className="text-[#86868b]">{msg.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
