import React from 'react';
import { ExtractedHealthInfo } from '../types';

interface InformationCollectedProps {
  extractedInfo: ExtractedHealthInfo;
}

export const InformationCollected: React.FC<InformationCollectedProps> = ({ extractedInfo }) => {
  const fields = [
    { label: 'Patient Name', value: extractedInfo.name },
    { label: 'Primary Concern', value: extractedInfo.mainConcern },
    { label: 'Symptom Duration', value: extractedInfo.duration },
    { label: 'Severity Level', value: extractedInfo.severity },
    { label: 'Associated Symptoms', value: extractedInfo.relatedSymptoms },
    { label: 'Medical History / Notes', value: extractedInfo.additionalInfo },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#d2d2d7] flex flex-col justify-between h-full text-left">
      <div>
        <span className="text-[12px] font-bold text-[#86868b] uppercase tracking-widest mb-4 block">
          Live Clinical Data
        </span>

        <div className="space-y-3.5">
          {fields.map((field) => {
            const hasValue =
              field.value &&
              field.value.trim() !== '' &&
              field.value.toLowerCase() !== 'not provided';

            return (
              <div key={field.label} className="border-b border-[#f5f5f7] pb-3 last:border-b-0">
                <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider block mb-0.5">
                  {field.label}
                </span>
                <span
                  className={`text-[14px] block leading-snug ${
                    hasValue ? 'text-[#1d1d1f] font-semibold' : 'text-[#86868b] font-normal italic'
                  }`}
                >
                  {field.value || 'Awaiting response...'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Medical Note */}
      <div className="pt-4 border-t border-[#d2d2d7] mt-6 text-left">
        <p className="text-[11px] text-[#86868b] leading-relaxed">
          Screening intake data automatically populates as questions are answered during the call.
        </p>
      </div>
    </div>
  );
};
