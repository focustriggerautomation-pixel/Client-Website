import { SECTION_IDS, headingFor } from '../../lib/content.ts';
import { formatTime, openStatus, weekRows, type WeekRow } from '../../lib/hours.ts';
import { useNow } from '../../lib/useNow.ts';
import { useCafe } from '../../theme/ThemeProvider.tsx';
import { ActionLink } from '../ActionLink.tsx';
import { byMood } from '../byMood.tsx';
import { BrightHeading, DarkHeading, WarmHeading } from '../kit.tsx';
import { MapEmbed } from '../MapEmbed.tsx';

/** Shared data: the week with today flagged, and open/closed now (visitor's local time). */
function useHours() {
  const { cafe } = useCafe();
  const now = useNow();
  return { rows: weekRows(cafe.hours, now, cafe.timezone), status: openStatus(cafe.hours, now, cafe.timezone) };
}

/** Each interval on its own line, e.g. lunch and dinner. */
const HoursText = ({ row }: { row: WeekRow }) =>
  row.intervals.length ? (
    <>
      {row.intervals.map((iv) => (
        <span key={iv.open} className="block whitespace-nowrap">
          {formatTime(iv.open)} – {formatTime(iv.close)}
        </span>
      ))}
    </>
  ) : (
    <>Closed</>
  );

const StatusDot = ({ open }: { open: boolean }) => <span aria-hidden className={`inline-block size-2 shrink-0 rounded-full ${open ? 'bg-[#2FA84F]' : 'bg-[#C2412D]'}`} />;

function VisitDark() {
  const { cafe } = useCafe();
  const h = headingFor(useCafe().cafe, 'visit', { kicker: 'Visit', title: 'Find us' });
  const { rows, status } = useHours();
  return (
    <section id={SECTION_IDS.visit} aria-labelledby="visit-title" className="section-y border-t border-line bg-bg text-ink">
      <div className="container-x grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <DarkHeading id="visit-title" sectionId={SECTION_IDS.visit} kicker={h.kicker} title={h.title} />
          <address data-anim="fade" className="mt-8 font-display text-step-2 not-italic leading-snug">{cafe.contact.address}</address>

          <p className="eyebrow mt-10 flex items-center gap-3">
            <StatusDot open={status.open} />
            <span>{status.headline}</span>
            {status.detail && <span className="text-muted">· {status.detail}</span>}
          </p>
          <dl data-anim="stagger" className="mt-6 border-t border-line">
            {rows.map((r) => (
              <div
                key={r.day}
                aria-current={r.isToday ? 'date' : undefined}
                className={`flex justify-between gap-6 border-b border-line py-3 ${r.isToday ? 'text-ink' : 'text-muted'}`}
              >
                <dt className={r.isToday ? 'font-semibold' : ''}>
                  {r.name.long}
                  {r.isToday && <span className="eyebrow ml-3 text-[0.65rem] text-primary">Today</span>}
                </dt>
                <dd className={`text-right tabular-nums ${r.isToday ? 'text-primary' : ''}`}><HoursText row={r} /></dd>
              </div>
            ))}
          </dl>
          <div data-anim="stagger" className="mt-10 flex flex-wrap gap-4">
            <ActionLink action="maps" className="eyebrow inline-flex rounded-button border border-primary bg-primary px-6 py-4 text-on-primary hover:bg-transparent hover:text-primary" />
            <ActionLink action="call" className="eyebrow inline-flex rounded-button border border-line px-6 py-4 hover:border-primary hover:text-primary" />
          </div>
        </div>
        <div data-anim="fade" className="min-h-80 overflow-hidden rounded-image border border-line lg:col-span-7 lg:min-h-0">
          <MapEmbed tone="dark" className="min-h-80" />
        </div>
      </div>
    </section>
  );
}

