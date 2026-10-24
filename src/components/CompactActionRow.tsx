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
  Clock,
  CheckCircle,
  RotateCcw,
  AlertTriangle,
  Repeat,
  Trash2,
  Edit2,
  MapPin,
  User,
  Briefcase,
  Rocket,
  Heart,
} from 'lucide-react';

interface CompactActionRowProps {
  action: ActionItem;
  onDraftNudge: (action: ActionItem) => void;
  onQuickUpdate: (action: ActionItem) => void;
  onEdit: (action: ActionItem) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (action: ActionItem) => void;
  onTogglePriority: (action: ActionItem) => void;
}

export const CompactActionRow: React.FC<CompactActionRowProps> = ({
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

  const category = action.category || 'work';

  // Category visual cues
  const categoryBadge =
    category === 'side_project' ? (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-50 text-violet-800 border border-violet-200 flex items-center gap-1">
        <Rocket className="w-3 h-3 text-violet-600" />
        <span>Side Project</span>
      </span>
    ) : category === 'personal' ? (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
        <Heart className="w-3 h-3 text-emerald-600" />
        <span>Personal</span>
      </span>
    ) : (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
        <Briefcase className="w-3 h-3 text-amber-700" />
        <span>EHS Work</span>
      </span>
    );

  // Adaptive location/context icon
  const ContextIcon =
    category === 'side_project' ? Rocket : category === 'personal' ? Heart : MapPin;
  const contextIconColor =
    category === 'side_project' ? 'text-violet-600' : category === 'personal' ? 'text-emerald-600' : 'text-amber-700';

  // Adaptive date labels
  const dueLabel =
    category === 'side_project' ? 'Milestone Due:' : category === 'personal' ? 'Target Due:' : 'Audit Due:';
  const chaseLabel =
    category === 'side_project' ? 'Next Follow-up:' : category === 'personal' ? 'Next Check-in:' : 'Next Chase:';

  const nudgeButtonLabel =
    category === 'side_project' ? 'Ping Collaborator' : category === 'personal' ? 'Draft Reminder' : 'Draft Nudge Email';

  return (
    <div
      className={`rounded-xl border transition-all p-4 space-y-3 overflow-hidden shadow-xs ${
        isDone
          ? 'bg-stone-50/70 border-stone-200/60 opacity-60'
          : ghosted
          ? 'bg-amber-50/30 border-amber-300 ring-1 ring-amber-300/40 hover:shadow-md'
          : action.priority === 'P1'
          ? 'bg-white border-rose-200 hover:border-rose-300 hover:shadow-md'
          : 'bg-white border-stone-200 hover:border-amber-300 hover:shadow-md'
      }`}
    >
      {/* 1. Card Top Bar: Priority Badge + Category Badge + Inactivity / Recurrence Badges + Edit/Delete */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority Toggle Badge */}
          <button
            onClick={() => onTogglePriority(action)}
            title="Click to toggle priority: P1 Urgent vs P2 Routine"
            className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 border transition-colors ${
              action.priority === 'P1'
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
            }`}
          >
            {action.priority === 'P1' ? (
              <>
                <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>P1 URGENT</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>P2 ROUTINE</span>
              </>
            )}
          </button>

          {/* Category Badge */}
          {categoryBadge}

          {/* Ghosting Alert Badge */}
          {ghosted && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1"
              title={`No updates logged in ${daysInactive} days.`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{daysInactive}d silent</span>
            </span>
          )}

          {/* Recurrence Badge */}
          {action.is_recurring && (
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200 flex items-center gap-1"
              title="Recurring Issue"
            >
              <Repeat className="w-3 h-3 text-stone-500" />
              <span>Recurring</span>
            </span>
          )}
        </div>

        {/* Top-Right Quick Utility Icons */}
        <div className="flex items-center gap-1 text-stone-400 ml-auto">
          <button
            onClick={() => onEdit(action)}
            className="p-1 hover:text-stone-800 hover:bg-stone-100 rounded-md transition-colors"
            title="Edit item"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(action.id)}
            className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            title="Delete item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Card Main Body: 100% Full-Width Finding/Task Title (Unconstrained, zero crowding) */}
      <div className="space-y-1.5">
        <h3
          className={`text-base font-bold tracking-tight leading-snug ${
            isDone ? 'line-through text-stone-400' : 'text-stone-900'
          }`}
        >
          {action.title}
        </h3>

        {/* Context / Facility & Owner Metadata */}
        <div className="flex items-center gap-3 text-xs text-stone-500 flex-wrap pt-0.5">
          <div className="flex items-center gap-1.5">
            <ContextIcon className={`w-3.5 h-3.5 ${contextIconColor} shrink-0`} />
            <span className="font-semibold text-stone-800">{action.site}</span>
          </div>

          <span className="text-stone-300">·</span>

          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>
              {category === 'personal' ? 'Assignee: ' : 'Owner: '}
              <strong className="text-stone-800 font-semibold">{action.owner}</strong>
            </span>
          </div>

          {!ghosted && daysInactive > 0 && action.status !== 'Done' && (
            <>
              <span className="text-stone-300">·</span>
              <span className="text-stone-400 font-mono text-[11px]">Updated {daysInactive}d ago</span>
            </>
          )}
        </div>

        {/* Note snippet if present */}
        {action.notes && (
          <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-200/80 leading-relaxed font-sans mt-1">
            <span className="text-stone-800 font-semibold">Note:</span> {action.notes}
          </p>
        )}
      </div>

      {/* 3. Dedicated Full-Width Dual-Date Schedule Strip (Never clipped or pushed off screen) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-lg bg-stone-50/80 border border-stone-200 text-xs font-mono">
        {/* 🔴 Due Date */}
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-white border border-stone-200/70">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className="text-stone-500">{dueLabel}</span>
            <span
              className={`font-semibold tabular-nums truncate ${
                dueStatus.isOverdue
                  ? 'text-rose-700 font-bold'
                  : dueStatus.isToday
                  ? 'text-rose-600 font-bold'
                  : 'text-stone-800'
              }`}
            >
              {action.due_date}
            </span>
          </div>
          <span className="text-[11px] text-stone-500 font-sans font-medium shrink-0">
            ({dueStatus.label})
          </span>
        </div>

        {/* 🔵 Next Chase / Follow-up Date */}
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-white border border-stone-200/70">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
            <span className="text-stone-500">{chaseLabel}</span>
            <span
              className={`font-semibold tabular-nums ${
                followStatus.isChaseToday
                  ? 'text-sky-800 font-bold bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200'
                  : 'text-stone-800'
              }`}
            >
              {followStatus.isChaseToday ? 'TODAY' : action.next_follow_up}
            </span>
          </div>
          {!followStatus.isChaseToday && (
            <span className="text-[11px] text-stone-500 font-sans font-medium shrink-0">
              ({followStatus.label})
            </span>
          )}
        </div>
      </div>

      {/* 4. Action Buttons at the Bottom of the Box (Comfortable, high accessibility) */}
      <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {/* Draft Nudge / Follow-up Email */}
          <button
            onClick={() => onDraftNudge(action)}
            disabled={isDone}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              isDone
                ? 'opacity-40 cursor-not-allowed bg-stone-100 border-stone-200 text-stone-400'
                : followStatus.isChaseToday || ghosted
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
            }`}
            title="Generate friendly personalized follow-up message"
          >
            <Mail className="w-3.5 h-3.5 text-amber-100" />
            <span>{nudgeButtonLabel}</span>
          </button>

          {/* Quick Log Note */}
          <button
            onClick={() => onQuickUpdate(action)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 flex items-center gap-1.5 transition-colors whitespace-nowrap"
            title="Log update notes or advance chase date"
          >
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>Log Note</span>
          </button>
        </div>

        {/* 1-Click Done Toggle */}
        <button
          onClick={() => onToggleStatus(action)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            isDone
              ? 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
          }`}
          title={isDone ? 'Reopen item' : 'Mark as done'}
        >
          {isDone ? (
            <>
              <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
              <span>Reopen</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mark as Done</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
