import React, { useState, useEffect } from 'react';
import { ActionItem, ActionCategory } from '../types';
import { createActionApi, updateActionApi } from '../lib/api';
import { X, Check, Loader2, Flame, Zap, Repeat, Briefcase, Rocket, Heart } from 'lucide-react';

interface ActionModalProps {
  action: ActionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ActionModal: React.FC<ActionModalProps> = ({
  action,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [category, setCategory] = useState<ActionCategory>('work');
  const [title, setTitle] = useState('');
  const [site, setSite] = useState('');
  const [owner, setOwner] = useState('');
  const [priority, setPriority] = useState<'P1' | 'P2'>('P2');
  const [status, setStatus] = useState<ActionItem['status']>('Waiting on Site');
  const [dueDate, setDueDate] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (action) {
      setCategory(action.category || 'work');
      setTitle(action.title);
      setSite(action.site);
      setOwner(action.owner);
      setPriority(action.priority);
      setStatus(action.status);
      setDueDate(action.due_date);
      setNextFollowUp(action.next_follow_up);
      setIsRecurring(action.is_recurring);
      setNotes(action.notes || '');
    } else {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');

      const fDate = new Date(today);
      fDate.setDate(fDate.getDate() + 7);
      const followStr = `${fDate.getFullYear()}-${String(fDate.getMonth() + 1).padStart(2, '0')}-${String(fDate.getDate()).padStart(2, '0')}`;

      const dDate = new Date(today);
      dDate.setDate(dDate.getDate() + 30);
      const dueStr = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}-${String(dDate.getDate()).padStart(2, '0')}`;

      setCategory('work');
      setTitle('');
      setSite('Plant A');
      setOwner('');
      setPriority('P2');
      setStatus('Waiting on Site');
      setDueDate(dueStr);
      setNextFollowUp(followStr);
      setIsRecurring(false);
      setNotes('');
    }
    setError(null);
  }, [action, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title / Description is required.');
      return;
    }
    if (!dueDate || !nextFollowUp) {
      setError('Both Due Date and Next Follow-Up Date are required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const defaultSite =
        category === 'side_project' ? 'Side Venture' : category === 'personal' ? 'Personal' : 'Main Facility';

      if (action) {
        await updateActionApi(action.id, {
          title: title.trim(),
          site: site.trim() || defaultSite,
          owner: owner.trim() || (category === 'personal' ? 'Me' : 'Unassigned'),
          priority,
          status,
          due_date: dueDate,
          next_follow_up: nextFollowUp,
          is_recurring: isRecurring,
          category,
          notes: notes.trim(),
        });
      } else {
        await createActionApi({
          title: title.trim(),
          site: site.trim() || defaultSite,
          owner: owner.trim() || (category === 'personal' ? 'Me' : 'Unassigned'),
          priority,
          status,
          due_date: dueDate,
          next_follow_up: nextFollowUp,
          is_recurring: isRecurring,
          category,
          notes: notes.trim(),
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save action item.');
    } finally {
      setIsSaving(false);
    }
  };

  const siteLabel =
    category === 'side_project' ? 'Project / Stream:' : category === 'personal' ? 'Area / Goal:' : 'Facility / Site:';

  const sitePlaceholder =
    category === 'side_project'
      ? 'e.g. Mobile App MVP'
      : category === 'personal'
      ? 'e.g. Home Renovation'
      : 'e.g. Plant A - Solvent Bay';

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-150">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
          <h3 className="text-base font-bold text-stone-900 tracking-tight">
            {action ? 'Edit Item' : 'Add New Item'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Workspace Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">Workspace Category:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory('work')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  category === 'work'
                    ? 'bg-amber-500 text-white shadow-xs border-amber-600'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>🏭 EHS Work</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('side_project')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  category === 'side_project'
                    ? 'bg-indigo-600 text-white shadow-xs border-indigo-700'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>🚀 Side Project</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('personal')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  category === 'personal'
                    ? 'bg-emerald-600 text-white shadow-xs border-emerald-700'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>🌱 Personal</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              {category === 'side_project'
                ? 'Milestone / Task Description:'
                : category === 'personal'
                ? 'Goal / Errand Description:'
                : 'Finding / Action Description:'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={
                category === 'side_project'
                  ? 'e.g. Integrate Stripe webhook handling & test failure states'
                  : category === 'personal'
                  ? 'e.g. Annual health checkup & blood test review'
                  : 'e.g. Chemical storage cabinet grounding cable severed'
              }
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:bg-white focus:border-amber-400"
            />
          </div>

          {/* Site & Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">{siteLabel}</label>
              <input
                type="text"
                value={site}
                onChange={(e) => setSite(e.target.value)}
                placeholder={sitePlaceholder}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:bg-white focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                {category === 'personal' ? 'Assignee / Partner:' : 'Responsible Owner:'}
              </label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder={category === 'personal' ? 'e.g. Me / Family' : 'e.g. Mike Ramirez'}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:bg-white focus:border-amber-400"
              />
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">Priority Level:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('P1')}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    priority === 'P1'
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>P1 Urgent</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('P2')}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    priority === 'P2'
                      ? 'bg-stone-100 text-stone-800 border-stone-300'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>P2 Routine</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">Status:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ActionItem['status'])}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:bg-white focus:border-amber-400"
              >
                <option value="Waiting on Site">
                  {category === 'side_project' ? 'In Progress / Waiting' : 'Waiting on Site'}
                </option>
                <option value="Under Review">Under Review</option>
                <option value="Done">Done (Closed)</option>
              </select>
            </div>
          </div>

          {/* Two-Date Tracking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
            <div>
              <label className="block text-xs font-bold text-rose-700 mb-1.5">
                {category === 'side_project'
                  ? '🔴 Milestone Hard Due Date:'
                  : category === 'personal'
                  ? '🔴 Target Deadline:'
                  : '🔴 Compliance Due Date:'}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:border-rose-400"
              />
              <span className="text-[10px] text-stone-500 mt-1 block">
                {category === 'side_project'
                  ? 'Ship date / release milestone'
                  : category === 'personal'
                  ? 'Personal completion target'
                  : 'Official audit/regulatory deadline'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-sky-700 mb-1.5">
                {category === 'side_project'
                  ? '🔵 Next Follow-up / Chase:'
                  : category === 'personal'
                  ? '🔵 Next Check-in Date:'
                  : '🔵 Next Follow-Up Date:'}
              </label>
              <input
                type="date"
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:border-sky-400"
              />
              <span className="text-[10px] text-stone-500 mt-1 block">Personal check-in / chase cadence</span>
            </div>
          </div>

          {/* Recurrence Toggle */}
          <div>
            <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded border-stone-300 text-amber-600 focus:ring-0"
              />
              <Repeat className="w-3.5 h-3.5 text-amber-600" />
              <span>Flag as Chronic / Recurring Issue</span>
            </label>
          </div>

          {/* Running Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">Running Update Notes:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Context notes, progress history, conversation log..."
              className="w-full p-3 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:bg-white focus:border-amber-400"
            />
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
                  <span>{action ? 'Update Item' : 'Create Item'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
