import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="fixed bottom-8 right-8 z-40">
      <button
        type="button"
        onClick={scrollToTop}
        className={`
          group flex items-center justify-center w-14 h-14 
          bg-white/80 backdrop-blur-sm border border-gold/30 shadow-lg text-mauve 
          hover:bg-gold hover:text-white hover:border-gold hover:-translate-y-1
          transition-all duration-700 ease-in-out transform hover:!rounded-full
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}
        `}
        style={{
          // Organic shape (soft rounded square/pebble)
          borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' 
        }}
        aria-label="Wróć na górę"
      >
        <ArrowUp className="w-6 h-6 transition-transform duration-700 ease-in-out group-hover:-translate-y-0.5" />
        
        {/* Decorative glint */}
        <span className="absolute top-2 right-3 w-2 h-2 bg-white/40 rounded-full blur-[1px]"></span>
      </button>
    </div>
  );
};