function VisitBright() {
  const { cafe } = useCafe();
  const h = headingFor(useCafe().cafe, 'visit', { kicker: 'Visit', title: 'Come say hi' });
  const { rows, status } = useHours();
  return (
    <section id={SECTION_IDS.visit} aria-labelledby="visit-title" className="section-y bg-bg text-ink">
      <div className="container-x">
        <BrightHeading id="visit-title" kicker={h.kicker} title={h.title} />
        <div data-anim="stagger" className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border-2 border-ink bg-bg p-5 shadow-[5px_5px_0_var(--c-ink)] sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="display text-step-2">Opening hours</h3>
              <span
                className={`inline-flex -rotate-2 items-center gap-2 rounded-button border-2 border-ink px-3 py-1 text-step-n1 font-bold ${status.open ? 'bg-[#BDF0C8] text-[#0E3B1B]' : 'bg-[#FFD5CC] text-[#5A1608]'}`}
              >
                <StatusDot open={status.open} />
                {status.headline}
              </span>
            </div>
            {status.detail && <p className="mt-2 text-step-n1 text-muted">{status.detail.charAt(0).toUpperCase() + status.detail.slice(1)}</p>}
            <dl className="mt-5 space-y-1">
              {rows.map((r) => (
                <div
                  key={r.day}
                  aria-current={r.isToday ? 'date' : undefined}
                  className={`flex justify-between gap-4 rounded-md px-3 py-2 ${r.isToday ? 'border-2 border-ink bg-accent font-bold text-on-accent' : ''}`}
                >
                  <dt>
                    {r.name.long}
                    {r.isToday && <span className="ml-2 text-step-n1">(today)</span>}
                  </dt>
                  <dd className="text-right tabular-nums"><HoursText row={r} /></dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-col overflow-hidden rounded-lg border-2 border-ink bg-bg shadow-[5px_5px_0_var(--c-ink)]">
            <div className="h-72 border-b-2 border-ink sm:h-80 lg:h-auto lg:flex-1">
              <MapEmbed className="min-h-72" />
            </div>
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <address className="not-italic">{cafe.contact.address}</address>
              <ActionLink action="maps" className="inline-flex shrink-0 rounded-button border-2 border-ink bg-primary px-5 py-3 font-bold text-on-primary" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VisitWarm() {
  const { cafe } = useCafe();
  const h = headingFor(useCafe().cafe, 'visit', { kicker: 'Visit', title: 'Come dine with us' });
  const { rows, status } = useHours();
  return (
    <section id={SECTION_IDS.visit} aria-labelledby="visit-title" className="section-y bg-bg text-ink">
      <div className="container-x">
        <WarmHeading id="visit-title" kicker={h.kicker} title={h.title} />
        <div data-anim="stagger" className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:gap-12">
          <div className="rounded-lg border border-line bg-surface p-6 sm:p-9">
            <h3 className="display text-step-2">Opening hours</h3>
            <p className="mt-3 flex items-center gap-2 text-step-n1">
              <StatusDot open={status.open} />
              <strong className="font-semibold">{status.headline}</strong>
              {status.detail && <span className="text-muted">· {status.detail}</span>}
            </p>
            <dl className="mt-6">
              {rows.map((r) => (
                <div
                  key={r.day}
                  aria-current={r.isToday ? 'date' : undefined}
                  className={`-mx-3 flex justify-between gap-4 rounded-md px-3 py-2.5 ${r.isToday ? 'border-l-4 border-primary bg-primary/10 font-semibold' : ''}`}
                >
                  <dt>{r.name.long}</dt>
                  <dd className="text-right tabular-nums"><HoursText row={r} /></dd>
                </div>
              ))}
            </dl>
            <h3 className="display mt-9 text-step-2">Address</h3>
            <address className="mt-3 not-italic text-muted">{cafe.contact.address}</address>
            <div className="mt-8 flex flex-col gap-3">
              <ActionLink action="call" className="inline-flex rounded-button bg-primary px-6 py-4 font-semibold text-on-primary hover:brightness-110" />
              <ActionLink action="whatsapp" className="inline-flex rounded-button border-2 border-primary px-6 py-[0.875rem] font-semibold text-primary hover:bg-primary hover:text-on-primary" />
              <ActionLink action="maps" className="inline-flex px-6 py-3 font-semibold text-ink underline decoration-primary/40 decoration-2 underline-offset-4 hover:decoration-primary" />
            </div>
          </div>
          <div className="min-h-80 overflow-hidden rounded-lg border border-line">
            <MapEmbed className="min-h-80" />
          </div>
        </div>
      </div>
    </section>
  );
}

export const Visit = byMood('Visit', { 'dark-premium': VisitDark, 'bright-cafe': VisitBright, 'warm-restaurant': VisitWarm });
