export type ActionCategory = 'work' | 'side_project' | 'personal';
export type WorkspaceTab = 'all' | 'work' | 'side_project' | 'personal';

export interface ActionItem {
  id: number;
  title: string;
  site: string; // Facility/Site for work, Project Name for side projects, Focus Area for personal
  owner: string;
  priority: 'P1' | 'P2';
  status: 'Waiting on Site' | 'Under Review' | 'Done';
  due_date: string;
  next_follow_up: string;
  is_recurring: boolean;
  category: ActionCategory;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ParsedFinding {
  title: string;
  site: string;
  owner: string;
  priority: 'P1' | 'P2';
  due_date: string;
  next_follow_up: string;
  is_recurring: boolean;
  category?: ActionCategory;
  notes: string;
}

export interface NudgeData {
  subject: string;
  body: string;
  mailtoUrl: string;
}

export type ViewTab = 'chase' | 'calendar' | 'matrix';

export interface FilterState {
  focusMode: boolean; // P1 Critical OR next_follow_up <= today
  searchQuery: string;
  site: string;
  owner: string;
  priority: 'ALL' | 'P1' | 'P2';
  status: 'ALL' | 'ACTIVE' | 'Waiting on Site' | 'Under Review' | 'Done';
  workspace: WorkspaceTab;
}
