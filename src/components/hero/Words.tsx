/**
 * The hero headline, one span per word: the prerendered page animates the words in with plain CSS before
 * any JavaScript has loaded (scripts/lib/shellIntro.ts), and React must render the same markup to hydrate it.
 */
export function Words({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  return words.map((w, i) => (
    <span key={i}>
      {i > 0 && ' '}
      <span className="sw">{w}</span>
    </span>
  ));
}
