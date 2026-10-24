import React, { useState } from 'react';
import { ParsedFinding } from '../types';
import { parseTextApi, createBatchActionsApi } from '../lib/api';
import {
  X,
  Sparkles,
  FileText,
  Table,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Flame,
  Zap,
  Repeat,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface SmartIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SAMPLE_TEMPLATES = [
  {
    name: 'Audit Email Thread',
    icon: FileText,
    text: `From: compliance-audits@corp.net
Subject: Urgent: Findings from Plant A and Warehouse 2 Walkthrough

Hi Team,
During yesterday's walk with the regional safety auditor, we noted the following open non-conformances that need immediate resolution:

1. In Plant A Solvent Bay, the secondary containment valve on Tank 4 is leaking mineral spirits into the berm. Needs mechanical repair by Mike Ramirez. Due date is strict compliance deadline in 10 days. Also, this is the third time this valve has leaked this quarter.
2. In Warehouse 2, overhead emergency exit sign above loading dock 3 has a dead battery backup. Sarah Chen needs to have facilities replace the backup cell within 14 days.
3. In Quality Lab B, eye wash inspection log sheet was missing for October. David Patel must verify flow rate and stamp the physical tag by Friday.

Please chase the site leads and get confirmation once closed.`,
  },
  {
    name: 'Copied Excel Rows',
    icon: Table,
    text: `Finding Description\tFacility\tResponsible Owner\tSeverity\tTarget Date
Machine guard interlock bypassed on robotic cell 2\tPlant A - Line 1\tMike Ramirez\tCritical Audit Stopper\t2026-11-05
Combustible dust accumulation on ceiling beams\tWarehouse 2 - Sector B\tSarah Chen\tRoutine\t2026-11-20
Fire extinguisher #FE-12 inspection tag expired\tDistribution Center 1\tEmily Watson\tRoutine\t2026-11-15`,
  },
  {
    name: 'Field Inspection Punch List',
    icon: FileText,
    text: `Site Audit Notes - Chemical Facility Unit 3
- CRITICAL: Ammonia sensor A-12 past calibration by 45 days. Robert Vance is owner. Compliance deadline Nov 8. Check in with him tomorrow!
- Chemical spill kit missing universal absorbent pads in aisle 4. David Patel to restock by Nov 18.
- Hearing protection signage worn off and illegible at compressor room entrance. Carlos Gomez to re-apply vinyl sign.`,
  },
];

export const SmartIngestionModal: React.FC<SmartIngestionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedFinding[] | null>(null);

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!inputText.trim()) {
      setErrorMessage('Please paste or enter raw text to parse.');
      return;
    }
    setErrorMessage(null);
    setIsParsing(true);
    try {
      const results = await parseTextApi(inputText);
      setParsedItems(results);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to extract findings.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleItemChange = (index: number, field: keyof ParsedFinding, value: any) => {
    if (!parsedItems) return;
    const updated = [...parsedItems];
    updated[index] = { ...updated[index], [field]: value };
    setParsedItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (!parsedItems) return;
    setParsedItems(parsedItems.filter((_, i) => i !== index));
  };

  const handleAddNewItem = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const m2 = String(nextWeek.getMonth() + 1).padStart(2, '0');
    const d2 = String(nextWeek.getDate()).padStart(2, '0');
    const followStr = `${nextWeek.getFullYear()}-${m2}-${d2}`;

    const nextMonth = new Date(today);
    nextMonth.setDate(nextMonth.getDate() + 30);
    const m3 = String(nextMonth.getMonth() + 1).padStart(2, '0');
    const d3 = String(nextMonth.getDate()).padStart(2, '0');
    const dueStr = `${nextMonth.getFullYear()}-${m3}-${d3}`;

    setParsedItems([
      ...(parsedItems || []),
      {
        title: '',
        site: 'Main Facility',
        owner: 'Unassigned',
        priority: 'P2',
        due_date: dueStr,
        next_follow_up: followStr,
        is_recurring: false,
        notes: '',
      },
    ]);
  };

  const handleSaveAll = async () => {
    if (!parsedItems || parsedItems.length === 0) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await createBatchActionsApi(parsedItems);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save actions to database.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToInput = () => {
    setParsedItems(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Smart Ingestion Box</h3>
              <p className="text-xs text-slate-400">
                Extract structured findings, owners, dual dates, and recurrence checks with Gemini AI
              </p>
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
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!parsedItems ? (
            /* Phase 1: Input Box + Sample Quick Pastes */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Paste Messy Notes, Email Threads, or Copied Spreadsheet Rows:
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste raw email from auditor, site notes, or copied Excel rows here..."
                  rows={8}
                  className="w-full p-3 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all"
                />
              </div>

              {/* Sample Templates */}
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-2">Or load a sample test input:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SAMPLE_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => setInputText(tpl.text)}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors flex items-center gap-2 group"
                    >
                      <tpl.icon className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
                      <span className="text-xs font-medium text-slate-300 group-hover:text-white">{tpl.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Phase 2: Multi-Item Review Drawer */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    {parsedItems.length} Extracted Finding{parsedItems.length > 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-slate-400">Review & customize fields before saving to radar:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddNewItem}
                    className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-md flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                  <button
                    onClick={handleResetToInput}
                    className="text-xs text-slate-400 hover:text-slate-200 underline"
                  >
                    Edit Raw Text
                  </button>
                </div>
              </div>

              {/* List of candidate finding review cards */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {parsedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {/* Priority Toggle */}
                        <button
                          type="button"
                          onClick={() =>
                            handleItemChange(idx, 'priority', item.priority === 'P1' ? 'P2' : 'P1')
                          }
                          className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 border transition-colors ${
                            item.priority === 'P1'
                              ? 'bg-rose-950 text-rose-300 border-rose-600/60'
                              : 'bg-slate-800 text-sky-300 border-slate-700'
                          }`}
                        >
                          {item.priority === 'P1' ? (
                            <>
                              <Flame className="w-3 h-3 text-rose-500" />
                              <span>P1 Critical</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3 h-3 text-sky-400" />
                              <span>P2 Standard</span>
                            </>
                          )}
                        </button>

                        {/* Recurrence Toggle */}
                        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer ml-2">
                          <input
                            type="checkbox"
                            checked={item.is_recurring}
                            onChange={(e) => handleItemChange(idx, 'is_recurring', e.target.checked)}
                            className="rounded bg-slate-900 border-slate-700 text-rose-600 focus:ring-0"
                          />
                          <Repeat className="w-3 h-3 text-amber-400" />
                          <span>Recurring Finding</span>
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Remove candidate"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Finding Description (SMART Action):
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleItemChange(idx, 'title', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500/50"
                        placeholder="Action description..."
                      />
                    </div>

                    {/* Site, Owner, Dates Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Facility / Site:</label>
                        <input
                          type="text"
                          value={item.site}
                          onChange={(e) => handleItemChange(idx, 'site', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Owner / Lead:</label>
                        <input
                          type="text"
                          value={item.owner}
                          onChange={(e) => handleItemChange(idx, 'owner', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-rose-400 mb-1">🔴 Audit Due Date:</label>
                        <input
                          type="date"
                          value={item.due_date}
                          onChange={(e) => handleItemChange(idx, 'due_date', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-sky-400 mb-1">🔵 Next Chase Date:</label>
                        <input
                          type="date"
                          value={item.next_follow_up}
                          onChange={(e) => handleItemChange(idx, 'next_follow_up', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Context Notes:</label>
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                        className="w-full px-2.5 py-1 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-300"
                        placeholder="Additional details..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          {!parsedItems ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParse}
                disabled={isParsing || !inputText.trim()}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm border border-rose-500/50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Parsing with Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-rose-200" />
                    <span>⚡ Parse & Review</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleResetToInput}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                Back to Paste Box
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSaving || parsedItems.length === 0}
                className="px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm border border-emerald-500/50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to Radar...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save {parsedItems.length} Finding{parsedItems.length > 1 ? 's' : ''} to Radar</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
