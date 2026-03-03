import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header id="main-header" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'
    }`}>
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex items-center justify-between">
        
        {/* LOGO */}
        <div className="relative z-50">
          <Link to="/" className="flex flex-col group">
            <span className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-mauve">
              Natalia Potocka
            </span>
            <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-gold font-medium group-hover:text-mauve/70 transition-colors">
              Doula &amp; Terapia
            </span>
          </Link>
        </div>
        
        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/#about" className="text-mauve/80 hover:text-gold text-sm font-medium uppercase tracking-wider transition-colors relative group">
            O mnie 
            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link to="/#offer" className="text-mauve/80 hover:text-gold text-sm font-medium uppercase tracking-wider transition-colors relative group">
            Oferta 
            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link to="/#reviews" className="text-mauve/80 hover:text-gold text-sm font-medium uppercase tracking-wider transition-colors relative group">
            Opinie 
            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link to="/#contact" className="text-mauve/80 hover:text-gold text-sm font-medium uppercase tracking-wider transition-colors relative group">
            Kontakt 
            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
          </Link>

          <div className="ml-4 flex items-center gap-4">
            <a href="mailto:kontakt@nataliapotocka.pl">
              <button className="group relative inline-flex items-center justify-start cursor-pointer outline-none border-0 h-12 min-w-[12rem] w-auto">
                <span className="circle absolute left-0 top-0 block w-12 h-12 bg-gold transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] group-hover:w-full group-hover:rounded-[1.625rem] z-0" aria-hidden="true">
                  <span className="icon arrow absolute top-0 bottom-0 m-auto left-[0.625rem] w-[1.125rem] h-[0.125rem] bg-white transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:translate-x-2">
                    <span className="absolute -top-[0.29rem] right-[0.0625rem] w-[0.625rem] h-[0.625rem] border-t-[0.125rem] border-r-[0.125rem] border-white rotate-45"></span>
                  </span>
                </span>
                <span className="relative z-10 pl-14 pr-6 font-bold uppercase tracking-wider text-xs md:text-sm text-mauve transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:text-white whitespace-nowrap w-full text-center">
                  Skontaktuj się ze mną
                </span>
              </button>
            </a>

            {user ? (
              <div className="flex items-center gap-4">
                <Link to={user.is_admin ? "/admin" : "/client"} className="w-10 h-10 rounded-full border border-mauve/10 hover:border-gold hover:bg-gold/10 flex items-center justify-center transition-colors group" title={user.is_admin ? "Panel Admina" : "Moje Konto"}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-mauve group-hover:text-gold transition-colors">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path>
                  </svg>
                </Link>
                <button onClick={logout} className="text-sm font-medium text-red-600 flex items-center gap-2 hover:opacity-80" title="Wyloguj">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="w-10 h-10 rounded-full border border-mauve/10 hover:border-gold hover:bg-gold/10 flex items-center justify-center transition-colors group" title="Zaloguj">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-mauve group-hover:text-gold transition-colors">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path>
                </svg>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}