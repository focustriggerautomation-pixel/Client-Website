import { DAYS, dayIntervals, type CafeConfig, type Day, type Interval } from '../config/schema.ts';

export const DAY_NAMES: Record<Day, { short: string; long: string }> = {
  mon: { short: 'Mon', long: 'Monday' },
  tue: { short: 'Tue', long: 'Tuesday' },
  wed: { short: 'Wed', long: 'Wednesday' },
  thu: { short: 'Thu', long: 'Thursday' },
  fri: { short: 'Fri', long: 'Friday' },
  sat: { short: 'Sat', long: 'Saturday' },
  sun: { short: 'Sun', long: 'Sunday' },
};

/** JS getDay() is 0 = Sunday. */
export const dayOf = (d: Date): Day => DAYS[(d.getDay() + 6) % 7];
const dayOffset = (day: Day, n: number): Day => DAYS[(DAYS.indexOf(day) + n + 7 * 2) % 7];

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
/** "23:59" means "until midnight". */
const closeMin = (t: string) => (t === '23:59' ? 1440 : toMin(t));
const overnight = (iv: Interval) => closeMin(iv.close) <= toMin(iv.open);

/** "16:00" → "4 pm", "07:30" → "7:30 am", "12:00" → "noon", "23:59"/"00:00" → "midnight". */
export function formatTime(t: string): string {
  if (t === '23:59' || t === '00:00') return 'midnight';
  if (t === '12:00') return 'noon';
  const h = Number(t.slice(0, 2));
  const m = t.slice(3, 5);
  return `${h % 12 || 12}${m === '00' ? '' : `:${m}`} ${h < 12 ? 'am' : 'pm'}`;
}

export const formatIntervals = (ivs: Interval[]) =>
  ivs.length ? ivs.map((iv) => `${formatTime(iv.open)} – ${formatTime(iv.close)}`).join(', ') : 'Closed';

export interface WeekRow {
  day: Day;
  name: { short: string; long: string };
  intervals: Interval[];
  text: string;
  isToday: boolean;
}

export function weekRows(hours: CafeConfig['hours'], now: Date): WeekRow[] {
  const today = dayOf(now);
  return DAYS.map((day) => {
    const intervals = dayIntervals(hours[day]);
    return { day, name: DAY_NAMES[day], intervals, text: formatIntervals(intervals), isToday: day === today };
  });
}

export interface OpenStatus {
  open: boolean;
  today: Day;
  /** "Open now", "Closed" */
  headline: string;
  /** "until 11 pm", "opens tomorrow at 8 am" */
  detail: string;
}

/** Open/closed right now, in the visitor's local time. Handles split days and past-midnight closing. */
export function openStatus(hours: CafeConfig['hours'], now: Date): OpenStatus {
  const today = dayOf(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todays = dayIntervals(hours[today]);
  const yesterdays = dayIntervals(hours[dayOffset(today, -1)]);

  // Still open from yesterday's past-midnight interval?
  for (const iv of yesterdays) {
    if (overnight(iv) && nowMin < closeMin(iv.close)) return { open: true, today, headline: 'Open now', detail: `until ${formatTime(iv.close)}` };
  }
  for (const iv of todays) {
    const o = toMin(iv.open);
    if (overnight(iv) ? nowMin >= o : nowMin >= o && nowMin < closeMin(iv.close)) {
      return { open: true, today, headline: 'Open now', detail: `until ${formatTime(iv.close)}` };
    }
  }

  const later = todays.find((iv) => toMin(iv.open) > nowMin);
  if (later) return { open: false, today, headline: 'Closed now', detail: `opens at ${formatTime(later.open)}` };
  for (let n = 1; n <= 7; n++) {
    const day = dayOffset(today, n);
    const first = dayIntervals(hours[day])[0];
    if (first) {
      const when = n === 1 ? 'tomorrow' : DAY_NAMES[day].long;
      return { open: false, today, headline: 'Closed now', detail: `opens ${when} at ${formatTime(first.open)}` };
    }
  }
  return { open: false, today, headline: 'Closed', detail: '' };
}
