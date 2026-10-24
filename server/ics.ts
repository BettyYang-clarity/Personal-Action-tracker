import { ActionItem } from './db.js';

function formatIcsDate(dateStr: string): string {
  // dateStr is 'YYYY-MM-DD'
  const clean = dateStr.replace(/[^0-9]/g, '');
  return `${clean}`;
}

function escapeIcsText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function generateCalendarIcs(actions: ActionItem[]): string {
  const now = new Date();
  const dtstamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EHS Action Radar//Compliance & Chase Feed//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:EHS Action Radar',
    'X-WR-TIMEZONE:UTC',
  ];

  for (const action of actions) {
    if (action.status === 'Done') continue;

    const dueFormatted = formatIcsDate(action.due_date);
    const followFormatted = formatIcsDate(action.next_follow_up);
    const pLabel = action.priority === 'P1' ? 'P1 CRITICAL' : 'P2 Standard';

    // 1. Due Date Event (Red / Compliance Deadline)
    ics.push(
      'BEGIN:VEVENT',
      `UID:ehs-due-${action.id}@actionradar.local`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${dueFormatted}`,
      `SUMMARY:[DUE] ${escapeIcsText(action.title)} (${escapeIcsText(action.site)})`,
      `DESCRIPTION:Audit / Compliance Deadline\\nPriority: ${pLabel}\\nSite: ${escapeIcsText(action.site)}\\nOwner: ${escapeIcsText(action.owner)}\\nStatus: ${escapeIcsText(action.status)}\\nNotes: ${escapeIcsText(action.notes)}`,
      `LOCATION:${escapeIcsText(action.site)}`,
      `CATEGORIES:Compliance,${action.priority}`,
      `PRIORITY:${action.priority === 'P1' ? '1' : '5'}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: Compliance Due Date for ${escapeIcsText(action.title)}`,
      'TRIGGER:-P1D',
      'END:VALARM',
      'END:VEVENT'
    );

    // 2. Next Follow-Up Event (Blue / Manager Chase Cadence)
    ics.push(
      'BEGIN:VEVENT',
      `UID:ehs-chase-${action.id}@actionradar.local`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${followFormatted}`,
      `SUMMARY:[CHASE] ${escapeIcsText(action.owner)} re: ${escapeIcsText(action.title)}`,
      `DESCRIPTION:Personal Follow-Up / Nudge Cadence\\nTarget Due Date: ${action.due_date}\\nPriority: ${pLabel}\\nSite: ${escapeIcsText(action.site)}\\nOwner: ${escapeIcsText(action.owner)}\\nNotes: ${escapeIcsText(action.notes)}`,
      `LOCATION:${escapeIcsText(action.site)}`,
      `CATEGORIES:Follow-Up,Chase`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:Follow-Up Check-in with ${escapeIcsText(action.owner)} on ${escapeIcsText(action.title)}`,
      'TRIGGER:PT9H',
      'END:VALARM',
      'END:VEVENT'
    );
  }

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}
