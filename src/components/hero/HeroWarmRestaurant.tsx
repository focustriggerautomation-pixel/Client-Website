import { SECTION_IDS } from '../../lib/content.ts';
import { useCafe } from '../../theme/ThemeProvider.tsx';
import { ActionLink } from '../ActionLink.tsx';
import { Hero3D } from '../../hero3d/Hero3D.tsx';
import { Img } from '../Img.tsx';
import { OpenStatus } from '../OpenStatus.tsx';
import { Ornament } from '../Ornament.tsx';

/** Welcoming: a big food photo, soft serif, and the two things diners want — call to reserve, order on WhatsApp. */
export function HeroWarmRestaurant() {
  const { cafe } = useCafe();
  return (
    <section id={SECTION_IDS.top} aria-label={cafe.name} className="paper relative overflow-x-clip bg-bg pt-[4.5rem] text-ink md:pt-20">
      <div className="lg:grid lg:min-h-[calc(100svh-5rem)] lg:grid-cols-[1.2fr_1fr]">
        <div data-parallax="1.4" className="relative px-3 pt-3 sm:px-6 sm:pt-6 lg:order-2 lg:p-0">
          <Img
            path={cafe.hero.heroImage}
            alt={`${cafe.name}: ${cafe.hero.headline}`}
            sizes="(min-width: 1024px) 55vw, 100vw"
            priority
            data-hero="media"
            className="aspect-[4/3] w-full rounded-image object-cover sm:aspect-[16/10] lg:aspect-auto lg:h-full lg:rounded-none lg:rounded-bl-[7rem]"
          />
          {/* 3D plate over the food photo (above the headline on phones). */}
          <Hero3D className="absolute -bottom-4 left-1/2 aspect-square w-[66%] max-w-[22rem] -translate-x-1/2 sm:w-[44%] lg:bottom-6 lg:left-6 lg:w-[66%] lg:max-w-[36rem] lg:translate-x-0" />
        </div>

        <div className="flex flex-col items-center px-[clamp(1.25rem,5vw,3rem)] pb-16 pt-10 text-center lg:items-start lg:justify-center lg:py-16 lg:pl-[max(3rem,calc((100vw-var(--container))/2+3rem))] lg:pr-12 lg:text-left">
          <p data-hero="kicker" className="eyebrow text-primary">{cafe.tagline}</p>
          <h1 data-hero="title" className="display mt-5 max-w-[16ch] text-step-6">{cafe.hero.headline}</h1>
          <Ornament className="my-7" data-hero="deco" />
          <p data-hero="sub" className="max-w-[42ch] text-step-1 text-muted">{cafe.hero.subheadline}</p>

          <div data-hero="cta" className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ActionLink action="call" className="inline-flex rounded-button bg-primary px-7 py-4 font-semibold text-on-primary shadow-[0_12px_30px_-14px_rgb(var(--rgb-primary))] hover:brightness-110" />
            <ActionLink action="whatsapp" className="inline-flex rounded-button border-2 border-primary px-7 py-[0.875rem] font-semibold text-primary hover:bg-primary hover:text-on-primary" />
          </div>
          <a data-hero="cta" href={`#${SECTION_IDS.menu}`} className="mt-6 font-semibold text-ink underline decoration-primary/40 decoration-2 underline-offset-[6px] hover:decoration-primary">
            Browse the menu
          </a>
          <div data-hero="cta">
            <OpenStatus className="mt-8 text-step-n1 text-muted" />
          </div>
        </div>
      </div>
    </section>
  );
}
