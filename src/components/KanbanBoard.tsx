import React, { useState } from 'react';
import { ActionItem } from '../types';
import {
  getDueDateStatus,
  getFollowUpStatus,
  getDaysInactive,
  isGhosted,
} from '../lib/dateUtils';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  GripVertical,
  Flame,
  Zap,
  Mail,
  Edit2,
  Trash2,
  AlertTriangle,
  Repeat,
  MapPin,
  Rocket,
  Heart,
  Briefcase,
  User,
  ArrowRight,
  MoveRight,
} from 'lucide-react';

interface KanbanBoardProps {
  actions: ActionItem[];
  onUpdateStatus: (id: number, newStatus: ActionItem['status']) => void;
  onDraftNudge: (action: ActionItem) => void;
  onQuickUpdate: (action: ActionItem) => void;
  onEdit: (action: ActionItem) => void;
  onDelete: (id: number) => void;
  onTogglePriority: (action: ActionItem) => void;
}

interface ColumnConfig {
  id: ActionItem['status'];
  title: string;
  badgeLabel: string;
  borderColor: string;
  headerBg: string;
  accentText: string;
  icon: React.ReactNode;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'Waiting on Site',
    title: 'Waiting on Site / In Progress',
    badgeLabel: 'Active Waiting',
    borderColor: 'border-amber-300',
    headerBg: 'bg-amber-50 text-amber-900 border-amber-200',
    accentText: 'text-amber-700',
    icon: <Clock className="w-4 h-4 text-amber-600" />,
  },
  {
    id: 'Under Review',
    title: 'Under Review / QA',
    badgeLabel: 'In Review',
    borderColor: 'border-violet-300',
    headerBg: 'bg-violet-50 text-violet-900 border-violet-200',
    accentText: 'text-violet-700',
    icon: <Eye className="w-4 h-4 text-violet-600" />,
  },
  {
    id: 'Done',
    title: 'Done (Closed)',
    badgeLabel: 'Closed',
    borderColor: 'border-emerald-300',
    headerBg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    accentText: 'text-emerald-700',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  actions,
  onUpdateStatus,
  onDraftNudge,
  onQuickUpdate,
  onEdit,
  onDelete,
  onTogglePriority,
}) => {
  const [draggedActionId, setDraggedActionId] = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ActionItem['status'] | null>(null);

  const handleDragStart = (e: React.DragEvent, actionId: number) => {
    setDraggedActionId(actionId);
    e.dataTransfer.setData('text/plain', actionId.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedActionId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e: React.DragEvent, colId: ActionItem['status']) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, colId: ActionItem['status']) => {
    // Only clear if actually leaving this column container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverCol === colId) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: ActionItem['status']) => {
    e.preventDefault();
    setDragOverCol(null);
    const idStr = e.dataTransfer.getData('text/plain');
    const id = parseInt(idStr, 10);
    if (!isNaN(id)) {
      onUpdateStatus(id, targetStatus);
    }
    setDraggedActionId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
      {COLUMNS.map((column) => {
        const colActions = actions.filter((a) => a.status === column.id);
        const p1InCol = colActions.filter((a) => a.priority === 'P1').length;
        const isTarget = dragOverCol === column.id;

        return (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={(e) => handleDragLeave(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
            className={`rounded-xl border bg-stone-50/70 flex flex-col min-h-[550px] transition-all duration-150 shadow-xs ${
              isTarget
                ? 'ring-2 ring-amber-400 bg-amber-50/40 border-amber-300 shadow-md'
                : 'border-stone-200'
            }`}
          >
            {/* Column Header */}
            <div
              className={`p-3.5 border-b rounded-t-xl flex items-center justify-between ${column.headerBg}`}
            >
              <div className="flex items-center gap-2">
                {column.icon}
                <span className="text-xs font-bold tracking-tight">
                  {column.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                {p1InCol > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold flex items-center gap-0.5" title="P1 Urgent in this column">
                    <Flame className="w-2.5 h-2.5 text-rose-500" />
                    <span>{p1InCol}</span>
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-white border border-stone-200 text-[11px] font-semibold text-stone-700 shadow-xs">
                  {colActions.length}
                </span>
              </div>
            </div>

            {/* Column Body / Dropzone */}
            <div className="p-2.5 flex-1 space-y-2.5 overflow-y-auto max-h-[75vh]">
              {colActions.length === 0 ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center text-xs transition-colors flex flex-col items-center justify-center min-h-[160px] ${
                    isTarget
                      ? 'border-amber-400 bg-amber-50/50 text-amber-900'
                      : 'border-stone-200 text-stone-400 bg-white/40'
                  }`}
                >
                  <MoveRight className="w-5 h-5 mb-1.5 opacity-60" />
                  <p className="font-semibold text-stone-600">
                    {isTarget ? 'Release to drop here' : 'Empty Column'}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Drag items here or move via card selector
                  </p>
                </div>
              ) : (
                colActions.map((action) => {
                  const isBeingDragged = draggedActionId === action.id;
                  const daysInactive = getDaysInactive(action.updated_at);
                  const ghosted = isGhosted(action);
                  const dueStatus = getDueDateStatus(action.due_date);
                  const followStatus = getFollowUpStatus(action.next_follow_up);
                  const isDone = action.status === 'Done';
                  const category = action.category || 'work';

                  const ContextIcon =
                    category === 'side_project' ? Rocket : category === 'personal' ? Heart : MapPin;
                  const contextIconColor =
                    category === 'side_project' ? 'text-violet-600' : category === 'personal' ? 'text-emerald-600' : 'text-amber-700';

                  return (
                    <div
                      key={action.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, action.id)}
                      onDragEnd={handleDragEnd}
                      className={`group rounded-lg border p-3 bg-white transition-all select-none cursor-grab active:cursor-grabbing space-y-2.5 shadow-xs ${
                        isBeingDragged
                          ? 'opacity-40 scale-95 border-amber-400'
                          : ghosted
                          ? 'border-amber-300 ring-1 ring-amber-300/40 bg-amber-50/20'
                          : action.priority === 'P1'
                          ? 'border-rose-200 hover:border-rose-300 hover:shadow-md'
                          : 'border-stone-200 hover:border-amber-300 hover:shadow-md'
                      }`}
                    >
                      {/* Top Bar of Card: Drag Grip + Priority + Category + Edit/Delete */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <GripVertical className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 shrink-0" />

                          {/* Priority Toggle */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePriority(action);
                            }}
                            title="Click to toggle priority"
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border transition-colors ${
                              action.priority === 'P1'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-stone-100 text-stone-700 border-stone-200'
                            }`}
                          >
                            {action.priority === 'P1' ? (
                              <>
                                <Flame className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                                <span>P1</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                <span>P2</span>
                              </>
                            )}
                          </button>

                          {/* Category Badge */}
                          {category === 'side_project' ? (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-violet-50 text-violet-800 border border-violet-200 flex items-center gap-1">
                              <Rocket className="w-2.5 h-2.5 text-violet-600" />
                              <span>Side</span>
                            </span>
                          ) : category === 'personal' ? (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <Heart className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Personal</span>
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                              <Briefcase className="w-2.5 h-2.5 text-amber-700" />
                              <span>Work</span>
                            </span>
                          )}

                          {ghosted && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                              <span>{daysInactive}d</span>
                            </span>
                          )}
                        </div>

                        {/* Edit / Delete Icons */}
                        <div className="flex items-center gap-1 text-stone-400 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(action);
                            }}
                            className="p-1 hover:text-stone-800 hover:bg-stone-100 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(action.id);
                            }}
                            className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Title: 100% full width */}
                      <div>
                        <h4
                          className={`text-xs font-bold leading-snug tracking-tight ${
                            isDone ? 'line-through text-stone-400' : 'text-stone-900'
                          }`}
                        >
                          {action.title}
                        </h4>
                      </div>

                      {/* Location & Owner */}
                      <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5 gap-2">
                        <div className="flex items-center gap-1 min-w-0">
                          <ContextIcon className={`w-3 h-3 ${contextIconColor} shrink-0`} />
                          <span className="truncate font-medium text-stone-700">{action.site}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 font-medium text-stone-600">
                          <User className="w-3 h-3 text-sky-600" />
                          <span>{action.owner}</span>
                        </div>
                      </div>

                      {/* Dual-Date Row */}
                      <div className="grid grid-cols-2 gap-1 p-1.5 rounded bg-stone-50 border border-stone-200/80 text-[10px] font-mono">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          <span className="text-stone-500">Due:</span>
                          <span
                            className={`truncate ${
                              dueStatus.isOverdue
                                ? 'text-rose-700 font-bold'
                                : 'text-stone-800'
                            }`}
                          >
                            {action.due_date}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                          <span className="text-stone-500">Chase:</span>
                          <span
                            className={`truncate ${
                              followStatus.isChaseToday
                                ? 'text-sky-800 font-bold bg-sky-50 px-1 rounded'
                                : 'text-stone-800'
                            }`}
                          >
                            {followStatus.isChaseToday ? 'TODAY' : action.next_follow_up}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Quick Actions: Nudge, Log Note & Move Dropdown */}
                      <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between gap-1 text-[11px]">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDraftNudge(action);
                            }}
                            className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 flex items-center gap-1 transition-colors"
                            title="Draft follow-up email"
                          >
                            <Mail className="w-2.5 h-2.5 text-amber-600" />
                            <span>Ping</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickUpdate(action);
                            }}
                            className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 flex items-center gap-1 transition-colors"
                            title="Log quick note"
                          >
                            <Clock className="w-2.5 h-2.5 text-sky-600" />
                            <span>Note</span>
                          </button>
                        </div>

                        {/* Accessibility Move Selector (for non-drag users) */}
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-stone-400">Move:</span>
                          <select
                            value={action.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              onUpdateStatus(action.id, e.target.value as ActionItem['status'])
                            }
                            aria-label="Change status"
                            className="text-[10px] bg-stone-50 border border-stone-200 rounded px-1.5 py-0.5 text-stone-800 focus:outline-none focus:border-amber-400 cursor-pointer"
                          >
                            <option value="Waiting on Site">Waiting</option>
                            <option value="Under Review">Review</option>
                            <option value="Done">Done</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
