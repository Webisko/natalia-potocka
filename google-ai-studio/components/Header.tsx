import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from './Button';

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'O mnie', href: '#about' },
    { name: 'Oferta', href: '#offer' },
    { name: 'Opinie', href: '#reviews' },
    { name: 'Kontakt', href: '#contact' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-md shadow-sm py-4 border-b border-white/50' 
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex items-center justify-between">
        
        {/* LOGO */}
        <div className="relative z-50">
          <a href="#" className="flex flex-col group">
            <span className={`font-serif text-2xl md:text-3xl font-bold tracking-tight transition-colors ${isScrolled ? 'text-mauve' : 'text-mauve'}`}>
              Natalia Potocka
            </span>
            <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-gold font-medium group-hover:text-mauve/70 transition-colors">
              Doula & Terapia
            </span>
          </a>
        </div>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              className="text-mauve/80 hover:text-gold text-sm font-medium uppercase tracking-wider transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
            </a>
          ))}
          {/* Constrain width of the button in the header */}
          <Button variant={isScrolled ? 'primary' : 'outline'} className="ml-4">
            Skontaktuj się ze mną
          </Button>
        </nav>

        {/* MOBILE MENU TOGGLE */}
        <button 
          className="md:hidden relative z-50 text-mauve hover:text-gold transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
        </button>

        {/* MOBILE MENU OVERLAY */}
        <div className={`fixed inset-0 bg-nude/95 backdrop-blur-xl z-40 flex flex-col items-center justify-center space-y-8 transition-all duration-500 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
        }`}>
           {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              className="text-2xl font-serif text-mauve hover:text-gold transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <Button className="mt-8" onClick={() => setIsMobileMenuOpen(false)}>
            Skontaktuj się ze mną
          </Button>
        </div>

      </div>
    </header>
  );
};