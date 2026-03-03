import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'secondary' | 'glass';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  // Determine colors based on variant
  // Primary/Glass = Gold Blob
  // Outline/Secondary = Mauve Blob
  const isGold = variant === 'primary' || variant === 'glass';
  const circleBg = isGold ? 'bg-gold' : 'bg-mauve';
  
  return (
    <button 
      className={`
        group relative inline-flex items-center justify-start cursor-pointer outline-none border-0 
        h-12 ${fullWidth ? 'w-full' : 'w-auto'} min-w-[12rem]
        ${className}
      `}
      {...props}
    >
      {/* 
         THE CIRCLE / BLOB BACKGROUND 
         - Positioned absolutely to sit behind text
         - Starts as w-12 (circle)
         - Expands to w-full on hover
      */}
      <span 
        className={`
          circle absolute left-0 top-0 block w-12 h-12 ${circleBg}
          transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)]
          rounded-[40%_60%_70%_30%/40%_50%_60%_50%]
          group-hover:w-full group-hover:rounded-[1.625rem] z-0
        `} 
        aria-hidden="true"
      >
        {/* THE ARROW ICON */}
        <span className="icon arrow absolute top-0 bottom-0 m-auto left-[0.625rem] w-[1.125rem] h-[0.125rem] bg-white transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:translate-x-2">
           {/* Arrow Head */}
           <span className="absolute -top-[0.29rem] right-[0.0625rem] w-[0.625rem] h-[0.625rem] border-t-[0.125rem] border-r-[0.125rem] border-white rotate-45"></span>
        </span>
      </span>
      
      {/* THE TEXT */}
      {/* 
          - Relative positioning to sit on top of the blob
          - Left padding to clear the initial circle shape
          - whitespace-nowrap to prevent wrapping
      */}
      <span className="relative z-10 pl-14 pr-6 font-bold uppercase tracking-wider text-xs md:text-sm text-mauve transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:text-white whitespace-nowrap w-full text-center">
        {children}
      </span>
    </button>
  );
};