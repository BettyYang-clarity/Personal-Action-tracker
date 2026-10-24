import React, { useState, useEffect } from 'react';
import { ActionItem, NudgeData } from '../types';
import { generateNudgeApi, quickUpdateActionApi } from '../lib/api';
import { getDaysInactive } from '../lib/dateUtils';
import {
  X,
  Mail,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Flame,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Clock,
} from 'lucide-react';

interface NudgeModalProps {
  action: ActionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NudgeModal: React.FC<NudgeModalProps> = ({
  action,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [tone, setTone] = useState<'standard' | 'urgent' | 'casual'>('standard');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [mailtoUrl, setMailtoUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && action) {
      // Auto-select tone based on priority / inactivity
      const days = getDaysInactive(action.updated_at);
      const defaultTone = action.priority === 'P1' || days >= 10 ? 'urgent' : 'standard';
      setTone(defaultTone);
      generateDraft(defaultTone);
    }
  }, [isOpen, action]);

  if (!isOpen || !action) return null;

  const daysInactive = getDaysInactive(action.updated_at);

  const generateDraft = async (selectedTone: 'standard' | 'urgent' | 'casual') => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await generateNudgeApi({
        title: action.title,
        site: action.site,
        owner: action.owner,
        priority: action.priority,
        due_date: action.due_date,
        next_follow_up: action.next_follow_up,
        status: action.status,
        daysInactive,
        notes: action.notes,
        category: action.category,
        tone: selectedTone,
      });
      setSubject(res.subject);
      setBody(res.body);
      setMailtoUrl(res.mailtoUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate nudge email draft.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    const fullText = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogSentAndReschedule = async () => {
    setIsSaving(true);
    try {
      const logNote = `Follow-up email sent to ${action.owner} ("${subject}"). Rescheduled check-in for +7 days.`;
      await quickUpdateActionApi(action.id, logNote, 7);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to log note.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToneChange = (newTone: 'standard' | 'urgent' | 'casual') => {
    setTone(newTone);
    generateDraft(newTone);
  };

  // Recalculate mailto URL if user edited subject or body
  const currentMailto = `mailto:${encodeURIComponent(
    action.owner.replace(/\s+/g, '.').toLowerCase() + '@company.com'
  )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 tracking-tight">1-Click Friendly Follow-up Drafter</h3>
              <p className="text-xs text-stone-500">Personalized follow-up message for {action.owner}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Action Context Card */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-stone-800 line-clamp-1">{action.title}</span>
              {action.priority === 'P1' && (
                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-rose-500" />
                  P1 URGENT
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-stone-500 text-[11px]">
              <span>Context: <strong className="text-stone-800 font-medium">{action.site}</strong></span>
              <span>·</span>
              <span>Lead: <strong className="text-stone-800 font-medium">{action.owner}</strong></span>
              <span>·</span>
              <span className="text-rose-700 font-mono font-medium">Due: {action.due_date}</span>
              {daysInactive >= 10 && (
                <>
                  <span>·</span>
                  <span className="text-amber-800 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    {daysInactive}d silent
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Tone Selector */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <label className="text-xs font-semibold text-stone-700">Tone & Urgency Style:</label>
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200">
              <button
                type="button"
                onClick={() => handleToneChange('standard')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  tone === 'standard'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Collaborative
              </button>
              <button
                type="button"
                onClick={() => handleToneChange('urgent')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  tone === 'urgent'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200 shadow-xs'
                    : 'text-stone-500 hover:text-rose-700'
                }`}
              >
                Firm / Urgent
              </button>
              <button
                type="button"
                onClick={() => handleToneChange('casual')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  tone === 'casual'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Quick Check-in
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-stone-400 text-xs space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span>Drafting friendly follow-up with Gemini AI...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Subject */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Subject Line:</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:bg-white focus:border-amber-400"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Message Body:</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  className="w-full p-3 text-xs leading-relaxed bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:bg-white focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              disabled={isLoading || !body}
              className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-400" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            {/* Direct Open in Email Client */}
            <a
              href={currentMailto}
              className="px-3.5 py-2 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Mail Client</span>
            </a>
          </div>

          {/* Log Sent & Advance Follow-up (+7 days) */}
          <button
            onClick={handleLogSentAndReschedule}
            disabled={isSaving || isLoading}
            className="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5" />
                <span>Log Sent & Reschedule (+7d)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
