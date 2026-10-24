import React from 'react';
import { downloadCalendarIcs } from '../lib/api';
import { X, Download, Calendar, CheckCircle2, Shield, BellRing, ExternalLink } from 'lucide-react';

interface IcsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  openCount: number;
}

export const IcsExportModal: React.FC<IcsExportModalProps> = ({
  isOpen,
  onClose,
  openCount,
}) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    downloadCalendarIcs();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-950/80 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Calendar Sync (.ics Feed)</h3>
              <p className="text-xs text-slate-400">Standard RFC 5545 format for Outlook, Google, and Apple Calendar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Summary Banner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Ready to Export:</span>
              <span className="text-xs font-mono font-bold text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
                {openCount} Open Action Items
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Exporting generates all-day calendar events for all active findings without requiring third-party cloud connections:
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-rose-300 font-semibold">[DUE] Deadlines:</strong> Hard compliance targets with 1-day advance reminder alarms.
                </div>
              </div>

              <div className="flex items-start gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-sky-300 font-semibold">[CHASE] Follow-ups:</strong> Dedicated personal check-in blocks scheduled on your chase cadence.
                </div>
              </div>
            </div>
          </div>

          {/* Quick Import Instructions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              How to import into your calendar:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/70 space-y-1">
                <div className="font-semibold text-slate-200">Microsoft Outlook</div>
                <div className="text-[11px] text-slate-400">
                  File → Open & Export → Import/Export → Import an iCalendar (.ics) file.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/70 space-y-1">
                <div className="font-semibold text-slate-200">Google Calendar</div>
                <div className="text-[11px] text-slate-400">
                  Settings ⚙️ → Import & Export → Select file from computer.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/70 space-y-1">
                <div className="font-semibold text-slate-200">Apple Calendar</div>
                <div className="text-[11px] text-slate-400">
                  Double-click downloaded .ics file or drag directly into Calendar.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
          >
            Close
          </button>

          <button
            onClick={handleDownload}
            className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm border border-sky-400/30 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download ehs_action_radar.ics</span>
          </button>
        </div>
      </div>
    </div>
  );
};
