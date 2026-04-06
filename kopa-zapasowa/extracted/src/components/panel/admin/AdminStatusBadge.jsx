const TONE_CLASS_NAMES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose/25 bg-rose/10 text-rose-700',
  accent: 'border-gold/20 bg-gold/10 text-gold',
  neutral: 'border-mauve/10 bg-mauve/5 text-mauve/70',
  webinar: 'border-terracotta/20 bg-terracotta/10 text-terracotta',
  meditation: 'border-mauve/12 bg-mauve/6 text-mauve/75',
  course: 'border-gold/20 bg-gold/10 text-gold',
};

export default function AdminStatusBadge({
  label,
  tone = 'neutral',
  className = '',
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.72rem] font-bold uppercase tracking-[0.14em] ${TONE_CLASS_NAMES[tone] || TONE_CLASS_NAMES.neutral} ${className}`.trim()}
    >
      {label}
    </span>
  );
}