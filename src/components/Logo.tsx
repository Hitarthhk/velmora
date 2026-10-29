/** The supplied wordmark in wide placements; standalone symbol in compact ones. */
export function Logo({ className, symbol = false }: { className?: string; symbol?: boolean }) {
  if (symbol) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/media/identity/velmora-symbol.webp" width={384} height={384} alt="" aria-hidden="true" className={className} style={{ display: "block", height: "auto" }} decoding="async" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/media/identity/velmora-logo.webp" srcSet="/media/identity/velmora-logo-small.webp 320w, /media/identity/velmora-logo.webp 640w" sizes="220px" width={640} height={271} alt="Velmora" className={className} style={{ display: "block", height: "auto" }} decoding="async" />
  );
}
