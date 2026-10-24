import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import {
  getAllActions,
  createAction,
  createBatchActions,
  updateAction,
  quickUpdateAction,
  deleteAction,
  resetDemoData,
  seedIfEmpty,
} from './server/db.js';
import { parseUnstructuredFindings, generateNudgeEmail } from './server/gemini.js';
import { generateCalendarIcs } from './server/ics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Ensure database is initialized
seedIfEmpty();

// --- API Routes ---

// 1. Get all actions
app.get('/api/actions', (req: Request, res: Response) => {
  try {
    const actions = getAllActions();
    res.json({ success: true, actions });
  } catch (err: any) {
    console.error('Error fetching actions:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Create single action
app.post('/api/actions', (req: Request, res: Response) => {
  try {
    const { title, site, owner, priority, status, due_date, next_follow_up, is_recurring, category, notes } = req.body;
    if (!title || !due_date || !next_follow_up) {
      return res.status(400).json({ success: false, error: 'Title, due date, and next follow-up date are required' });
    }
    const created = createAction({
      title,
      site: site || 'Main Facility',
      owner: owner || 'Unassigned',
      priority: priority || 'P2',
      status: status || 'Waiting on Site',
      due_date,
      next_follow_up,
      is_recurring: Boolean(is_recurring),
      category: category || 'work',
      notes: notes || '',
    });
    res.status(201).json({ success: true, action: created });
  } catch (err: any) {
    console.error('Error creating action:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Create batch actions (from AI multi-item review drawer)
app.post('/api/actions/batch', (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'No items provided' });
    }
    const created = createBatchActions(items);
    res.status(201).json({ success: true, actions: created });
  } catch (err: any) {
    console.error('Error batch creating actions:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Update action
app.put('/api/actions/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = updateAction(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Action not found' });
    }
    res.json({ success: true, action: updated });
  } catch (err: any) {
    console.error('Error updating action:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Quick update note & advance follow-up
app.post('/api/actions/:id/quick-update', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { logNote, advanceDays, status } = req.body;
    if (!logNote) {
      return res.status(400).json({ success: false, error: 'Log note is required' });
    }
    const updated = quickUpdateAction(id, logNote, advanceDays ? parseInt(advanceDays, 10) : 0, status);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Action not found' });
    }
    res.json({ success: true, action: updated });
  } catch (err: any) {
    console.error('Error in quick update:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Delete action
app.delete('/api/actions/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const ok = deleteAction(id);
    if (!ok) {
      return res.status(404).json({ success: false, error: 'Action not found' });
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting action:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Reset sample demo data
app.post('/api/actions/reset-demo', (req: Request, res: Response) => {
  try {
    resetDemoData();
    const actions = getAllActions();
    res.json({ success: true, actions });
  } catch (err: any) {
    console.error('Error resetting demo data:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. AI Parser endpoint (Smart Ingestion Box)
app.post('/api/parse', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: 'Text input is required' });
    }
    const findings = await parseUnstructuredFindings(text);
    res.json({ success: true, findings });
  } catch (err: any) {
    console.error('Error parsing text:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. AI Nudge Email Generator endpoint
app.post('/api/nudge', async (req: Request, res: Response) => {
  try {
    const { title, site, owner, priority, due_date, next_follow_up, status, daysInactive, notes, category, tone } = req.body;
    if (!title || !owner) {
      return res.status(400).json({ success: false, error: 'Title and owner are required' });
    }
    const nudge = await generateNudgeEmail({
      title,
      site: site || 'Site',
      owner,
      priority: priority || 'P2',
      due_date: due_date || 'Upcoming',
      next_follow_up: next_follow_up || 'Today',
      status: status || 'Waiting on Site',
      daysInactive: typeof daysInactive === 'number' ? daysInactive : 0,
      notes: notes || '',
      category: category || 'work',
      tone: tone || 'standard',
    });
    res.json({ success: true, nudge });
  } catch (err: any) {
    console.error('Error generating nudge email:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Calendar .ics export
app.get('/api/export-ics', (req: Request, res: Response) => {
  try {
    const actions = getAllActions();
    const icsContent = generateCalendarIcs(actions);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ehs_action_radar.ics"');
    res.send(icsContent);
  } catch (err: any) {
    console.error('Error generating ICS:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Server & Frontend Integration ---

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EHS Action Radar] Server ready at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
