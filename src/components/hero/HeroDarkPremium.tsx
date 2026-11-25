import { SECTION_IDS } from '../../lib/content.ts';
import { useCafe } from '../../theme/ThemeProvider.tsx';
import { CtaButton } from '../CtaButton.tsx';
import { ArrowIcon } from '../icons.tsx';
import { Img } from '../Img.tsx';

/** Full-bleed, cinematic: photo dissolving into ink, editorial Didone headline bottom-left. */
export function HeroDarkPremium() {
  const { cafe } = useCafe();
  return (
    <section id={SECTION_IDS.top} aria-label={cafe.name} className="relative isolate flex min-h-svh flex-col overflow-hidden bg-bg text-ink">
      <Img path={cafe.hero.heroImage} alt="" sizes="100vw" priority className="absolute inset-0 -z-30 h-full w-full object-cover object-center opacity-85" />
      {/* Phones: photo shows at the top, fades into ink under the text. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 sm:hidden"
        style={{
          background:
            'linear-gradient(0deg, rgb(var(--rgb-bg)) 38%, rgb(var(--rgb-bg) / 0.75) 62%, rgb(var(--rgb-bg) / 0.15) 100%), linear-gradient(180deg, rgb(var(--rgb-bg) / 0.6), transparent 18%)',
        }}
      />
      {/* Tablet/desktop: photo on the right, text side dissolves into ink. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 hidden sm:block"
        style={{
          background:
            'linear-gradient(100deg, rgb(var(--rgb-bg)) 8%, rgb(var(--rgb-bg) / 0.82) 42%, rgb(var(--rgb-bg) / 0.15) 100%), linear-gradient(0deg, rgb(var(--rgb-bg)) 2%, transparent 40%), linear-gradient(180deg, rgb(var(--rgb-bg) / 0.6), transparent 20%)',
        }}
      />
      <div aria-hidden className="grain absolute inset-0 -z-10 opacity-[0.09]" />

      <div className="container-x flex flex-1 flex-col justify-end pb-14 pt-32 sm:pb-20">
        <p className="eyebrow flex items-center gap-4 text-primary">
          <span aria-hidden className="h-px w-10 shrink-0 bg-primary sm:w-16" />
          {cafe.tagline}
        </p>
        <h1 className="display mt-6 max-w-[13ch] text-step-6 sm:mt-8">{cafe.hero.headline}</h1>
        <p className="mt-6 max-w-[46ch] text-step-1 text-muted sm:mt-8">{cafe.hero.subheadline}</p>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5 sm:mt-14">
          <CtaButton className="eyebrow inline-flex rounded-button border border-primary bg-primary px-7 py-4 text-on-primary hover:bg-transparent hover:text-primary" />
          <a href={`#${SECTION_IDS.menu}`} className="eyebrow group inline-flex items-center gap-3 py-3 text-ink">
            View the menu <ArrowIcon className="transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
}
