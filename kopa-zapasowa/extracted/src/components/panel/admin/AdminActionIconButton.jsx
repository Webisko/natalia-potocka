export default function AdminActionIconButton({
  title,
  onClick,
  icon,
  tone = 'default',
  disabled = false,
  className = '',
}) {
  const toneClassName = {
    default: 'border-mauve/15 bg-white text-mauve/70 hover:border-gold/35 hover:text-mauve hover:shadow-sm',
    accent: 'border-gold/20 bg-gold/5 text-gold/80 hover:border-gold/35 hover:bg-gold/10 hover:text-gold',
    danger: 'border-rose/35 bg-rose/12 text-mauve/75 hover:border-rose/55 hover:bg-rose/20 hover:text-mauve hover:shadow-sm hover:shadow-rose/15',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all disabled:cursor-not-allowed disabled:opacity-40 ${toneClassName[tone] || toneClassName.default} ${className}`.trim()}
    >
      {icon}
    </button>
  );
}