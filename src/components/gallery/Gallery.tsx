import { SECTION_IDS } from '../../lib/content.ts';
import { useCafe } from '../../theme/ThemeProvider.tsx';
import { byMood } from '../byMood.tsx';
import { Img } from '../Img.tsx';
import { BrightHeading, DarkHeading, WarmHeading } from '../kit.tsx';

const useGallery = () => {
  const { cafe } = useCafe();
  return cafe.gallery.map((path, i) => ({ path, alt: `${cafe.name}, photo ${i + 1} of ${cafe.gallery.length}` }));
};

/*
 * dark-premium: an asymmetric editorial grid. Desktop repeats a 6-tile rhythm on a 6-column grid;
 * phones use 2 columns with every third tile full width.
 */
const DARK_SPANS = [
  'col-span-2 sm:col-span-4 sm:row-span-2',
  'col-span-1 sm:col-span-2',
  'col-span-1 sm:col-span-2',
  'col-span-2 sm:col-span-2 sm:row-span-2',
  'col-span-1 sm:col-span-4',
  'col-span-1 sm:col-span-4',
];
const DARK_SIZES = ['(min-width: 640px) 66vw, 100vw', '(min-width: 640px) 33vw, 50vw', '(min-width: 640px) 33vw, 50vw', '(min-width: 640px) 33vw, 100vw', '(min-width: 640px) 66vw, 50vw', '(min-width: 640px) 66vw, 50vw'];

function GalleryDark() {
  const imgs = useGallery();
  return (
    <section id={SECTION_IDS.gallery} aria-labelledby="gallery-title" className="section-y border-t border-line bg-bg text-ink">
      <div className="container-x">
        <DarkHeading id="gallery-title" sectionId={SECTION_IDS.gallery} kicker="Gallery" title="After hours" />
        <ul className="mt-14 grid grid-flow-dense auto-rows-[44vw] grid-cols-2 gap-3 sm:mt-20 sm:auto-rows-[clamp(9rem,17vw,15rem)] sm:grid-cols-6 sm:gap-4">
          {imgs.map(({ path, alt }, i) => (
            <li key={path} className={DARK_SPANS[i % 6]}>
              <Img path={path} alt={alt} sizes={DARK_SIZES[i % 6]} className="h-full w-full rounded-image object-cover saturate-[0.85]" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Masonry of tilted, bordered snapshots. */
function GalleryBright() {
  const imgs = useGallery();
  const aspect = ['aspect-[4/5]', 'aspect-square', 'aspect-[4/3]', 'aspect-[3/4]', 'aspect-[5/4]', 'aspect-square'];
  const tilt = ['-rotate-1', 'rotate-1', 'rotate-0', 'rotate-1', '-rotate-1', 'rotate-0'];
  return (
    <section id={SECTION_IDS.gallery} aria-labelledby="gallery-title" className="section-y bg-bg text-ink">
      <div className="container-x">
        <BrightHeading id="gallery-title" kicker="Gallery" title="Snapshots" />
        <ul className="mt-10 columns-2 gap-4 sm:gap-6 lg:columns-3">
          {imgs.map(({ path, alt }, i) => (
            <li key={path} className="mb-4 break-inside-avoid sm:mb-6">
              <Img
                path={path}
                alt={alt}
                sizes="(min-width: 1024px) 24rem, 50vw"
                className={`w-full rounded-md border-2 border-ink object-cover shadow-[4px_4px_0_var(--c-ink)] ${aspect[i % 6]} ${tilt[i % 6]}`}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const MD_SPAN: Record<number, string> = { 1: 'md:col-span-1', 2: 'md:col-span-2', 4: 'md:col-span-4' };
const MD_ASPECT: Record<number, string> = { 1: 'md:aspect-square', 2: 'md:aspect-[2/1]', 4: 'md:aspect-[4/1]' };

/** Lead photo is 2×2; the last tiles widen to fill the final row (2 columns on phones, 4 from md). */
function warmTile(i: number, n: number): { li: string; img: string } {
  if (i === 0) return { li: 'col-span-2 row-span-2', img: 'aspect-square' };
  const rest = n - 1;
  const idx = i - 1;
  const wideOnPhone = rest % 2 === 1 && idx === rest - 1;
  const left = rest % 4;
  const start = rest - left;
  let span = 1;
  if (idx >= start) span = left === 1 ? 4 : left === 2 ? 2 : left === 3 && idx === start ? 2 : 1;
  return {
    li: `${wideOnPhone ? 'col-span-2' : 'col-span-1'} ${MD_SPAN[span]}`,
    img: `${wideOnPhone ? 'aspect-[2/1]' : 'aspect-square'} ${MD_ASPECT[span]}`,
  };
}

/** Calm, even grid with a large lead photo. */
function GalleryWarm() {
  const imgs = useGallery();
  return (
    <section id={SECTION_IDS.gallery} aria-labelledby="gallery-title" className="section-y bg-surface text-ink">
      <div className="container-x">
        <WarmHeading id="gallery-title" kicker="Gallery" title="A look inside" />
        <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
          {imgs.map(({ path, alt }, i) => {
            const t = warmTile(i, imgs.length);
            return (
              <li key={path} className={t.li}>
                <Img
                  path={path}
                  alt={alt}
                  sizes={i === 0 ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 768px) 25vw, 50vw'}
                  className={`h-full w-full rounded-image object-cover ${t.img}`}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export const Gallery = byMood('Gallery', { 'dark-premium': GalleryDark, 'bright-cafe': GalleryBright, 'warm-restaurant': GalleryWarm });
