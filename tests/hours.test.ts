/**
 * npm test — open-now / today's-row logic, evaluated in the cafe's time zone.
 * Instants are fixed in UTC, so results never depend on the machine's or visitor's zone.
 */
import { openStatus, weekRows } from '../src/lib/hours.ts';

const H = (o: Record<string, unknown>) =>
  ({ mon: 'closed', tue: 'closed', wed: 'closed', thu: 'closed', fri: 'closed', sat: 'closed', sun: 'closed', ...o }) as never;

/** Wall-clock time in Kolkata (UTC+5:30) → UTC instant. 2026-11-25 is a Wednesday. */
const ist = (day: number, hm: string) => new Date(Date.UTC(2026, 10, day, +hm.slice(0, 2), +hm.slice(3)) - 330 * 60_000);
const IST = 'Asia/Kolkata';
const SPLIT = H({
  wed: [
    { open: '07:30', close: '11:30' },
    { open: '16:00', close: '22:30' },
  ],
});

const cases: [string, unknown, Date, string, string][] = [
  ['split day, during lunch', SPLIT, ist(25, '09:00'), IST, 'Open now until 11:30 am'],
  ['split day, between services', SPLIT, ist(25, '13:00'), IST, 'Closed now opens at 4 pm'],
  ['open until midnight', H({ wed: { open: '16:00', close: '23:59' } }), ist(25, '23:30'), IST, 'Open now until midnight'],
  ['past midnight, after 12', H({ tue: { open: '18:00', close: '02:00' } }), ist(25, '01:15'), IST, 'Open now until 2 am'],
  ['past midnight, evening', H({ wed: { open: '18:00', close: '02:00' } }), ist(25, '20:00'), IST, 'Open now until 2 am'],
  ['closed today, opens tomorrow', H({ thu: { open: '08:00', close: '18:00' } }), ist(25, '10:00'), IST, 'Closed now opens tomorrow at 8 am'],
  ['closed, opens a later day', H({ sat: { open: '12:00', close: '18:00' } }), ist(25, '10:00'), IST, 'Closed now opens Saturday at noon'],
  [
    'after closing',
    H({ wed: { open: '08:00', close: '18:00' }, thu: { open: '08:00', close: '18:00' } }),
    ist(25, '19:00'),
    IST,
    'Closed now opens tomorrow at 8 am',
  ],
  // The cafe's zone decides, not the visitor's: 10:00 in Kolkata is 04:30 in London.
  ['same instant, Kolkata cafe', H({ wed: { open: '08:00', close: '18:00' } }), ist(25, '10:00'), 'Asia/Kolkata', 'Open now until 6 pm'],
  ['same instant, London cafe', H({ wed: { open: '08:00', close: '18:00' } }), ist(25, '10:00'), 'Europe/London', 'Closed now opens at 8 am'],
  // 00:30 Thursday in Kolkata is still Wednesday 19:00 UTC.
  [
    'day boundary uses cafe date',
    H({ wed: { open: '08:00', close: '23:00' }, thu: { open: '08:00', close: '23:00' } }),
    ist(26, '00:30'),
    IST,
    'Closed now opens at 8 am',
  ],
];

let fail = 0;
for (const [name, hours, now, tz, want] of cases) {
  const s = openStatus(hours as never, now, tz);
  const got = `${s.headline} ${s.detail}`.trim();
  if (got !== want) fail++;
  console.log(`${got === want ? 'PASS' : 'FAIL'}  ${name.padEnd(32)} ${got}${got === want ? '' : `   (expected: ${want})`}`);
}

// Today's row follows the cafe's date too.
const today = weekRows(SPLIT, ist(26, '00:30'), IST).find((r) => r.isToday)?.day;
const todayOk = today === 'thu';
if (!todayOk) fail++;
console.log(`${todayOk ? 'PASS' : 'FAIL'}  ${"today's row in cafe zone".padEnd(32)} ${today}`);

console.log(fail ? `\n✖ ${fail} failing` : `\n✓ all ${cases.length + 1} open-now cases pass`);
process.exit(fail ? 1 : 0);
