import { GoogleGenAI, Type } from '@google/genai';

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(d: Date, days: number): string {
  const clone = new Date(d);
  clone.setDate(clone.getDate() + days);
  return formatDate(clone);
}

export interface ParsedFinding {
  title: string;
  site: string;
  owner: string;
  priority: 'P1' | 'P2';
  due_date: string;
  next_follow_up: string;
  is_recurring: boolean;
  category?: 'work' | 'side_project' | 'personal';
  notes: string;
}

export interface NudgeResult {
  subject: string;
  body: string;
  mailtoUrl: string;
}

export async function parseUnstructuredFindings(rawText: string): Promise<ParsedFinding[]> {
  const now = new Date();
  const todayStr = formatDate(now);
  const defaultDue = addDays(now, 30);
  const defaultFollowUp = addDays(now, 7);

  const ai = getAiClient();
  if (ai) {
    try {
      const prompt = `
You are an expert action item, safety finding, and project milestone data extraction assistant.
Today's date is: ${todayStr}.

Extract ALL distinct findings, audit observations, project tasks, and action items from the following raw text (which may come from an EHS inspection, email thread, software/side project sprint, or personal to-do list).
For each action item, extract:
- title: A concise, SMART action description.
- site: For EHS/work, the plant/facility/line (e.g. "Plant A - Solvent Bay"). For side projects, the project name or repo (e.g. "Mobile App MVP"). For personal, the focus area (e.g. "Health & Fitness", "Home"). Default to "Main Project / Site" if unspecified.
- owner: The person or role responsible. Default to "Unassigned" if unspecified.
- priority: "P1" if it is critical, blocker, severe risk, or deadline-sensitive; otherwise "P2" (routine).
- due_date: YYYY-MM-DD. If explicit deadline mentioned, calculate or normalize to YYYY-MM-DD. If no deadline, set to approximately 30 days from today (${defaultDue}).
- next_follow_up: YYYY-MM-DD. The date the manager/lead should next chase/check in. Default to 7 days from today (${defaultFollowUp}) or earlier if urgent.
- is_recurring: boolean. True if chronic, recurring, or repeat item.
- category: One of "work" (EHS/industrial/company operations), "side_project" (tech, coding, creative, entrepreneurial), or "personal" (wellness, home, finances, daily life). Default to "work" if safety/audit related.
- notes: Contextual details, observations, or blocker clues.

Raw Input Text:
"""
${rawText}
"""
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                site: { type: Type.STRING },
                owner: { type: Type.STRING },
                priority: { type: Type.STRING },
                due_date: { type: Type.STRING },
                next_follow_up: { type: Type.STRING },
                is_recurring: { type: Type.BOOLEAN },
                category: { type: Type.STRING },
                notes: { type: Type.STRING },
              },
              required: ['title', 'site', 'owner', 'priority', 'due_date', 'next_follow_up', 'is_recurring'],
            },
          },
        },
      });

      const parsedJson = JSON.parse(response.text?.trim() || '[]');
      if (Array.isArray(parsedJson) && parsedJson.length > 0) {
        return parsedJson.map((item) => {
          const rawCat = (item.category || '').toLowerCase();
          const category = rawCat === 'side_project' || rawCat === 'personal' ? rawCat : 'work';
          return {
            title: item.title || 'Untitled finding',
            site: item.site || (category === 'side_project' ? 'Side Venture' : category === 'personal' ? 'Personal Life' : 'Main Facility'),
            owner: item.owner || 'Unassigned',
            priority: item.priority === 'P1' ? 'P1' : 'P2',
            due_date: item.due_date || defaultDue,
            next_follow_up: item.next_follow_up || defaultFollowUp,
            is_recurring: Boolean(item.is_recurring),
            category,
            notes: item.notes || '',
          };
        });
      }
    } catch (err) {
      console.error('Gemini extraction error, using rule-based parser:', err);
    }
  }

  // Heuristic rule-based fallback parser if AI is unavailable or fails
  return fallbackRuleBasedParser(rawText, todayStr, defaultDue, defaultFollowUp);
}

function fallbackRuleBasedParser(
  rawText: string,
  todayStr: string,
  defaultDue: string,
  defaultFollowUp: string
): ParsedFinding[] {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items: ParsedFinding[] = [];

  // If text looks like tab-delimited or comma-delimited Excel rows
  for (const line of lines) {
    if (line.includes('\t') || line.includes('|')) {
      const parts = line.split(/[\t|]/).map((p) => p.trim());
      if (parts.length >= 2 && !parts[0].toLowerCase().includes('finding') && !parts[0].toLowerCase().includes('action')) {
        const title = parts[0];
        const site = parts[1] || 'Main Facility';
        const owner = parts[2] || 'Unassigned';
        const isP1 = line.toLowerCase().includes('critical') || line.toLowerCase().includes('p1') || line.toLowerCase().includes('urgent');
        items.push({
          title,
          site,
          owner,
          priority: isP1 ? 'P1' : 'P2',
          due_date: defaultDue,
          next_follow_up: defaultFollowUp,
          is_recurring: line.toLowerCase().includes('repeat') || line.toLowerCase().includes('recur'),
          notes: parts.slice(3).join(' '),
        });
      }
    }
  }

  if (items.length > 0) {
    return items;
  }

  // Otherwise treat each bullet or chunk as an item
  const bulletChunks = rawText.split(/(?:\n\s*[-*•\d+.]\s+)/).map((c) => c.trim()).filter((c) => c.length > 5);

  if (bulletChunks.length > 1) {
    for (const chunk of bulletChunks) {
      const isP1 = chunk.toLowerCase().includes('critical') || chunk.toLowerCase().includes('severe') || chunk.toLowerCase().includes('hazard');
      items.push({
        title: chunk.split('\n')[0].substring(0, 120),
        site: 'Main Facility',
        owner: 'Unassigned',
        priority: isP1 ? 'P1' : 'P2',
        due_date: defaultDue,
        next_follow_up: defaultFollowUp,
        is_recurring: chunk.toLowerCase().includes('recurring'),
        notes: chunk,
      });
    }
    return items;
  }

  return [
    {
      title: rawText.split('\n')[0].substring(0, 100) || 'Action item from notes',
      site: 'Main Facility',
      owner: 'Unassigned',
      priority: rawText.toLowerCase().includes('critical') ? 'P1' : 'P2',
      due_date: defaultDue,
      next_follow_up: defaultFollowUp,
      is_recurring: false,
      notes: rawText,
    },
  ];
}

export async function generateNudgeEmail(params: {
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
}): Promise<NudgeResult> {
  const { title, site, owner, priority, due_date, status, daysInactive, notes, category = 'work', tone = 'standard' } = params;

  const ai = getAiClient();
  if (ai) {
    try {
      const persona =
        category === 'side_project'
          ? 'You are a product lead / technical founder drafting a concise, friendly check-in email to a collaborator, contractor, or team member regarding a project milestone.'
          : category === 'personal'
          ? 'You are drafting a friendly reminder or follow-up note regarding a personal goal, appointment, or errand.'
          : 'You are an experienced EHS Program Lead drafting a concise, professional follow-up email to a facility site manager or action owner.';

      const prompt = `
${persona}
Input details:
- Task / Finding: "${title}"
- Project / Facility: "${site}"
- Owner / Assignee: "${owner}"
- Priority: ${priority} (${priority === 'P1' ? 'High Urgency / Critical Blocker' : 'Routine Cadence'})
- Status: "${status}"
- Target Due Date: ${due_date}
- Inactivity: ${daysInactive} days since last update
- Context / Notes: "${notes || 'No recent updates logged.'}"
- Tone style requested: ${tone} (${tone === 'urgent' ? 'Firm, serious, highlighting milestone risk' : tone === 'casual' ? 'Friendly, quick ping' : 'Polite, professional, collaborative'})

Task:
Draft:
1. A crisp, specific email Subject line (under 60 chars) including the context/project and task.
2. A 2 to 3 sentence email body asking for a status update or closure verification before the target date, addressing the owner by first name. Make it ready to send immediately.

Return STRICT JSON format:
{
  "subject": "string",
  "body": "string"
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              body: { type: Type.STRING },
            },
            required: ['subject', 'body'],
          },
        },
      });

      const res = JSON.parse(response.text?.trim() || '{}');
      if (res.subject && res.body) {
        const mailtoUrl = `mailto:${encodeURIComponent(owner.replace(/\s+/g, '.').toLowerCase() + '@company.com')}?subject=${encodeURIComponent(res.subject)}&body=${encodeURIComponent(res.body)}`;
        return {
          subject: res.subject,
          body: res.body,
          mailtoUrl,
        };
      }
    } catch (err) {
      console.error('Gemini nudge generation error, using smart fallback template:', err);
    }
  }

  // Fallback intelligent template
  const firstName = owner.split(' ')[0] || 'Team';
  const isUrgent = priority === 'P1' || daysInactive >= 10 || tone === 'urgent';
  const subject = `[EHS Action Required] ${site} - ${title.substring(0, 35)}`;
  
  let body = '';
  if (isUrgent) {
    body = `Hi ${firstName},\n\nI am following up on the critical action item "${title}" at ${site}. Our compliance target is ${due_date}, and we haven't received an update in ${daysInactive} days. Could you please reply with the current status and confirmation of closure steps by tomorrow?\n\nBest regards,\nEHS Compliance Team`;
  } else {
    body = `Hi ${firstName},\n\nHope you're having a productive week. Checking in on "${title}" for ${site} ahead of our target date on ${due_date}. Please let me know if the corrective action is completed or if you need any assistance clearing roadblocks.\n\nThanks,\nEHS Compliance Team`;
  }

  const mailtoUrl = `mailto:${encodeURIComponent(owner.replace(/\s+/g, '.').toLowerCase() + '@company.com')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { subject, body, mailtoUrl };
}
