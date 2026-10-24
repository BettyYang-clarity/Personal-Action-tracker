import { DatabaseSync } from 'node:sqlite';
import path from 'path';

export type ActionCategory = 'work' | 'side_project' | 'personal';

export interface ActionItem {
  id: number;
  title: string;
  site: string; // Facility/Site for work, Project Name for side projects, Area for personal
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

const DB_FILE = path.resolve(process.cwd(), 'ehs_radar.db');
const db = new DatabaseSync(DB_FILE);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    site TEXT NOT NULL,
    owner TEXT NOT NULL,
    priority TEXT DEFAULT 'P2',
    status TEXT DEFAULT 'Waiting on Site',
    due_date DATE NOT NULL,
    next_follow_up DATE NOT NULL,
    is_recurring INTEGER DEFAULT 0,
    category TEXT DEFAULT 'work',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_actions_due ON actions(due_date);
  CREATE INDEX IF NOT EXISTS idx_actions_follow ON actions(next_follow_up);
  CREATE INDEX IF NOT EXISTS idx_actions_priority ON actions(priority);
  CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);
`);

// Migration safeguard: Ensure category column exists
try {
  const tableInfo = db.prepare('PRAGMA table_info(actions)').all() as any[];
  const hasCategory = tableInfo.some((col) => col.name === 'category');
  if (!hasCategory) {
    db.exec(`ALTER TABLE actions ADD COLUMN category TEXT DEFAULT 'work';`);
  }
} catch (e) {
  // column already exists
}

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

function shiftDaysAgo(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() - days);
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

export function resetDemoData() {
  db.exec('DELETE FROM actions;');
  const now = new Date();
  const today = formatLocalDate(now);

  const sampleFindings = [
    // --- 1. EHS & Operations Work ---
    {
      title: 'Flammable Cabinet Grounding Strap Severed',
      site: 'Plant A - Solvent Bay',
      owner: 'Mike Ramirez',
      priority: 'P1',
      status: 'Waiting on Site',
      due_date: shiftDays(now, 5),
      next_follow_up: today,
      is_recurring: 1,
      category: 'work',
      notes: 'Initial audit found severed grounding cable on 55-gal solvent rack. Waiting for maintenance to install certified copper lug.',
      updated_at: shiftDaysAgo(now, 12),
    },
    {
      title: 'Emergency Exit Corridor Blocked by Raw Material Pallets',
      site: 'Warehouse 2 - Sector D',
      owner: 'Sarah Chen',
      priority: 'P1',
      status: 'Waiting on Site',
      due_date: shiftDays(now, 2),
      next_follow_up: today,
      is_recurring: 0,
      category: 'work',
      notes: 'Forklift operator staged 6 skids of polymer directly in front of egress Door #4.',
      updated_at: shiftDaysAgo(now, 2),
    },
    {
      title: 'Eyewash Station Monthly Flow Inspection Tag Missing',
      site: 'Quality Lab B',
      owner: 'David Patel',
      priority: 'P2',
      status: 'Waiting on Site',
      due_date: shiftDays(now, 14),
      next_follow_up: today,
      is_recurring: 0,
      category: 'work',
      notes: 'Plumbed eyewash delivers water pressure, but physical sign-off card not stamped for current cycle.',
      updated_at: shiftDaysAgo(now, 11),
    },
    {
      title: 'Ammonia Scrubber DP Gauge Past Annual Calibration Certificate Date',
      site: 'Chemical Facility - Unit 1',
      owner: 'Robert Vance',
      priority: 'P1',
      status: 'Waiting on Site',
      due_date: shiftDays(now, 4),
      next_follow_up: today,
      is_recurring: 0,
      category: 'work',
      notes: 'Gauge DP-204 is 30 days overdue for NIST-traceable recalibration. Lead technician was on leave.',
      updated_at: shiftDaysAgo(now, 15),
    },
    {
      title: 'Confined Space Entry Permit Missing Secondary Attendant Signature',
      site: 'Plant A - Slurry Tank 3',
      owner: 'Mike Ramirez',
      priority: 'P1',
      status: 'Under Review',
      due_date: shiftDays(now, 9),
      next_follow_up: shiftDays(now, 2),
      is_recurring: 1,
      category: 'work',
      notes: 'Contractor crew entered slurry tank without secondary atmospheric attendant counter-signature. Retraining scheduled.',
      updated_at: shiftDaysAgo(now, 1),
    },
    {
      title: 'Overhead Crane Synthetic Web Sling Frayed Beyond Rejection Limit',
      site: 'Line 4 - Fabrication',
      owner: 'Carlos Gomez',
      priority: 'P2',
      status: 'Waiting on Site',
      due_date: shiftDays(now, 20),
      next_follow_up: shiftDays(now, 4),
      is_recurring: 0,
      category: 'work',
      notes: 'Sling #CR-08 tagged out of service; waiting on replacement order PO-88219 approval from site manager.',
      updated_at: shiftDaysAgo(now, 5),
    },

    // --- 2. Side Projects (Tech / Creative / Dev) ---
    {
      title: 'Deploy v1 Cloud Run API & Configure Custom SSL Domain',
      site: 'AI Studio SaaS',
      owner: 'Self (Dev)',
      priority: 'P1',
      status: 'Waiting on Site',
      due_date: shiftDays(now, 6),
      next_follow_up: today,
      is_recurring: 0,
      category: 'side_project',
      notes: 'Cloud Run service compiled cleanly; need to verify DNS A-records on Cloudflare and test SSL certificate issuance.',
      updated_at: shiftDaysAgo(now, 1),
    },
    {
      title: 'Implement Stripe Checkout Webhook & Idempotency Handler',
      site: 'AI Studio SaaS',
      owner: 'Alex Vance (Contractor)',
      priority: 'P2',
      status: 'Waiting on Site',
      due_date: shiftDays(now, 12),
      next_follow_up: shiftDays(now, 2),
      is_recurring: 0,
      category: 'side_project',
      notes: 'Awaiting webhook signing secret integration and test payments in sandbox mode.',
      updated_at: shiftDaysAgo(now, 3),
    },
    {
      title: 'Record 3-Minute Product Demo Walkthrough Video',
      site: 'Portfolio Launch',
      owner: 'Self (Dev)',
      priority: 'P2',
      status: 'Under Review',
      due_date: shiftDays(now, 8),
      next_follow_up: shiftDays(now, 3),
      is_recurring: 0,
      category: 'side_project',
      notes: 'Script drafted; need to record clean Loom audio walkthrough and upload to YouTube unlisted.',
      updated_at: shiftDaysAgo(now, 2),
    },

    // --- 3. Personal & Life Management ---
    {
      title: 'Submit Annual LLC Franchise Tax Report & Renewal',
      site: 'Business Entity',
      owner: 'Self',
      priority: 'P1',
      status: 'Waiting on Site',
      due_date: shiftDays(now, 15),
      next_follow_up: today,
      is_recurring: 1,
      category: 'personal',
      notes: 'Need state portal sign-in credentials and confirmation of registered agent address.',
      updated_at: shiftDaysAgo(now, 8),
    },
    {
      title: 'HVAC Seasonal Filter Replacement & Heat Pump Check',
      site: 'Home Maintenance',
      owner: 'HVAC Technician',
      priority: 'P2',
      status: 'Done',
      due_date: shiftDays(now, 1),
      next_follow_up: shiftDays(now, 10),
      is_recurring: 1,
      category: 'personal',
      notes: 'MERV-13 filters replaced; condensation drain cleared by technician on Oct 23.',
      updated_at: shiftDaysAgo(now, 0),
    },
  ];

  const stmt = db.prepare(`
    INSERT INTO actions (title, site, owner, priority, status, due_date, next_follow_up, is_recurring, category, notes, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of sampleFindings) {
    stmt.run(
      item.title,
      item.site,
      item.owner,
      item.priority,
      item.status,
      item.due_date,
      item.next_follow_up,
      item.is_recurring,
      item.category,
      item.notes,
      item.updated_at
    );
  }
}

