import { Words } from './Words.tsx';
import { SECTION_IDS } from '../../lib/content.ts';
import { useCafe } from '../../theme/ThemeProvider.tsx';
import { CtaButton } from '../CtaButton.tsx';
import { Hero3D } from '../../hero3d/Hero3D.tsx';
import { useMedia } from '../../lib/useMedia.ts';
import { Img } from '../Img.tsx';
import { OpenStatus } from '../OpenStatus.tsx';

export const POP =
  'border-2 border-ink shadow-[4px_4px_0_var(--c-ink)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--c-ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_var(--c-ink)]';

/** Sunny split layout: chunky headline, sticker tagline, tilted photo card with hard shadow. */
export function HeroBrightCafe() {
  const { cafe } = useCafe();
  // Placement is CSS-responsive (prerender-safe, no layout jump): above the headline on phones, out of the photo
  // card on desktop. Only the visible placement may mount WebGL, so there is never more than one context.
  const desktop = useMedia('(min-width: 1024px)');
  return (
    <section id={SECTION_IDS.top} aria-label={cafe.name} className="relative overflow-hidden bg-bg pt-24 text-ink sm:pt-28">
      <div className="container-x grid items-center gap-14 pb-16 pt-6 lg:min-h-[calc(100svh-7rem)] lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pb-20">
        <div>
          <Hero3D allow3d={!desktop} className="relative mx-auto mb-3 aspect-square w-[64%] max-w-[17rem] lg:hidden" />
          <span
            data-hero="kicker"
            className="inline-block -rotate-3 rounded-button border-2 border-ink bg-accent px-4 py-1.5 text-step-n1 font-bold text-on-accent shadow-[3px_3px_0_var(--c-ink)]"
          >
            {cafe.tagline}
          </span>
          <h1 data-hero="title" className="display mt-7 max-w-[14ch] text-step-6">
            <Words text={cafe.hero.headline} />
          </h1>
          <p data-hero="sub" className="mt-6 max-w-[40ch] text-step-1 text-muted">
            {cafe.hero.subheadline}
          </p>
          <div data-hero="cta" className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            <CtaButton className={`inline-flex rounded-button bg-primary px-8 py-4 text-step-1 font-bold text-on-primary ${POP}`} />
            <a href={`#${SECTION_IDS.menu}`} className="font-bold underline decoration-accent decoration-4 underline-offset-4 hover:decoration-primary">
              See the menu
            </a>
          </div>
          <div data-hero="cta">
            <OpenStatus className="mt-8 rounded-button border-2 border-ink bg-bg px-4 py-2 text-step-n1" />
          </div>
        </div>

        <div data-parallax="1.2" className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div aria-hidden data-hero="deco" data-parallax="-2.4" className="absolute -right-8 -top-8 size-40 rounded-full bg-accent sm:size-56" />
          <div aria-hidden data-hero="deco" data-parallax="2.8" className="absolute -bottom-6 -left-5 size-16 rounded-full border-2 border-ink bg-primary sm:size-24" />
          <Img
            path={cafe.hero.heroImage}
            alt={`${cafe.name}: ${cafe.hero.headline}`}
            sizes="(min-width: 1024px) 45vw, (min-width: 640px) 28rem, 90vw"
            priority
            data-hero="media"
            className="relative aspect-[4/5] w-full rotate-2 rounded-image border-[3px] border-ink object-cover shadow-[10px_10px_0_var(--c-ink)] lg:aspect-[5/6]"
          />
          <Hero3D allow3d={desktop} className="absolute -bottom-24 -left-36 hidden aspect-square w-[82%] lg:block" />
        </div>
      </div>
    </section>
  );
}
