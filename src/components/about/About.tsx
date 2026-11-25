import { storyParagraphs } from '../../config/schema.ts';
import { SECTION_IDS } from '../../lib/content.ts';
import { useCafe } from '../../theme/ThemeProvider.tsx';
import { byMood } from '../byMood.tsx';
import { BrightHeading, DarkHeading, WarmHeading } from '../kit.tsx';
import { Img } from '../Img.tsx';

const alt = (name: string, i: number) => `Inside ${name}, photo ${i + 1}`;

/** Editorial: text left, an asymmetric, overlapping stack of photos right. */
function AboutDark() {
  const { cafe } = useCafe();
  const [a, b, c] = cafe.about.images;
  return (
    <section id={SECTION_IDS.about} aria-labelledby="about-title" className="section-y bg-bg text-ink">
      <div className="container-x grid gap-16 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5 lg:self-center">
          <DarkHeading id="about-title" sectionId={SECTION_IDS.about} kicker="Our story" title={cafe.about.title} />
          <div className="mt-8 max-w-[52ch] space-y-5 text-muted">
            {storyParagraphs(cafe).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>

        <div className="relative pb-[18%] lg:col-span-6 lg:col-start-7">
          <Img path={a} alt={alt(cafe.name, 0)} sizes="(min-width: 1024px) 42vw, 80vw" className="ml-auto aspect-[4/5] w-[80%] rounded-image object-cover" />
          <Img
            path={b}
            alt={alt(cafe.name, 1)}
            sizes="(min-width: 1024px) 22vw, 45vw"
            className="absolute bottom-0 left-0 aspect-square w-[46%] rounded-image border-[10px] border-bg object-cover"
          />
          {c && (
            <Img
              path={c}
              alt={alt(cafe.name, 2)}
              sizes="(min-width: 1024px) 12vw, 25vw"
              className="absolute left-[6%] top-[8%] aspect-[3/4] w-[24%] rounded-image object-cover opacity-90"
            />
          )}
        </div>
      </div>
    </section>
  );
}

/** Playful: story in a tinted rounded card, photos as tilted snapshots. */
function AboutBright() {
  const { cafe } = useCafe();
  const imgs = cafe.about.images;
  const tilt = ['-rotate-3', 'rotate-2', '-rotate-1'];
  return (
    <section id={SECTION_IDS.about} aria-labelledby="about-title" className="section-y bg-bg text-ink">
      <div className="container-x">
        <div className="grid items-center gap-12 rounded-lg border-2 border-ink bg-accent/25 p-6 sm:p-10 lg:grid-cols-2 lg:gap-16 lg:p-14">
          <div>
            <BrightHeading id="about-title" kicker="Our story" tone="primary" title={cafe.about.title} />
            <div className="mt-6 max-w-[50ch] space-y-4 text-step-1 leading-relaxed">
              {storyParagraphs(cafe).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {imgs.map((p, i) => (
              <Img
                key={p}
                path={p}
                alt={alt(cafe.name, i)}
                sizes="(min-width: 1024px) 22vw, 45vw"
                className={`w-full rounded-md border-2 border-ink object-cover shadow-[4px_4px_0_var(--c-ink)] ${tilt[i]} ${
                  imgs.length === 3 && i === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-[4/5]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Family dining: centred welcome, story set in two calm columns, photos in arches. */
function AboutWarm() {
  const { cafe } = useCafe();
  const paras = storyParagraphs(cafe);
  const imgs = cafe.about.images;
  return (
    <section id={SECTION_IDS.about} aria-labelledby="about-title" className="section-y bg-bg text-ink">
      <div className="container-x">
        <WarmHeading id="about-title" kicker="Our story" title={cafe.about.title} />
        <div className={`mx-auto mt-10 max-w-4xl gap-10 text-step-1 text-muted ${paras.length > 1 ? 'md:columns-2' : 'max-w-2xl text-center'}`}>
          {paras.map((p, i) => (
            <p key={i} className="mb-5 break-inside-avoid">
              {p}
            </p>
          ))}
        </div>
        <div className={`mx-auto mt-14 grid max-w-5xl gap-4 sm:gap-6 ${imgs.length === 3 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'}`}>
          {imgs.map((p, i) => (
            <Img
              key={p}
              path={p}
              alt={alt(cafe.name, i)}
              sizes="(min-width: 768px) 30vw, 50vw"
              className={`aspect-[3/4] w-full rounded-t-full rounded-b-image object-cover ${imgs.length === 3 && i === 2 ? 'col-span-2 aspect-[16/9] rounded-t-image md:col-span-1 md:aspect-[3/4] md:rounded-t-full' : ''}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export const About = byMood('About', { 'dark-premium': AboutDark, 'bright-cafe': AboutBright, 'warm-restaurant': AboutWarm });
