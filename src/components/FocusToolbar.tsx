import React from 'react';
import { FilterState } from '../types';
import { Search, Plus, X, SlidersHorizontal, Flame, Target } from 'lucide-react';

interface FocusToolbarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  sites: string[];
  totalFiltered: number;
  totalAll: number;
  focusCount: number;
  onOpenCreate: () => void;
}

export const FocusToolbar: React.FC<FocusToolbarProps> = ({
  filters,
  setFilters,
  sites,
  totalFiltered,
  totalAll,
  focusCount,
  onOpenCreate,
}) => {
  const toggleFocusMode = () => {
    setFilters((prev) => ({ ...prev, focusMode: !prev.focusMode }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, searchQuery: e.target.value }));
  };

  const clearSearch = () => {
    setFilters((prev) => ({ ...prev, searchQuery: '' }));
  };

  const handleSiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, site: e.target.value }));
  };

  const handlePriorityChange = (priority: FilterState['priority']) => {
    setFilters((prev) => ({ ...prev, priority }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, status: e.target.value as FilterState['status'] }));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
      {/* Top Row: Focus Mode Segmented Toggle + Manual Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Focus Mode Master Switch */}
        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              onClick={() => setFilters((prev) => ({ ...prev, focusMode: true }))}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${
                filters.focusMode
                  ? 'bg-rose-950/80 text-rose-200 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Target className={`w-3.5 h-3.5 ${filters.focusMode ? 'text-rose-400' : 'text-slate-500'}`} />
              <span>Focus Mode</span>
              <span className={`px-1.5 py-0.2 rounded text-[11px] font-mono ${filters.focusMode ? 'bg-rose-900/60 text-rose-200' : 'bg-slate-800 text-slate-400'}`}>
                {focusCount}
              </span>
            </button>

            <button
              onClick={() => setFilters((prev) => ({ ...prev, focusMode: false }))}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${
                !filters.focusMode
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>All Actions</span>
              <span className={`px-1.5 py-0.2 rounded text-[11px] font-mono ${!filters.focusMode ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {totalAll}
              </span>
            </button>
          </div>

          <span className="text-xs text-slate-500 hidden lg:inline">
            {filters.focusMode
              ? 'Showing P1 Critical items + items scheduled for follow-up today or earlier'
              : 'Showing all active and historical findings'}
          </span>
        </div>

        {/* Right side: Manual Action Button */}
        <button
          onClick={onOpenCreate}
          className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 text-slate-400" />
          <span>Manual Finding</span>
        </button>
      </div>

      {/* Bottom Filter Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-2 border-t border-slate-800/60">
        {/* Search Input */}
        <div className="lg:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={handleSearchChange}
            placeholder="Search finding, owner, equipment, site..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-colors"
          />
          {filters.searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Site Filter Dropdown */}
        <div className="lg:col-span-3">
          <select
            value={filters.site}
            onChange={handleSiteChange}
            aria-label="Filter by site facility"
            className="w-full py-2 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500/50 transition-colors"
          >
            <option value="ALL">All Facilities & Sites ({sites.length})</option>
            {sites.map((site) => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Segmented Button */}
        <div className="lg:col-span-2 flex items-center gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded-lg">
          <button
            onClick={() => handlePriorityChange('ALL')}
            className={`flex-1 py-1.5 text-[11px] font-medium rounded transition-colors ${
              filters.priority === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handlePriorityChange('P1')}
            className={`flex-1 py-1.5 text-[11px] font-medium rounded transition-colors flex items-center justify-center gap-1 ${
              filters.priority === 'P1'
                ? 'bg-rose-950 text-rose-300 border border-rose-600/40'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <Flame className="w-3 h-3 text-rose-500" />
            P1
          </button>
          <button
            onClick={() => handlePriorityChange('P2')}
            className={`flex-1 py-1.5 text-[11px] font-medium rounded transition-colors ${
              filters.priority === 'P2'
                ? 'bg-slate-800 text-sky-300 border border-sky-600/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            P2
          </button>
        </div>

        {/* Status Dropdown */}
        <div className="lg:col-span-2">
          <select
            value={filters.status}
            onChange={handleStatusChange}
            aria-label="Filter by action status"
            className="w-full py-2 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500/50 transition-colors"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active (Open)</option>
            <option value="Waiting on Site">Waiting on Site</option>
            <option value="Under Review">Under Review</option>
            <option value="Done">Done (Closed)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
