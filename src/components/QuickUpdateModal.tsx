import React, { useState } from 'react';
import { ActionItem } from '../types';
import { quickUpdateActionApi } from '../lib/api';
import { X, Clock, Check, Loader2, Calendar } from 'lucide-react';

interface QuickUpdateModalProps {
  action: ActionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickUpdateModal: React.FC<QuickUpdateModalProps> = ({
  action,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [logNote, setLogNote] = useState('');
  const [advanceDays, setAdvanceDays] = useState<number>(7);
  const [status, setStatus] = useState<ActionItem['status']>('Waiting on Site');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (action) {
      setStatus(action.status);
      setLogNote('');
      setAdvanceDays(7);
      setError(null);
    }
  }, [action]);

  if (!isOpen || !action) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logNote.trim()) {
      setError('Please enter a note describing the update or site conversation.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await quickUpdateActionApi(action.id, logNote.trim(), advanceDays, status);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update action.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 tracking-tight">Quick Site Update</h3>
              <p className="text-xs text-stone-500">Log conversation note and reschedule follow-up</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs">
            <span className="font-semibold text-stone-800 block truncate">{action.title}</span>
            <span className="text-stone-500 text-[11px]">
              Context: <strong className="text-stone-800 font-medium">{action.site}</strong> · Lead: <strong className="text-stone-800 font-medium">{action.owner}</strong>
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Log Progress Note / Response:
            </label>
            <textarea
              value={logNote}
              onChange={(e) => setLogNote(e.target.value)}
              placeholder="e.g. Spoke with team: vendor delivered replacement copper grounding strap today; installation scheduled tomorrow morning."
              rows={4}
              required
              className="w-full p-3 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-amber-400"
            />
          </div>

          {/* Reschedule Shortcuts */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Advance Next Follow-Up Date:
            </label>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {[
                { label: 'Keep Date', days: 0 },
                { label: '+3 Days', days: 3 },
                { label: '+7 Days', days: 7 },
                { label: '+14 Days', days: 14 },
              ].map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setAdvanceDays(opt.days)}
                  className={`py-2 px-2 text-center rounded-lg border font-semibold transition-colors ${
                    advanceDays === opt.days
                      ? 'bg-sky-50 text-sky-800 border-sky-300 shadow-xs'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              Logging an update resets the 10-day ghosting inactivity counter automatically.
            </p>
          </div>

          {/* Status Update */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">Update Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ActionItem['status'])}
              className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:bg-white focus:border-amber-400"
            >
              <option value="Waiting on Site">Waiting on Site</option>
              <option value="Under Review">Under Review</option>
              <option value="Done">Done (Closed)</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Update</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
