import React, { useState, useEffect } from 'react';
import { ActionCategory } from '../types';
import { createActionApi, parseTextApi, createBatchActionsApi } from '../lib/api';
import {
  Plus,
  Sparkles,
  Flame,
  Zap,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  AlertCircle,
  Briefcase,
  Rocket,
  Heart,
} from 'lucide-react';

interface InlineQuickAddProps {
  onSuccess: () => void;
  sites: string[];
  activeWorkspace?: ActionCategory | 'all';
}

export const InlineQuickAdd: React.FC<InlineQuickAddProps> = ({
  onSuccess,
  sites,
  activeWorkspace = 'all',
}) => {
  const defaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  };

  const defaultChaseDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  };

  // Selected Category
  const [category, setCategory] = useState<ActionCategory>(
    activeWorkspace === 'side_project'
      ? 'side_project'
      : activeWorkspace === 'personal'
      ? 'personal'
      : 'work'
  );

  // Sync category when workspace changes
  useEffect(() => {
    if (activeWorkspace === 'side_project') {
      setCategory('side_project');
      setSite('AI Video SaaS MVP');
    } else if (activeWorkspace === 'personal') {
      setCategory('personal');
      setSite('Health & Wellness');
    } else if (activeWorkspace === 'work') {
      setCategory('work');
      setSite('Plant A');
    }
  }, [activeWorkspace]);

  // Form fields
  const [title, setTitle] = useState('');
  const [site, setSite] = useState('Plant A');
  const [owner, setOwner] = useState('');
  const [priority, setPriority] = useState<'P1' | 'P2'>('P2');
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [chaseDate, setChaseDate] = useState(defaultChaseDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // AI Smart Paste state
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [rawText, setRawText] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [aiSuccessCount, setAiSuccessCount] = useState<number | null>(null);

  // Category-specific labels
  const siteLabel =
    category === 'side_project'
      ? 'Project / Stream'
      : category === 'personal'
      ? 'Area / Goal'
      : 'Facility / Plant';

  const sitePlaceholder =
    category === 'side_project'
      ? 'e.g. Mobile App MVP'
      : category === 'personal'
      ? 'e.g. Home Renovation'
      : 'e.g. Plant A';

  const titlePlaceholder =
    category === 'side_project'
      ? 'Type side project task (e.g. Complete Stripe webhook integration, Test beta build)...'
      : category === 'personal'
      ? 'Type personal goal or errand (e.g. Annual health checkup, Renew passport)...'
      : 'Type finding description (e.g. Eyewash inspection tag missing, Emergency exit door blocked)...';

  const dueLabel =
    category === 'side_project'
      ? '🔴 Milestone Due'
      : category === 'personal'
      ? '🔴 Target Deadline'
      : '🔴 Audit Due Date';

  const chaseLabel =
    category === 'side_project'
      ? '🔵 Next Follow-up'
      : category === 'personal'
      ? '🔵 Next Check-in'
      : '🔵 Next Chase Date';

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setManualError('Please enter a task or finding description.');
      return;
    }
    setManualError(null);
    setIsSubmitting(true);
    try {
      const defaultSite =
        category === 'side_project'
          ? 'Side Venture'
          : category === 'personal'
          ? 'Personal'
          : 'Main Facility';

      await createActionApi({
        title: title.trim(),
        site: site.trim() || defaultSite,
        owner: owner.trim() || (category === 'personal' ? 'Me' : 'Unassigned'),
        priority,
        status: 'Waiting on Site',
        due_date: dueDate || defaultDueDate(),
        next_follow_up: chaseDate || defaultChaseDate(),
        is_recurring: false,
        category,
        notes: '',
      });
      setTitle('');
      setOwner('');
      setPriority('P2');
      onSuccess();
    } catch (err: any) {
      setManualError(err.message || 'Failed to add item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAiExtract = async () => {
    if (!rawText.trim()) return;
    setIsAiParsing(true);
    setManualError(null);
    setAiSuccessCount(null);
    try {
      const parsedItems = await parseTextApi(rawText);
      if (parsedItems.length > 0) {
        await createBatchActionsApi(parsedItems);
        setAiSuccessCount(parsedItems.length);
        setRawText('');
        onSuccess();
        setTimeout(() => {
          setAiSuccessCount(null);
          setIsAiOpen(false);
        }, 1500);
      } else {
        setManualError('No distinct action items could be extracted. Please check text.');
      }
    } catch (err: any) {
      setManualError(err.message || 'AI extraction failed.');
    } finally {
      setIsAiParsing(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-xs space-y-3">
      {/* Header bar of Quick Add: Workspace Category Selector + AI Smart Paste */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Plus className="w-3.5 h-3.5 text-amber-600" />
            <span>Quick Entry:</span>
          </span>

          {/* Category Switcher Pills */}
          <div className="inline-flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
            <button
              type="button"
              onClick={() => {
                setCategory('work');
                setSite('Plant A');
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                category === 'work'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Briefcase className="w-3 h-3 text-amber-200" />
              <span>🏭 EHS Work</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCategory('side_project');
                setSite('AI SaaS Project');
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                category === 'side_project'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Rocket className="w-3 h-3 text-indigo-200" />
              <span>🚀 Side Project</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCategory('personal');
                setSite('Health & Home');
                setOwner('Me');
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                category === 'personal'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Heart className="w-3 h-3 text-emerald-200" />
              <span>🌱 Personal</span>
            </button>
          </div>
        </div>

        {/* AI Smart Paste Toggle Button */}
        <button
          type="button"
          onClick={() => setIsAiOpen((open) => !open)}
          className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
            isAiOpen
              ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
              : 'bg-stone-50 text-stone-700 hover:text-stone-900 border-stone-200 hover:bg-stone-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Paste Messy Notes / Email (AI)</span>
          {isAiOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* 2-Tier Structured Form with Generous Widths */}
      <form onSubmit={handleManualSubmit} className="space-y-2.5">
        {/* Tier 1: Action Description (Full width) */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={titlePlaceholder}
            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-200 transition-all font-medium"
          />
        </div>

        {/* Tier 2: Metadata Fields Grid (Site/Project, Owner, Due Date, Chase Date, Priority, Submit) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {/* Facility / Project */}
          <div>
            <label className="block text-[10px] text-stone-500 mb-0.5">{siteLabel}</label>
            <input
              type="text"
              list="quickadd-site-options"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              placeholder={sitePlaceholder}
              className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-md text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-amber-400"
            />
            <datalist id="quickadd-site-options">
              {sites.map((s) => (
                <option key={s} value={s} />
              ))}
              {category === 'work' && (
                <>
                  <option value="Plant A" />
                  <option value="Warehouse 2" />
                  <option value="Chemical Facility" />
                  <option value="Line 4" />
                </>
              )}
              {category === 'side_project' && (
                <>
                  <option value="AI Video SaaS MVP" />
                  <option value="Stripe Billing Module" />
                  <option value="Landing Page & Copy" />
                  <option value="Blog Content Engine" />
                </>
              )}
              {category === 'personal' && (
                <>
                  <option value="Health & Wellness" />
                  <option value="Home & Auto" />
                  <option value="Financial & Taxes" />
                  <option value="Family & Travel" />
                </>
              )}
            </datalist>
          </div>

          {/* Owner */}
          <div>
            <label className="block text-[10px] text-stone-500 mb-0.5">
              {category === 'personal' ? 'Assignee / Partner' : 'Responsible Owner'}
            </label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder={category === 'personal' ? 'e.g. Me / Family' : 'e.g. Sarah Chen'}
              className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-md text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-amber-400"
            />
          </div>

          {/* Due Date (🔴) */}
          <div>
            <label className="block text-[10px] font-bold text-rose-700 mb-0.5">{dueLabel}</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-2 py-1.5 font-mono text-xs bg-stone-50 border border-stone-200 rounded-md text-stone-800 focus:outline-none focus:bg-white focus:border-rose-400"
            />
          </div>

          {/* Chase Date (🔵) */}
          <div>
            <label className="block text-[10px] font-bold text-sky-700 mb-0.5">{chaseLabel}</label>
            <input
              type="date"
              value={chaseDate}
              onChange={(e) => setChaseDate(e.target.value)}
              className="w-full px-2 py-1.5 font-mono text-xs bg-stone-50 border border-stone-200 rounded-md text-stone-800 focus:outline-none focus:bg-white focus:border-sky-400"
            />
          </div>

          {/* Priority Toggle */}
          <div>
            <label className="block text-[10px] text-stone-500 mb-0.5">Priority</label>
            <button
              type="button"
              onClick={() => setPriority((p) => (p === 'P1' ? 'P2' : 'P1'))}
              className={`w-full py-1.5 text-xs font-bold rounded-md border transition-colors flex items-center justify-center gap-1 ${
                priority === 'P1'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              {priority === 'P1' ? (
                <>
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>P1 Urgent</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>P2 Routine</span>
                </>
              )}
            </button>
          </div>

          {/* Add Button */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-1.5 px-3 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Action</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {manualError && (
        <div className="text-xs text-rose-600 flex items-center gap-1.5 px-1 pt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{manualError}</span>
        </div>
      )}

      {/* Collapsible Smart Paste Drawer */}
      {isAiOpen && (
        <div className="pt-3 border-t border-stone-200 space-y-2.5 animate-in fade-in duration-150 bg-stone-50/70 p-3.5 rounded-xl border">
          <div className="flex items-center justify-between text-xs text-stone-700 flex-wrap gap-2">
            <span className="font-semibold text-stone-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Paste Raw Notes, Sprint Standup, or Inspection Thread:
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={() =>
                  setRawText(
                    'Plant A: Secondary containment valve on Tank 4 leaking, Mike Ramirez to repair by Nov 15. Also exit corridor blocked by skids in Warehouse 2, Sarah Chen owner.'
                  )
                }
                className="text-stone-500 hover:text-amber-800 underline"
              >
                Sample EHS Audit
              </button>
              <span className="text-stone-300">·</span>
              <button
                type="button"
                onClick={() =>
                  setRawText(
                    'Side Project MVP: Finalize Stripe checkout flow with Dave Chen by next Tuesday. Redesign pricing cards for mobile by Nov 20. Personal: Schedule routine dentist cleaning for next month.'
                  )
                }
                className="text-stone-500 hover:text-indigo-800 underline"
              >
                Sample Multi-Project Notes
              </button>
            </div>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste text here... Gemini automatically categorizes items into EHS Work, Side Projects, and Personal Life, extracting titles, dates, owners, and recurrence."
            rows={3}
            className="w-full p-2.5 text-xs font-mono bg-white border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
          />

          <div className="flex items-center justify-between flex-wrap gap-2">
            {aiSuccessCount ? (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Extracted and added {aiSuccessCount} items to your radar!</span>
              </span>
            ) : (
              <span className="text-[11px] text-stone-500">
                Supports multi-item notes, meeting action items, and tab-separated spreadsheets.
              </span>
            )}

            <button
              type="button"
              onClick={handleAiExtract}
              disabled={isAiParsing || !rawText.trim()}
              className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isAiParsing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Extract & Add to Radar</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
