import { SECTION_IDS } from '../../lib/content.ts';
import { useCafe } from '../../theme/ThemeProvider.tsx';
import { ActionLink } from '../ActionLink.tsx';
import { byMood } from '../byMood.tsx';
import { CtaButton } from '../CtaButton.tsx';
import { POP } from '../hero/HeroBrightCafe.tsx';
import { Ornament } from '../Ornament.tsx';

function ContactDark() {
  const { cafe } = useCafe();
  return (
    <section id={SECTION_IDS.contact} aria-labelledby="contact-title" className="section-y relative isolate overflow-hidden border-t border-line bg-surface text-ink">
      <div aria-hidden className="grain absolute inset-0 -z-10 opacity-[0.07]" />
      <div className="container-x text-center">
        <p className="eyebrow text-primary">{cafe.tagline}</p>
        <h2 id="contact-title" className="display mx-auto mt-6 max-w-[16ch] text-step-6">
          {cafe.cta.headline ?? `See you at ${cafe.name}.`}
        </h2>
        <div className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row">
          <CtaButton className="eyebrow inline-flex rounded-button border border-primary bg-primary px-8 py-4 text-on-primary hover:bg-transparent hover:text-primary" />
          {cafe.cta.action !== 'call' && <ActionLink action="call" className="eyebrow inline-flex px-6 py-4 text-muted hover:text-ink" />}
          {cafe.cta.action === 'call' && <ActionLink action="whatsapp" className="eyebrow inline-flex px-6 py-4 text-muted hover:text-ink" />}
        </div>
      </div>
    </section>
  );
}

function ContactBright() {
  const { cafe } = useCafe();
  return (
    <section id={SECTION_IDS.contact} aria-labelledby="contact-title" className="bg-bg pb-[var(--space-section)] text-ink">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-lg border-2 border-ink bg-primary px-6 py-14 text-center text-on-primary shadow-[8px_8px_0_var(--c-ink)] sm:px-12 sm:py-20">
          <span aria-hidden className="absolute -left-10 -top-10 size-36 rounded-full border-2 border-ink bg-accent" />
          <span aria-hidden className="absolute -bottom-12 -right-6 size-44 rounded-full border-2 border-ink bg-accent/70" />
          <h2 id="contact-title" className="display relative mx-auto max-w-[16ch] text-step-6">
            {cafe.cta.headline ?? `See you soon at ${cafe.name}!`}
          </h2>
          <div className="relative mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <CtaButton className={`inline-flex rounded-button bg-bg px-8 py-4 text-step-1 font-bold text-ink ${POP}`} />
            <ActionLink action={cafe.cta.action === 'whatsapp' ? 'call' : 'whatsapp'} className={`inline-flex rounded-button bg-accent px-7 py-4 font-bold text-on-accent ${POP}`} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactWarm() {
  const { cafe } = useCafe();
  return (
    <section id={SECTION_IDS.contact} aria-labelledby="contact-title" className="paper section-y bg-primary text-on-primary">
      <div className="container-x flex flex-col items-center text-center">
        <p className="eyebrow opacity-80">{cafe.tagline}</p>
        <h2 id="contact-title" className="display mt-5 max-w-[18ch] text-step-5">
          {cafe.cta.headline ?? `Your table at ${cafe.name} is waiting.`}
        </h2>
        <Ornament className="mt-7 !text-on-primary opacity-70" />
        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <ActionLink action="call" className="inline-flex rounded-button bg-bg px-8 py-4 font-semibold text-primary hover:brightness-105" />
          <ActionLink action="whatsapp" className="inline-flex rounded-button border-2 border-on-primary/70 px-8 py-[0.875rem] font-semibold hover:bg-on-primary hover:text-primary" />
        </div>
      </div>
    </section>
  );
}

export const ContactBand = byMood('ContactBand', { 'dark-premium': ContactDark, 'bright-cafe': ContactBright, 'warm-restaurant': ContactWarm });
