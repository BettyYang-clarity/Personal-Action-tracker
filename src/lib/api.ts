import { ActionItem, ParsedFinding, NudgeData } from '../types';

export async function fetchActions(): Promise<ActionItem[]> {
  const res = await fetch('/api/actions');
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch actions');
  }
  return data.actions;
}

export async function createActionApi(action: Omit<ActionItem, 'id' | 'created_at' | 'updated_at'>): Promise<ActionItem> {
  const res = await fetch('/api/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to create action');
  }
  return data.action;
}

export async function createBatchActionsApi(items: ParsedFinding[]): Promise<ActionItem[]> {
  const res = await fetch('/api/actions/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to create batch actions');
  }
  return data.actions;
}

export async function updateActionApi(id: number, fields: Partial<ActionItem>): Promise<ActionItem> {
  const res = await fetch(`/api/actions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to update action');
  }
  return data.action;
}

export async function quickUpdateActionApi(
  id: number,
  logNote: string,
  advanceDays: number,
  status?: ActionItem['status']
): Promise<ActionItem> {
  const res = await fetch(`/api/actions/${id}/quick-update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logNote, advanceDays, status }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to quick update action');
  }
  return data.action;
}

export async function deleteActionApi(id: number): Promise<void> {
  const res = await fetch(`/api/actions/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to delete action');
  }
}

export async function resetDemoApi(): Promise<ActionItem[]> {
  const res = await fetch('/api/actions/reset-demo', {
    method: 'POST',
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to reset demo data');
  }
  return data.actions;
}

export async function parseTextApi(text: string): Promise<ParsedFinding[]> {
  const res = await fetch('/api/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to parse text with AI');
  }
  return data.findings;
}

export async function generateNudgeApi(params: {
  title: string;
  site: string;
  owner: string;
  priority: 'P1' | 'P2';
  due_date: string;
  next_follow_up: string;
  status: string;
  daysInactive: number;
  notes: string;
  category?: 'work' | 'side_project' | 'personal';
  tone?: 'standard' | 'urgent' | 'casual';
}): Promise<NudgeData> {
  const res = await fetch('/api/nudge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to generate nudge email');
  }
  return data.nudge;
}

export function downloadCalendarIcs(): void {
  window.location.href = '/api/export-ics';
}
