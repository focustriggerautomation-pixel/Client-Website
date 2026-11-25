import { imageUrl } from '../../config/registry.ts';
import { useCafe } from '../../theme/ThemeProvider.tsx';
import { CtaButton } from '../CtaButton.tsx';
import { Logo } from '../Logo.tsx';

/** Sunny split layout: chunky headline, sticker tagline, tilted photo card with hard shadow. */
export function HeroBrightCafe() {
  const { cafe } = useCafe();
  const pop = 'border-2 border-ink shadow-[4px_4px_0_var(--c-ink)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--c-ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_var(--c-ink)]';
  return (
    <section className="relative flex min-h-svh flex-col overflow-hidden bg-bg text-ink">
      <header className="container-x flex items-center justify-between gap-4 pt-5 sm:pt-7">
        <Logo />
        <CtaButton className={`hidden rounded-button bg-bg px-5 py-2.5 text-step-n1 font-bold sm:inline-flex ${pop}`} />
      </header>

      <div className="container-x grid flex-1 items-center gap-14 py-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-16">
        <div>
          <span className="inline-block -rotate-3 rounded-button border-2 border-ink bg-accent px-4 py-1.5 text-step-n1 font-bold text-on-accent shadow-[3px_3px_0_var(--c-ink)]">
            {cafe.tagline}
          </span>
          <h1 className="display mt-7 max-w-[14ch] text-step-6">{cafe.hero.headline}</h1>
          <p className="mt-6 max-w-[40ch] text-step-1 text-muted">{cafe.hero.subheadline}</p>
          <CtaButton className={`mt-10 inline-flex rounded-button bg-primary px-8 py-4 text-step-1 font-bold text-on-primary ${pop}`} />
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div aria-hidden className="absolute -right-8 -top-8 size-40 rounded-full bg-accent sm:size-56" />
          <div aria-hidden className="absolute -bottom-6 -left-5 size-16 rounded-full border-2 border-ink bg-primary sm:size-24" />
          <img
            src={imageUrl(cafe.slug, cafe.hero.heroImage)}
            alt=""
            fetchPriority="high"
            className="relative aspect-[4/5] w-full rotate-2 rounded-image border-[3px] border-ink object-cover shadow-[10px_10px_0_var(--c-ink)] lg:aspect-[5/6]"
          />
        </div>
      </div>
    </section>
  );
}