export function seedIfEmpty() {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM actions').get() as { count: number };
  if (countRow.count === 0) {
    resetDemoData();
  }
}

// Ensure seeded on startup
seedIfEmpty();

export function getAllActions(): ActionItem[] {
  const rows = db.prepare(`
    SELECT 
      id, title, site, owner, priority, status, due_date, next_follow_up,
      is_recurring, category, notes, created_at, updated_at
    FROM actions
    ORDER BY 
      CASE priority WHEN 'P1' THEN 0 ELSE 1 END ASC,
      next_follow_up ASC,
      due_date ASC
  `).all() as any[];

  return rows.map((r) => ({
    ...r,
    is_recurring: Boolean(r.is_recurring),
    category: (r.category as ActionCategory) || 'work',
  }));
}

export function getActionById(id: number): ActionItem | null {
  const row = db.prepare(`SELECT * FROM actions WHERE id = ?`).get(id) as any;
  if (!row) return null;
  return {
    ...row,
    is_recurring: Boolean(row.is_recurring),
    category: (row.category as ActionCategory) || 'work',
  };
}

export function createAction(item: {
  title: string;
  site: string;
  owner: string;
  priority?: 'P1' | 'P2';
  status?: 'Waiting on Site' | 'Under Review' | 'Done';
  due_date: string;
  next_follow_up: string;
  is_recurring?: boolean;
  category?: ActionCategory;
  notes?: string;
}): ActionItem {
  const stmt = db.prepare(`
    INSERT INTO actions (title, site, owner, priority, status, due_date, next_follow_up, is_recurring, category, notes, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const priority = item.priority || 'P2';
  const status = item.status || 'Waiting on Site';
  const is_recurring = item.is_recurring ? 1 : 0;
  const category = item.category || 'work';
  const notes = item.notes || '';

  const res = stmt.run(
    item.title.trim(),
    item.site.trim() || 'General',
    item.owner.trim() || 'Self',
    priority,
    status,
    item.due_date,
    item.next_follow_up,
    is_recurring,
    category,
    notes
  );

  return getActionById(Number(res.lastInsertRowid))!;
}

export function createBatchActions(items: Array<{
  title: string;
  site: string;
  owner: string;
  priority?: 'P1' | 'P2';
  status?: 'Waiting on Site' | 'Under Review' | 'Done';
  due_date: string;
  next_follow_up: string;
  is_recurring?: boolean;
  category?: ActionCategory;
  notes?: string;
}>): ActionItem[] {
  const created: ActionItem[] = [];
  for (const item of items) {
    created.push(createAction(item));
  }
  return created;
}

export function updateAction(id: number, fields: Partial<ActionItem>): ActionItem | null {
  const existing = getActionById(id);
  if (!existing) return null;

  const title = fields.title !== undefined ? fields.title.trim() : existing.title;
  const site = fields.site !== undefined ? fields.site.trim() : existing.site;
  const owner = fields.owner !== undefined ? fields.owner.trim() : existing.owner;
  const priority = fields.priority !== undefined ? fields.priority : existing.priority;
  const status = fields.status !== undefined ? fields.status : existing.status;
  const due_date = fields.due_date !== undefined ? fields.due_date : existing.due_date;
  const next_follow_up = fields.next_follow_up !== undefined ? fields.next_follow_up : existing.next_follow_up;
  const is_recurring = fields.is_recurring !== undefined ? (fields.is_recurring ? 1 : 0) : (existing.is_recurring ? 1 : 0);
  const category = fields.category !== undefined ? fields.category : existing.category;
  const notes = fields.notes !== undefined ? fields.notes : existing.notes;

  db.prepare(`
    UPDATE actions
    SET title = ?, site = ?, owner = ?, priority = ?, status = ?,
        due_date = ?, next_follow_up = ?, is_recurring = ?, category = ?, notes = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(title, site, owner, priority, status, due_date, next_follow_up, is_recurring, category, notes, id);

  return getActionById(id);
}

export function quickUpdateAction(id: number, logNote: string, advanceFollowUpDays?: number, newStatus?: ActionItem['status']): ActionItem | null {
  const existing = getActionById(id);
  if (!existing) return null;

  let combinedNotes = existing.notes ? existing.notes + '\n\n' : '';
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
  combinedNotes += `[${timestamp}] ${logNote.trim()}`;

  let next_follow_up = existing.next_follow_up;
  if (advanceFollowUpDays && advanceFollowUpDays > 0) {
    const base = new Date();
    next_follow_up = shiftDays(base, advanceFollowUpDays);
  }

  const status = newStatus || existing.status;

  db.prepare(`
    UPDATE actions
    SET notes = ?, next_follow_up = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(combinedNotes, next_follow_up, status, id);

  return getActionById(id);
}

export function deleteAction(id: number): boolean {
  const res = db.prepare('DELETE FROM actions WHERE id = ?').run(id);
  return res.changes > 0;
}
