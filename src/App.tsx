import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ActionItem, WorkspaceTab, ActionCategory } from './types';
import {
  fetchActions,
  updateActionApi,
  deleteActionApi,
  resetDemoApi,
  downloadCalendarIcs,
} from './lib/api';
import {
  matchesFocusMode,
  isGhosted,
  getTodayDateString,
} from './lib/dateUtils';
import { InlineQuickAdd } from './components/InlineQuickAdd';
import { CompactActionRow } from './components/CompactActionRow';
import { MiniCalendar } from './components/MiniCalendar';
import { CadenceHorizonStrip } from './components/CadenceHorizonStrip';
import { KanbanBoard } from './components/KanbanBoard';
import { NudgeModal } from './components/NudgeModal';
import { QuickUpdateModal } from './components/QuickUpdateModal';
import { ActionModal } from './components/ActionModal';
import {
  ShieldAlert,
  Flame,
  Target,
  AlertTriangle,
  RotateCcw,
  Download,
  Search,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Calendar,
  Layers,
  MapPin,
  User,
  Clock,
  Briefcase,
  Rocket,
  Heart,
  Globe,
  LayoutList,
  Kanban,
} from 'lucide-react';

export default function App() {
  const todayStr = getTodayDateString();
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Top Workspace Tab state: 'all' | 'work' | 'side_project' | 'personal'
  const [workspace, setWorkspace] = useState<WorkspaceTab>('all');

  // Visualization View Mode: 'list' | 'kanban'
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Focus Mode toggle: Focus Today vs All Findings
  const [focusMode, setFocusMode] = useState(true);

  // Category Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState('ALL');
  const [selectedOwner, setSelectedOwner] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Grouping State: 'none' | 'category' | 'site' | 'owner' | 'priority' | 'status'
  const [groupBy, setGroupBy] = useState<'none' | 'category' | 'site' | 'owner' | 'priority' | 'status'>('none');

  // Selected date from horizon strip or calendar
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');

  // Calendar side panel visibility toggle
  const [showCalendarSidebar, setShowCalendarSidebar] = useState(true);

  // Modals state
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<ActionItem | null>(null);

  const [isNudgeOpen, setIsNudgeOpen] = useState(false);
  const [nudgeAction, setNudgeAction] = useState<ActionItem | null>(null);

  const [isQuickUpdateOpen, setIsQuickUpdateOpen] = useState(false);
  const [quickUpdateAction, setQuickUpdateAction] = useState<ActionItem | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchActions();
      setActions(data);
    } catch (err: any) {
      console.error('Failed to load actions:', err);
      setError(err.message || 'Could not load actions from database.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Distinct sites list
  const siteList = useMemo(() => {
    const set = new Set<string>();
    for (const a of actions) {
      if (a.site && a.site.trim()) set.add(a.site.trim());
    }
    return Array.from(set).sort();
  }, [actions]);

  // Distinct owners list
  const ownerList = useMemo(() => {
    const set = new Set<string>();
    for (const a of actions) {
      if (a.owner && a.owner.trim()) set.add(a.owner.trim());
    }
    return Array.from(set).sort();
  }, [actions]);

  // Overall key metrics
  const totalActive = useMemo(() => actions.filter((a) => a.status !== 'Done').length, [actions]);
  const p1Count = useMemo(() => actions.filter((a) => a.priority === 'P1' && a.status !== 'Done').length, [actions]);
  const focusCount = useMemo(() => actions.filter((a) => matchesFocusMode(a)).length, [actions]);
  const ghostedCount = useMemo(() => actions.filter((a) => isGhosted(a)).length, [actions]);

  // Workspace-specific counts
  const workCount = useMemo(() => actions.filter((a) => (a.category || 'work') === 'work').length, [actions]);
  const sideProjectCount = useMemo(() => actions.filter((a) => a.category === 'side_project').length, [actions]);
  const personalCount = useMemo(() => actions.filter((a) => a.category === 'personal').length, [actions]);

  // Filtered actions list
  const filteredActions = useMemo(() => {
    return actions.filter((item) => {
      // 1. Workspace Tab Isolation
      const itemCategory = item.category || 'work';
      if (workspace !== 'all' && itemCategory !== workspace) {
        return false;
      }

      // 2. Explicit Date Filter from Horizon Strip or Calendar
      if (selectedDateFilter) {
        const matchesDue = item.due_date === selectedDateFilter;
        const matchesFollow = item.next_follow_up === selectedDateFilter;
        if (!matchesDue && !matchesFollow) return false;
      } else if (focusMode && !matchesFocusMode(item)) {
        // 3. Focus Mode (only if no specific date is selected)
        return false;
      }

      // 4. Category Filter: Site / Project
      if (selectedSite !== 'ALL' && item.site !== selectedSite) {
        return false;
      }

      // 5. Category Filter: Owner
      if (selectedOwner !== 'ALL' && item.owner !== selectedOwner) {
        return false;
      }

      // 6. Category Filter: Priority
      if (selectedPriority !== 'ALL' && item.priority !== selectedPriority) {
        return false;
      }

      // 7. Category Filter: Status (Only apply in List View; Kanban displays all columns)
      if (viewMode === 'list') {
        if (selectedStatus === 'ACTIVE' && item.status === 'Done') {
          return false;
        }
        if (selectedStatus !== 'ALL' && selectedStatus !== 'ACTIVE' && item.status !== selectedStatus) {
          return false;
        }
      }

      // 8. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesOwner = item.owner.toLowerCase().includes(q);
        const matchesSite = item.site.toLowerCase().includes(q);
        const matchesNotes = (item.notes || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesOwner && !matchesSite && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [actions, workspace, focusMode, selectedSite, selectedOwner, selectedPriority, selectedStatus, searchQuery, selectedDateFilter, viewMode]);

  // Grouped actions map
  const groupedActions = useMemo(() => {
    if (groupBy === 'none') return null;

    const map = new Map<string, ActionItem[]>();
    for (const item of filteredActions) {
      let key = 'Other';
      if (groupBy === 'category') {
        const cat = item.category || 'work';
        key = cat === 'side_project' ? '🚀 Side Projects' : cat === 'personal' ? '🌱 Personal & Life' : '🏭 EHS Work Compliance';
      } else if (groupBy === 'site') {
        key = item.site || 'General';
      } else if (groupBy === 'owner') {
        key = item.owner || 'Unassigned';
      } else if (groupBy === 'priority') {
        key = item.priority === 'P1' ? 'P1 Urgent' : 'P2 Routine';
      } else if (groupBy === 'status') {
        key = item.status;
      }

      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    }

    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredActions, groupBy]);

  const hasActiveFilters =
    selectedSite !== 'ALL' ||
    selectedOwner !== 'ALL' ||
    selectedPriority !== 'ALL' ||
    (viewMode === 'list' && selectedStatus !== 'ALL') ||
    searchQuery.trim() !== '' ||
    selectedDateFilter !== '';

  const clearAllFilters = () => {
    setSelectedSite('ALL');
    setSelectedOwner('ALL');
    setSelectedPriority('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
    setSelectedDateFilter('');
  };

  // Actions handlers
  const handleTogglePriority = async (action: ActionItem) => {
    const newPriority = action.priority === 'P1' ? 'P2' : 'P1';
    setActions((prev) =>
      prev.map((a) => (a.id === action.id ? { ...a, priority: newPriority } : a))
    );
    try {
      await updateActionApi(action.id, { priority: newPriority });
    } catch (err: any) {
      console.error('Failed to toggle priority:', err);
      loadData();
    }
  };

  const handleToggleStatus = async (action: ActionItem) => {
    const nextStatus = action.status === 'Done' ? 'Waiting on Site' : 'Done';
    setActions((prev) =>
      prev.map((a) => (a.id === action.id ? { ...a, status: nextStatus } : a))
    );
    try {
      await updateActionApi(action.id, { status: nextStatus });
    } catch (err: any) {
      console.error('Failed to toggle status:', err);
      loadData();
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: ActionItem['status']) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    try {
      await updateActionApi(id, { status: newStatus });
    } catch (err: any) {
      console.error('Failed to update status:', err);
      loadData();
    }
  };

  const handleDeleteAction = async (id: number) => {
    if (!window.confirm('Delete this action item?')) return;
    setActions((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteActionApi(id);
    } catch (err: any) {
      console.error('Failed to delete action:', err);
      loadData();
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset database with clean sample findings, side projects, and personal tasks?')) return;
    setIsResetting(true);
    try {
      const fresh = await resetDemoApi();
      setActions(fresh);
      setSelectedDateFilter('');
      clearAllFilters();
    } catch (err: any) {
      alert(err.message || 'Failed to reset demo data.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-stone-800 flex flex-col font-sans">
      {/* 1. Top Header (Brand + Key Metrics + Focus Mode + View Mode + Controls) */}
      <header className="border-b border-stone-200/90 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Brand & Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-400 to-indigo-500 p-0.5 shadow-xs">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center text-amber-600">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-stone-900 flex items-center gap-1.5">
                Action Tracker
              </span>
              <p className="text-[11px] text-stone-500">Your calm space for compliance, creative ventures & life</p>
            </div>
          </div>

          {/* 3 Key Stats (One-page glance) */}
          <div className="flex items-center gap-3 bg-stone-50 px-3.5 py-1.5 rounded-xl border border-stone-200 text-xs shadow-xs">
            <div className="flex items-center gap-1.5 text-rose-700 font-semibold" title="Urgent / Critical Actions">
              <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Urgent:</span>
              <span className="font-mono tabular-nums px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold">{p1Count}</span>
            </div>

            <div className="w-px h-3.5 bg-stone-200" />

            <div className="flex items-center gap-1.5 text-sky-700 font-semibold" title="Actions Needing Follow-up Today">
              <Target className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span>Chase Today:</span>
              <span className="font-mono tabular-nums px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-bold">{focusCount}</span>
            </div>

            <div className="w-px h-3.5 bg-stone-200" />

            <div className="flex items-center gap-1.5 text-amber-800 font-semibold" title="No updates in 10+ days">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Silent &gt;10d:</span>
              <span className="font-mono tabular-nums px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold">{ghostedCount}</span>
            </div>
          </div>

          {/* Focus Mode & View Controls */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* View Mode Toggle: List vs Kanban Board */}
            <div className="inline-flex p-0.5 bg-stone-100 border border-stone-200 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                  viewMode === 'list'
                    ? 'bg-white text-stone-900 border border-stone-200/90 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
                title="List View"
              >
                <LayoutList className="w-3.5 h-3.5 text-sky-600" />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`px-2.5 py-1 font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                  viewMode === 'kanban'
                    ? 'bg-white text-stone-900 border border-stone-200/90 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Kanban Board View (Drag-and-drop by status)"
              >
                <Kanban className="w-3.5 h-3.5 text-indigo-600" />
                <span>Kanban</span>
              </button>
            </div>

            {/* Focus Mode Toggle */}
            <div className="inline-flex p-0.5 bg-stone-100 border border-stone-200 rounded-lg text-xs">
              <button
                onClick={() => {
                  setFocusMode(true);
                  setSelectedDateFilter('');
                }}
                className={`px-2.5 py-1 font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                  focusMode && !selectedDateFilter
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Filter to high-urgency actions (Urgent or due for follow-up today)"
              >
                <Target className="w-3 h-3 text-white" />
                <span className="hidden sm:inline">Focus Today ({focusCount})</span>
                <span className="sm:hidden">Focus ({focusCount})</span>
              </button>
              <button
                onClick={() => {
                  setFocusMode(false);
                  setSelectedDateFilter('');
                }}
                className={`px-2.5 py-1 font-semibold rounded-md transition-colors ${
                  !focusMode && !selectedDateFilter
                    ? 'bg-white text-stone-900 border border-stone-200/90 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
                title="View all open and closed items across all workspaces"
              >
                <span className="hidden sm:inline">All Items ({actions.length})</span>
                <span className="sm:hidden">All ({actions.length})</span>
              </button>
            </div>

            {/* Toggle Calendar Sidebar */}
            <button
              onClick={() => setShowCalendarSidebar((v) => !v)}
              className={`p-1.5 sm:px-2.5 sm:py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                showCalendarSidebar
                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                  : 'bg-stone-100 text-stone-600 border-stone-200 hover:text-stone-900'
              }`}
              title="Toggle calendar sidebar visibility"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">
                {showCalendarSidebar ? 'Calendar' : 'Show Cal'}
              </span>
            </button>

            {/* Export .ics */}
            <button
              onClick={downloadCalendarIcs}
              className="p-1.5 sm:px-2.5 sm:py-1 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg transition-colors flex items-center gap-1"
              title="Download Outlook/Google/Apple calendar feed"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">.ics</span>
            </button>

            {/* Reset Demo */}
            <button
              onClick={handleResetDemo}
              disabled={isResetting}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded transition-colors"
              title="Reset sample findings and projects"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Top Workspace Tabs Navigation Bar */}
        <div className="border-t border-stone-200/70 bg-white/60 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto py-1.5">
            <button
              onClick={() => setWorkspace('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shrink-0 ${
                workspace === 'all'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>All Unified</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                workspace === 'all' ? 'bg-stone-800 text-stone-200' : 'bg-stone-200 text-stone-700'
              }`}>
                {actions.length}
              </span>
            </button>

            <button
              onClick={() => setWorkspace('work')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shrink-0 ${
                workspace === 'work'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-600 hover:text-amber-900 hover:bg-amber-50'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-amber-200" />
              <span>🏭 EHS Work</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                workspace === 'work' ? 'bg-amber-600 text-white' : 'bg-stone-200 text-stone-700'
              }`}>
                {workCount}
              </span>
            </button>

            <button
              onClick={() => setWorkspace('side_project')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shrink-0 ${
                workspace === 'side_project'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-indigo-900 hover:bg-indigo-50'
              }`}
            >
              <Rocket className="w-3.5 h-3.5 text-indigo-200" />
              <span>🚀 Side Projects</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                workspace === 'side_project' ? 'bg-indigo-700 text-white' : 'bg-stone-200 text-stone-700'
              }`}>
                {sideProjectCount}
              </span>
            </button>

            <button
              onClick={() => setWorkspace('personal')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shrink-0 ${
                workspace === 'personal'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-emerald-900 hover:bg-emerald-50'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-emerald-200" />
              <span>🌱 Personal / Life</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                workspace === 'personal' ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-700'
              }`}>
                {personalCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main One-Page Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadData}
              className="px-2.5 py-1 text-xs bg-rose-600 text-white rounded-md font-semibold hover:bg-rose-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* 7-Day Cadence Horizon Strip: Instant Week-at-a-Glance */}
        <CadenceHorizonStrip
          actions={filteredActions}
          selectedDate={selectedDateFilter}
          onSelectDate={(d) => setSelectedDateFilter(d)}
          onClearDateFilter={() => setSelectedDateFilter('')}
        />

        {/* Inline Quick Add + AI Smart Paste bar (Adapts to active workspace) */}
        <InlineQuickAdd
          onSuccess={loadData}
          sites={siteList}
          activeWorkspace={workspace}
        />

        {/* Enhanced Category Filtering & Grouping Toolbar */}
        <div className="bg-white border border-stone-200/90 rounded-xl p-3 shadow-xs space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search description, project name, owner, notes..."
                className="w-full pl-8 pr-7 py-1 text-xs bg-stone-50 border border-stone-200 rounded-md text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter 1: Site / Project */}
            <div className="flex items-center gap-1.5 bg-stone-50 px-2 py-1 rounded-md border border-stone-200">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                aria-label="Filter by project or site"
                className="bg-transparent text-stone-800 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Contexts / Sites ({siteList.length})</option>
                {siteList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 2: Responsible Owner */}
            <div className="flex items-center gap-1.5 bg-stone-50 px-2 py-1 rounded-md border border-stone-200">
              <User className="w-3.5 h-3.5 text-sky-600" />
              <select
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
                aria-label="Filter by responsible owner"
                className="bg-transparent text-stone-800 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Owners / Leads ({ownerList.length})</option>
                {ownerList.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 3: Priority */}
            <div className="flex items-center gap-1.5 bg-stone-50 px-2 py-1 rounded-md border border-stone-200">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                aria-label="Filter by priority"
                className="bg-transparent text-stone-800 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Priorities</option>
                <option value="P1">P1 Urgent Only</option>
                <option value="P2">P2 Routine Only</option>
              </select>
            </div>

            {/* Filter 4: Status (Only applicable in List View; Kanban displays status in columns) */}
            {viewMode === 'list' && (
              <div className="flex items-center gap-1.5 bg-stone-50 px-2 py-1 rounded-md border border-stone-200">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  aria-label="Filter by status"
                  className="bg-transparent text-stone-800 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active (Open)</option>
                  <option value="Waiting on Site">Waiting / In Progress</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Done">Done (Closed)</option>
                </select>
              </div>
            )}

            {/* Group By Selector (Only in List View) */}
            {viewMode === 'list' ? (
              <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-md border border-stone-200">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-stone-500 text-[11px]">Group by:</span>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as any)}
                  aria-label="Group findings by category"
                  className="bg-transparent text-stone-800 text-xs focus:outline-none cursor-pointer font-medium"
                >
                  <option value="none">None (List)</option>
                  <option value="category">By Workspace Category</option>
                  <option value="site">By Project / Site</option>
                  <option value="owner">By Owner / Lead</option>
                  <option value="priority">By Priority (P1/P2)</option>
                  <option value="status">By Status</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-md border border-stone-200 text-stone-600 text-[11px]">
                <Kanban className="w-3.5 h-3.5 text-indigo-600" />
                <span>Columns: Drag & drop to change status</span>
              </div>
            )}
          </div>

          {/* Active Filter Indicators & Clear Filter */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono text-stone-500">
                Showing <strong className="text-stone-800 font-semibold">{filteredActions.length}</strong> of{' '}
                <strong className="text-stone-800 font-semibold">{actions.length}</strong> items
                {viewMode === 'kanban' && <span className="text-indigo-600 ml-1.5 font-sans font-medium">(Kanban Board)</span>}
              </span>

              {workspace !== 'all' && (
                <span className="text-[10px] bg-stone-100 text-stone-800 px-2 py-0.5 rounded-md border border-stone-200 flex items-center gap-1 font-medium">
                  <span>Workspace: {workspace === 'work' ? 'EHS Work' : workspace === 'side_project' ? 'Side Projects' : 'Personal'}</span>
                  <button onClick={() => setWorkspace('all')}>
                    <X className="w-3 h-3 text-stone-500 hover:text-stone-900" />
                  </button>
                </span>
              )}

              {selectedDateFilter && (
                <span className="text-[10px] font-mono bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1 font-semibold">
                  <span>Date: {selectedDateFilter}</span>
                  <button onClick={() => setSelectedDateFilter('')}>
                    <X className="w-3 h-3 text-stone-500 hover:text-stone-900" />
                  </button>
                </span>
              )}

              {selectedSite !== 'ALL' && (
                <span className="text-[10px] bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1 font-medium">
                  <span>Context: {selectedSite}</span>
                  <button onClick={() => setSelectedSite('ALL')}>
                    <X className="w-3 h-3 text-stone-500 hover:text-stone-900" />
                  </button>
                </span>
              )}

              {selectedOwner !== 'ALL' && (
                <span className="text-[10px] bg-sky-50 text-sky-900 px-2 py-0.5 rounded-md border border-sky-200 flex items-center gap-1 font-medium">
                  <span>Owner: {selectedOwner}</span>
                  <button onClick={() => setSelectedOwner('ALL')}>
                    <X className="w-3 h-3 text-stone-500 hover:text-stone-900" />
                  </button>
                </span>
              )}

              {selectedPriority !== 'ALL' && (
                <span className="text-[10px] bg-stone-100 text-stone-800 px-2 py-0.5 rounded-md border border-stone-200 flex items-center gap-1 font-medium">
                  <span>Priority: {selectedPriority}</span>
                  <button onClick={() => setSelectedPriority('ALL')}>
                    <X className="w-3 h-3 text-stone-500 hover:text-stone-900" />
                  </button>
                </span>
              )}

              {viewMode === 'list' && selectedStatus !== 'ALL' && (
                <span className="text-[10px] bg-stone-100 text-stone-800 px-2 py-0.5 rounded-md border border-stone-200 flex items-center gap-1 font-medium">
                  <span>Status: {selectedStatus}</span>
                  <button onClick={() => setSelectedStatus('ALL')}>
                    <X className="w-3 h-3 text-stone-500 hover:text-stone-900" />
                  </button>
                </span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold underline shrink-0 ml-2"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Grid: Action List / Kanban Board + Sticky Calendar Sidebar */}
        <div
          className={`grid gap-5 items-start ${
            showCalendarSidebar ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
          }`}
        >
          {/* Main Visual Content (List View or Kanban Board) */}
          <div
            className={
              showCalendarSidebar ? 'lg:col-span-7 xl:col-span-8 space-y-3' : 'w-full space-y-3'
            }
          >
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center text-stone-400 text-xs space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <span>Loading radar items...</span>
              </div>
            ) : filteredActions.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-white border border-stone-200/90 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h4 className="text-sm font-bold text-stone-800">Clear Skies! No items waiting right now</h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  {hasActiveFilters
                    ? 'Try clearing one of your filters to see more items.'
                    : focusMode
                    ? 'All high-urgency items or actions due today are completely up to date. Great work!'
                    : 'No items recorded yet in this workspace. Feel free to add your first one above.'}
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg transition-colors"
                    >
                      Clear All Filters
                    </button>
                  )}
                  {focusMode && (
                    <button
                      onClick={() => setFocusMode(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-xs"
                    >
                      Show All ({actions.length}) Items
                    </button>
                  )}
                </div>
              </div>
            ) : viewMode === 'kanban' ? (
              /* Kanban Board View with 3 Status Columns and Drag-and-Drop */
              <KanbanBoard
                actions={filteredActions}
                onUpdateStatus={handleUpdateStatus}
                onDraftNudge={(act) => {
                  setNudgeAction(act);
                  setIsNudgeOpen(true);
                }}
                onQuickUpdate={(act) => {
                  setQuickUpdateAction(act);
                  setIsQuickUpdateOpen(true);
                }}
                onEdit={(act) => {
                  setEditingAction(act);
                  setIsActionModalOpen(true);
                }}
                onDelete={handleDeleteAction}
                onTogglePriority={handleTogglePriority}
              />
            ) : groupBy !== 'none' && groupedActions ? (
              /* Grouped Categorical Sections List View */
              <div className="space-y-5">
                {groupedActions.map(([groupName, items]) => (
                  <div key={groupName} className="space-y-2.5">
                    {/* Category Group Header Banner */}
                    <div className="flex items-center justify-between py-2 px-3.5 bg-stone-100/80 rounded-lg border border-stone-200">
                      <div className="flex items-center gap-2">
                        {groupBy === 'category' && <Layers className="w-4 h-4 text-indigo-600" />}
                        {groupBy === 'site' && <MapPin className="w-4 h-4 text-rose-500" />}
                        {groupBy === 'owner' && <User className="w-4 h-4 text-sky-600" />}
                        {groupBy === 'priority' && <Flame className="w-4 h-4 text-rose-500" />}
                        {groupBy === 'status' && <Clock className="w-4 h-4 text-emerald-600" />}
                        <span className="text-sm font-bold text-stone-800 tracking-tight">{groupName}</span>
                      </div>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-white text-stone-700 border border-stone-200">
                        {items.length} item{items.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {/* Action Cards in this Group */}
                    <div className="space-y-3">
                      {items.map((action) => (
                        <CompactActionRow
                          key={action.id}
                          action={action}
                          onDraftNudge={(act) => {
                            setNudgeAction(act);
                            setIsNudgeOpen(true);
                          }}
                          onQuickUpdate={(act) => {
                            setQuickUpdateAction(act);
                            setIsQuickUpdateOpen(true);
                          }}
                          onEdit={(act) => {
                            setEditingAction(act);
                            setIsActionModalOpen(true);
                          }}
                          onDelete={handleDeleteAction}
                          onToggleStatus={handleToggleStatus}
                          onTogglePriority={handleTogglePriority}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Flat List View */
              <div className="space-y-3">
                {filteredActions.map((action) => (
                  <CompactActionRow
                    key={action.id}
                    action={action}
                    onDraftNudge={(act) => {
                      setNudgeAction(act);
                      setIsNudgeOpen(true);
                    }}
                    onQuickUpdate={(act) => {
                      setQuickUpdateAction(act);
                      setIsQuickUpdateOpen(true);
                    }}
                    onEdit={(act) => {
                      setEditingAction(act);
                      setIsActionModalOpen(true);
                    }}
                    onDelete={handleDeleteAction}
                    onToggleStatus={handleToggleStatus}
                    onTogglePriority={handleTogglePriority}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Sticky Mini Calendar & Day Schedule */}
          {showCalendarSidebar && (
            <div className="lg:col-span-5 xl:col-span-4 sticky top-20 space-y-4">
              <MiniCalendar
                actions={actions}
                selectedDate={selectedDateFilter || todayStr}
                onSelectDate={(d) => setSelectedDateFilter(d)}
                onDraftNudge={(act) => {
                  setNudgeAction(act);
                  setIsNudgeOpen(true);
                }}
                onQuickUpdate={(act) => {
                  setQuickUpdateAction(act);
                  setIsQuickUpdateOpen(true);
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Modals for Nudge, Quick Update, and Full Edit */}
      <NudgeModal
        action={nudgeAction}
        isOpen={isNudgeOpen}
        onClose={() => {
          setIsNudgeOpen(false);
          setNudgeAction(null);
        }}
        onSuccess={loadData}
      />

      <QuickUpdateModal
        action={quickUpdateAction}
        isOpen={isQuickUpdateOpen}
        onClose={() => {
          setIsQuickUpdateOpen(false);
          setQuickUpdateAction(null);
        }}
        onSuccess={loadData}
      />

      <ActionModal
        action={editingAction}
        isOpen={isActionModalOpen}
        onClose={() => {
          setIsActionModalOpen(false);
          setEditingAction(null);
        }}
        onSuccess={loadData}
      />
    </div>
  );
}
