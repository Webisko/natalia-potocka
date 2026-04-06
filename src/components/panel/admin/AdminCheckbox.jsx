export default function AdminCheckbox({
  checked,
  onChange,
  label,
  description = '',
  disabled = false,
  className = '',
  boxClassName = '',
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-2xl border border-mauve/10 bg-white/90 px-4 py-4 text-fs-body text-mauve/80 ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} ${className}`.trim()}
    >
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange?.(event.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <span
        className={`mt-0.5 flex h-[18px] w-[18px] items-center justify-center rounded border transition ${checked ? 'border-rose bg-rose shadow-sm shadow-rose/20' : 'border-mauve/30 bg-white'} ${boxClassName}`.trim()}
        aria-hidden="true"
      >
        {checked ? (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
            <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="#ffffff" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      <span className="min-w-0">
        <span className="block text-fs-body leading-6 text-mauve/85">{label}</span>
        {description ? <span className="mt-1 block text-fs-ui leading-6 text-mauve/60">{description}</span> : null}
      </span>
    </label>
  );
}