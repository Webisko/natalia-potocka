import { X } from 'lucide-react';

export default function AdminModalShell({
  eyebrow,
  title,
  description = '',
  onClose,
  children,
  footer = null,
  maxWidthClassName = 'max-w-6xl',
  bodyClassName = '',
  dialogClassName = '',
  alignClassName = 'items-center',
  overlayClassName = 'bg-mauve/45',
  zIndexClassName = 'z-[90]',
}) {
  return (
    <div className={`fixed inset-0 ${zIndexClassName} flex justify-center px-4 py-8 backdrop-blur-sm ${alignClassName} ${overlayClassName}`.trim()}>
      <div className={`flex max-h-[92vh] w-full ${maxWidthClassName} flex-col overflow-hidden rounded-[32px] border border-white/70 bg-[#FCF9F7] shadow-2xl shadow-mauve/15 ${dialogClassName}`.trim()}>
        <div className="flex items-start justify-between border-b border-gold/10 px-6 py-5 md:px-8">
          <div>
            {eyebrow ? <p className="text-fs-label font-bold uppercase tracking-[0.24em] text-gold/80">{eyebrow}</p> : null}
            <h2 className="mt-2 font-serif text-fs-title-md text-mauve">{title}</h2>
            {description ? <p className="mt-2 max-w-2xl text-fs-body leading-7 text-mauve/60">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-mauve/10 bg-white text-mauve/50 transition hover:border-mauve/20 hover:text-mauve"
            title="Zamknij"
          >
            <X size={18} />
          </button>
        </div>

        <div className={`admin-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-8 ${bodyClassName}`.trim()}>{children}</div>

        {footer ? (
          <div className="border-t border-gold/10 bg-[#FCF9F7]/95 px-6 py-5 backdrop-blur-sm md:px-8">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}