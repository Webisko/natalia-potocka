import { ArrowRight } from 'lucide-react';

export default function PanelBlobButton({
  children,
  tone = 'primary',
  icon,
  className = '',
  minWidthClassName = 'min-w-[12rem]',
  href,
  target,
  rel,
  download,
  type = 'button',
  disabled = false,
  ...props
}) {
  const Component = href ? 'a' : 'button';
  const blobClassName = tone === 'secondary' ? 'bg-mauve' : tone === 'tertiary' ? 'bg-terracotta' : 'bg-gold';
  const blobShapeClassName = tone === 'secondary'
    ? 'rounded-[60%_40%_30%_70%/60%_30%_70%_40%]'
    : tone === 'tertiary'
      ? 'rounded-[35%_65%_63%_37%/42%_43%_57%_58%]'
      : 'rounded-[40%_60%_70%_30%/40%_50%_60%_50%]';
  const content = icon || <ArrowRight size={18} strokeWidth={2.25} />;

  return (
    <Component
      href={href}
      target={target}
      rel={rel}
      download={download}
      type={href ? undefined : type}
      disabled={href ? undefined : disabled}
      className={`group/cta relative inline-flex h-12 max-w-full items-center justify-start overflow-hidden border-0 outline-none ${minWidthClassName} ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} ${className}`}
      {...props}
    >
      <span
        className={`absolute left-0 top-0 z-0 block h-12 w-12 transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover/cta:w-full group-hover/cta:rounded-[1.625rem] ${blobClassName} ${blobShapeClassName}`}
        aria-hidden="true"
      >
        <span className="absolute inset-y-0 left-[0.72rem] z-10 my-auto flex h-7 w-7 items-center justify-center text-white transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover/cta:translate-x-2">
          {content}
        </span>
      </span>
      <span className="relative z-10 w-full whitespace-nowrap pl-14 pr-5 text-center text-fs-label font-bold uppercase tracking-wider text-mauve transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover/cta:text-white md:pr-6">
        {children}
      </span>
    </Component>
  );
}