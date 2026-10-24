import React from 'react';
import { ActionItem } from '../types';
import {
  getDaysInactive,
  isGhosted,
  getDueDateStatus,
  getFollowUpStatus,
} from '../lib/dateUtils';
import {
  Flame,
  Zap,
  Mail,
  Edit3,
  CheckCircle,
  RotateCcw,
  Clock,
  Calendar,
  AlertTriangle,
  Repeat,
  Trash2,
  MoreVertical,
  MapPin,
  User,
} from 'lucide-react';

interface ActionCardProps {
  action: ActionItem;
  onDraftNudge: (action: ActionItem) => void;
  onQuickUpdate: (action: ActionItem) => void;
  onEdit: (action: ActionItem) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (action: ActionItem) => void;
  onTogglePriority: (action: ActionItem) => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  action,
  onDraftNudge,
  onQuickUpdate,
  onEdit,
  onDelete,
  onToggleStatus,
  onTogglePriority,
}) => {
  const daysInactive = getDaysInactive(action.updated_at);
  const ghosted = isGhosted(action);
  const dueStatus = getDueDateStatus(action.due_date);
  const followStatus = getFollowUpStatus(action.next_follow_up);
  const isDone = action.status === 'Done';

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-150 p-4 sm:p-5 ${
        isDone
          ? 'bg-slate-900/40 border-slate-800/60 opacity-70'
          : ghosted
          ? 'bg-slate-900/90 border-amber-600/50 shadow-sm shadow-amber-950/20 ring-1 ring-amber-500/20'
          : action.priority === 'P1'
          ? 'bg-slate-900/90 border-rose-900/50 shadow-sm shadow-rose-950/20'
          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Header: Priority Badge + Ghosting Warning + Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {/* Priority Toggle Flag */}
          <button
            onClick={() => onTogglePriority(action)}
            title="Click to toggle priority between P1 Critical and P2 Routine"
            className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors border ${
              action.priority === 'P1'
                ? 'bg-rose-950 text-rose-300 border-rose-600/50 hover:bg-rose-900/80'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 text-sky-300'
            }`}
          >
            {action.priority === 'P1' ? (
              <>
                <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>P1 CRITICAL</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>P2 ROUTINE</span>
              </>
            )}
          </button>

          {/* Ghosting / Inactivity Badge */}
          {ghosted && (
            <span
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-950/90 text-amber-300 border border-amber-500/50 flex items-center gap-1.5 shadow-sm animate-pulse"
              title={`No updates logged in ${daysInactive} days while status is Waiting on Site.`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>⚠️ {daysInactive}+ days silent</span>
            </span>
          )}

          {/* Recurrence Flag */}
          {action.is_recurring && (
            <span className="text-[11px] font-medium text-amber-400/90 flex items-center gap-1 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/40">
              <Repeat className="w-3 h-3" />
              <span>Recurring</span>
            </span>
          )}
        </div>

        {/* Status Dropdown / Pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleStatus(action)}
            title="Click to advance status: Waiting on Site -> Under Review -> Done"
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              action.status === 'Done'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40'
                : action.status === 'Under Review'
                ? 'bg-sky-950/80 text-sky-300 border-sky-600/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            {action.status === 'Done' && <CheckCircle className="w-3 h-3 text-emerald-400" />}
            {action.status === 'Under Review' && <Clock className="w-3 h-3 text-sky-400" />}
            <span>{action.status}</span>
          </button>

          {/* Actions Menu */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(action)}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Edit finding"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(action.id)}
              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
              title="Delete finding"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Title & Description */}
      <h3
        className={`text-base font-semibold leading-snug mb-2 ${
          isDone ? 'line-through text-slate-400' : 'text-slate-100'
        }`}
      >
        {action.title}
      </h3>

      {/* Metadata Row: Site & Owner */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mb-3.5">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="font-medium text-slate-300">{action.site}</span>
        </div>
        <span className="text-slate-600">·</span>
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Owner: <strong className="text-slate-300 font-medium">{action.owner}</strong></span>
        </div>
        {!ghosted && daysInactive > 0 && action.status !== 'Done' && (
          <>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500 font-mono">Last update: {daysInactive}d ago</span>
          </>
        )}
      </div>

      {/* Two-Date Tracking System (Hard Compliance Deadline vs Chase Cadence) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs mb-3.5">
        {/* Date 1: Hard Due Date (🔴 Red) */}
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded bg-slate-900/60 border border-slate-800/60">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 shadow-sm shadow-rose-500/50" />
            <span className="text-slate-400">Audit Due:</span>
            <span className="font-mono tabular-nums text-slate-200 font-semibold">{action.due_date}</span>
          </div>
          <span
            className={`font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded ${
              dueStatus.isOverdue
                ? 'bg-rose-950 text-rose-300 border border-rose-600/50'
                : dueStatus.isToday
                ? 'bg-rose-950/60 text-rose-300'
                : 'text-slate-400'
            }`}
          >
            {dueStatus.label}
          </span>
        </div>

        {/* Date 2: Personal Follow-Up / Chase Date (🔵 Blue) */}
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded bg-slate-900/60 border border-slate-800/60">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0 shadow-sm shadow-sky-400/50" />
            <span className="text-slate-400">Next Chase:</span>
            <span className="font-mono tabular-nums text-slate-200 font-semibold">{action.next_follow_up}</span>
          </div>
          <span
            className={`font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded ${
              followStatus.isChaseToday
                ? 'bg-sky-950 text-sky-300 border border-sky-500/50 font-bold'
                : 'text-slate-400'
            }`}
          >
            {followStatus.label}
          </span>
        </div>
      </div>

      {/* Recent Notes Snippet */}
      {action.notes && (
        <div className="text-xs text-slate-400 bg-slate-950/40 rounded-lg p-2.5 border border-slate-800/50 mb-3.5 font-sans leading-relaxed line-clamp-2">
          <strong className="text-slate-300">Notes:</strong> {action.notes}
        </div>
      )}

      {/* Card Action Buttons (Nudge, Quick Update, Status) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
        <div className="flex items-center gap-2">
          {/* 1-Click Draft Nudge Email */}
          <button
            onClick={() => onDraftNudge(action)}
            disabled={isDone}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
              isDone
                ? 'bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed'
                : ghosted || followStatus.isChaseToday
                ? 'bg-rose-950/80 text-rose-200 border-rose-600/60 hover:bg-rose-900 shadow-sm'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-rose-400" />
            <span>Draft Nudge</span>
          </button>

          {/* Quick Update / Log Response */}
          <button
            onClick={() => onQuickUpdate(action)}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/70 hover:bg-slate-700 border border-slate-700/80 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Quick Update</span>
          </button>
        </div>

        {/* 1-Click Done Toggle */}
        <button
          onClick={() => onToggleStatus(action)}
          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            isDone
              ? 'text-amber-400 hover:text-amber-300 bg-slate-800/50'
              : 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-700/40 hover:bg-emerald-900/50'
          }`}
        >
          {isDone ? (
            <>
              <RotateCcw className="w-3 h-3" />
              <span>Reopen</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mark Done</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
