import { imageUrl } from '../../config/registry.ts';
import { useCafe } from '../../theme/ThemeProvider.tsx';
import { CtaButton } from '../CtaButton.tsx';
import { Logo } from '../Logo.tsx';

const Ornament = ({ className = '' }: { className?: string }) => (
  <span aria-hidden className={`flex items-center gap-2 text-primary ${className}`}>
    <span className="h-px w-10 bg-current" />
    <span className="size-1.5 rotate-45 border border-current" />
    <span className="size-2 rotate-45 bg-current" />
    <span className="size-1.5 rotate-45 border border-current" />
    <span className="h-px w-10 bg-current" />
  </span>
);

/** Calm and generous: centred crest, soft serif, photo in an arched frame. */
export function HeroWarmRestaurant() {
  const { cafe } = useCafe();
  return (
    <section className="paper relative flex min-h-svh flex-col bg-bg text-ink">
      <header className="container-x flex justify-center pt-7 sm:pt-10">
        <Logo />
      </header>

      <div className="container-x grid flex-1 items-center gap-14 py-12 lg:grid-cols-[1fr_0.85fr] lg:gap-20">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <p className="eyebrow text-primary">{cafe.tagline}</p>
          <h1 className="display mt-5 max-w-[15ch] text-step-6">{cafe.hero.headline}</h1>
          <Ornament className="my-7" />
          <p className="max-w-[42ch] text-step-1 text-muted">{cafe.hero.subheadline}</p>
          <CtaButton className="mt-10 inline-flex rounded-button bg-primary px-8 py-4 font-semibold tracking-wide text-on-primary shadow-[0_10px_30px_-12px_rgb(var(--rgb-primary))] hover:brightness-110" />
        </div>

        <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
          <div aria-hidden className="absolute inset-0 translate-x-4 translate-y-4 rounded-t-full rounded-b-image border border-primary" />
          <img
            src={imageUrl(cafe.slug, cafe.hero.heroImage)}
            alt=""
            fetchPriority="high"
            className="relative aspect-[3/4] w-full rounded-t-full rounded-b-image object-cover"
          />
        </div>
      </div>
    </section>
  );
}
