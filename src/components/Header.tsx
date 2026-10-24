import React from 'react';
import { ViewTab } from '../types';
import { ShieldAlert, Sparkles, Calendar, RotateCcw, Download, CheckCircle2, Flame, BellRing, Target } from 'lucide-react';

interface HeaderProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  onOpenIngest: () => void;
  onOpenIcsModal: () => void;
  onResetDemo: () => void;
  totalActive: number;
  focusCount: number;
  p1Count: number;
  ghostedCount: number;
  doneCount: number;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenIngest,
  onOpenIcsModal,
  onResetDemo,
  totalActive,
  focusCount,
  p1Count,
  ghostedCount,
  doneCount,
  isResetting,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
      {/* Top Bar Contract (1 row, 3 zones) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              EHS ACTION RADAR
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-semibold tracking-wider">
                V3.8 AI
              </span>
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('chase')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'chase'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-rose-400" />
            Chase Radar
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            Visual Calendar
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BellRing className="w-3.5 h-3.5 text-amber-400" />
            Site Ghosting Matrix
          </button>
        </nav>

        {/* Zone 3: Primary Action & Export */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenIcsModal}
            className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            title="Download iCalendar .ics feed"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Export .ics</span>
          </button>

          <button
            onClick={onOpenIngest}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm shadow-rose-900/40 border border-rose-500/50 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-200 animate-pulse" />
            <span>Smart Ingest</span>
          </button>
        </div>
      </div>

      {/* KPI & Metric Cadence Ribbon */}
      <div className="border-t border-slate-800/80 bg-slate-950/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between overflow-x-auto text-xs">
          <div className="flex items-center gap-4 sm:gap-6 shrink-0 font-medium">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-slate-500">Active Findings:</span>
              <span className="font-mono tabular-nums font-bold text-white text-sm">{totalActive}</span>
            </div>

            <div className="w-px h-3.5 bg-slate-800" />

            <div className="flex items-center gap-2 text-rose-400">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-slate-400">P1 Critical:</span>
              <span className="font-mono tabular-nums font-bold text-rose-300 text-sm">{p1Count}</span>
            </div>

            <div className="w-px h-3.5 bg-slate-800" />

            <div className="flex items-center gap-2 text-sky-400">
              <Target className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-slate-400">Focus Today:</span>
              <span className="font-mono tabular-nums font-bold text-sky-300 text-sm">{focusCount}</span>
            </div>

            <div className="w-px h-3.5 bg-slate-800" />

            <div className="flex items-center gap-2 text-amber-400">
              <span className="text-amber-500 font-bold">⚠️</span>
              <span className="text-slate-400">10+ Days Silent:</span>
              <span className="font-mono tabular-nums font-bold text-amber-300 text-sm">{ghostedCount}</span>
            </div>

            <div className="w-px h-3.5 bg-slate-800" />

            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-slate-400">Closed:</span>
              <span className="font-mono tabular-nums font-bold text-emerald-300 text-sm">{doneCount}</span>
            </div>
          </div>

          <button
            onClick={onResetDemo}
            disabled={isResetting}
            className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors ml-4 shrink-0"
            title="Reset to standard realistic EHS demo finding dataset"
          >
            <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
