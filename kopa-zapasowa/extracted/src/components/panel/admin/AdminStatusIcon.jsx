import { CheckCircle2 } from 'lucide-react';

const TONE_CLASS_NAMES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose/25 bg-rose/10 text-rose-700',
  accent: 'border-gold/20 bg-gold/10 text-gold',
  neutral: 'border-mauve/10 bg-mauve/5 text-mauve/70',
};

export default function AdminStatusIcon({
  title,
  icon: Icon = CheckCircle2,
  tone = 'neutral',
  className = '',
}) {
  return (
    <span
      title={title}
      aria-label={title}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${TONE_CLASS_NAMES[tone] || TONE_CLASS_NAMES.neutral} ${className}`.trim()}
    >
      <Icon size={16} />
    </span>
  );
}