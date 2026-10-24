import React from 'react';
import { ActionItem } from '../types';
import { isGhosted, matchesFocusMode } from '../lib/dateUtils';
import { MapPin, Flame, AlertTriangle, CheckCircle, ArrowRight, User } from 'lucide-react';

interface SiteMatrixViewProps {
  actions: ActionItem[];
  onSelectSiteFilter: (site: string) => void;
}

export const SiteMatrixView: React.FC<SiteMatrixViewProps> = ({
  actions,
  onSelectSiteFilter,
}) => {
  // Group actions by site
  const siteMap = new Map<
    string,
    {
      total: number;
      active: number;
      done: number;
      p1: number;
      ghosted: number;
      focus: number;
      owners: Set<string>;
    }
  >();

  for (const action of actions) {
    const siteKey = action.site || 'Unknown Site';
    const entry = siteMap.get(siteKey) || {
      total: 0,
      active: 0,
      done: 0,
      p1: 0,
      ghosted: 0,
      focus: 0,
      owners: new Set<string>(),
    };

    entry.total += 1;
    if (action.status === 'Done') {
      entry.done += 1;
    } else {
      entry.active += 1;
      if (action.priority === 'P1') entry.p1 += 1;
      if (isGhosted(action)) entry.ghosted += 1;
      if (matchesFocusMode(action)) entry.focus += 1;
    }
    if (action.owner) entry.owners.add(action.owner);

    siteMap.set(siteKey, entry);
  }

  const siteList = Array.from(siteMap.entries()).sort((a, b) => {
    // Sort by most ghosted or highest P1 count
    if (b[1].ghosted !== a[1].ghosted) return b[1].ghosted - a[1].ghosted;
    return b[1].p1 - a[1].p1;
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h2 className="text-base font-bold text-white tracking-tight">Facility Accountability Matrix</h2>
        <p className="text-xs text-slate-400 mt-1">
          Cross-site breakdown of open audit actions, response lag, and site lead ghosting rates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {siteList.map(([siteName, data]) => {
          const closureRate = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
          const hasGhosted = data.ghosted > 0;
          const hasP1 = data.p1 > 0;

          return (
            <div
              key={siteName}
              className={`rounded-xl border p-5 transition-all space-y-4 flex flex-col justify-between ${
                hasGhosted
                  ? 'bg-slate-900/90 border-amber-600/40 ring-1 ring-amber-500/20'
                  : hasP1
                  ? 'bg-slate-900/90 border-rose-900/40'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
                      <MapPin className="w-4 h-4 text-rose-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{siteName}</h3>
                  </div>

                  {hasGhosted && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/50 flex items-center gap-1 shrink-0">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      {data.ghosted} Ghosted
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-4">
                  <User className="w-3 h-3 text-slate-500" />
                  <span>Site Leads: {Array.from(data.owners).join(', ') || 'None'}</span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 mb-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Active</span>
                    <span className="font-mono font-bold text-slate-200 text-sm tabular-nums">
                      {data.active}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-400 block uppercase">P1 Critical</span>
                    <span className="font-mono font-bold text-rose-300 text-sm tabular-nums">
                      {data.p1}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-sky-400 block uppercase">Focus Today</span>
                    <span className="font-mono font-bold text-sky-300 text-sm tabular-nums">
                      {data.focus}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>Closure Rate</span>
                    <span className="font-semibold text-slate-200">{closureRate}% ({data.done}/{data.total})</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                      style={{ width: `${closureRate}%` }}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectSiteFilter(siteName)}
                className="w-full py-2 px-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 rounded-lg transition-colors flex items-center justify-center gap-1.5 mt-2"
              >
                <span>View {siteName} Findings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
