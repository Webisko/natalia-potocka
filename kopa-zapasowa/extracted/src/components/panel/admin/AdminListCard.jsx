export default function AdminListCard({
  title,
  count,
  description = '',
  action = null,
  children,
  className = '',
  bodyClassName = '',
}) {
  return (
    <section className={`overflow-hidden rounded-[40px] border border-white/80 bg-white/60 shadow-sm ${className}`.trim()}>
      <div className="flex flex-col gap-4 border-b border-gold/5 px-8 py-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-serif text-fs-title-sm text-mauve">
            {title}{' '}
            {typeof count === 'number' ? <span className="text-mauve/45">({count})</span> : null}
          </h2>
          {description ? <p className="mt-1 text-fs-body leading-7 text-mauve/60">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}