/** Small diamond divider used by the warm-restaurant mood. */
export const Ornament = ({ className = '', ...data }: { className?: string; [k: `data-${string}`]: string | undefined }) => (
  <span aria-hidden className={`flex items-center gap-2 text-primary ${className}`} {...data}>
    <span className="h-px w-10 bg-current" />
    <span className="size-1.5 rotate-45 border border-current" />
    <span className="size-2 rotate-45 bg-current" />
    <span className="size-1.5 rotate-45 border border-current" />
    <span className="h-px w-10 bg-current" />
  </span>
);
