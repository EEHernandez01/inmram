export function GlobalSearch() {
  return (
    <form action="/buscar" className="relative w-full max-w-xl" role="search">
      <label className="sr-only" htmlFor="global-search">Buscar en el sistema</label>
      <svg aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-secondary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>
      <input autoComplete="off" className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-20 text-sm text-ink placeholder:text-ink-secondary/75 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15" id="global-search" maxLength={100} name="q" placeholder="Buscar propiedad, unidad o inquilino" type="search" />
      <kbd aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-bg px-1.5 py-0.5 text-[10px] text-ink-secondary">↵</kbd>
    </form>
  );
}
