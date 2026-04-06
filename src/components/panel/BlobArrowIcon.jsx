import { ArrowRight } from 'lucide-react';

export default function BlobArrowIcon({
  className = '',
  wrapperClassName = 'left-[0.72rem] h-7 w-7',
  iconClassName = 'group-hover:translate-x-2',
  size = 18,
  strokeWidth = 2.25,
}) {
  return (
    <span
      className={`absolute inset-y-0 ${wrapperClassName} z-10 my-auto flex items-center justify-center ${className}`.trim()}
      aria-hidden="true"
    >
      <ArrowRight
        size={size}
        strokeWidth={strokeWidth}
        className={`text-white transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] ${iconClassName}`.trim()}
      />
    </span>
  );
}