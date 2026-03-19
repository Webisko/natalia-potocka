import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, X } from 'lucide-react';
import BlobArrowIcon from './BlobArrowIcon';

export default function Header() {
  const { user, login, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const accountHref = user?.is_admin ? '/administrator' : '/panel';
  const accountTitle = user?.is_admin ? 'Panel administratora' : 'Moje konto';

  // Scroll-to-hash after navigation
  useEffect(() => {
    if (location.hash) {
      const timeout = setTimeout(() => {
        const el = document.querySelector(location.hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await login(loginEmail, loginPassword);
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
      const dest = res.user.is_admin ? '/administrator' : '/panel';
      navigate(dest);
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Nieprawidłowe dane logowania.');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <>
      <header id="main-header" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-[1440px] mx-auto px-8 md:px-16 flex items-center justify-between">
          
          {/* LOGO */}
          <div className="relative z-50">
            <Link to="/" className="flex flex-col group">
              <span className="font-serif text-fs-title-lg font-bold tracking-tight text-mauve leading-[0.9]">
                Natalia Potocka
              </span>
              <span className="text-fs-label uppercase tracking-[0.3em] text-gold font-medium group-hover:text-mauve/70 transition-colors">
                Terapia &amp; Wsparcie
              </span>
            </Link>
          </div>
          
          {/* DESKTOP NAV – reordered: Oferta → O mnie → Opinie */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/#oferta" className="text-mauve/80 hover:text-terracotta text-fs-ui font-medium uppercase tracking-wider transition-colors relative group">
              Oferta 
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-terracotta transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link to="/o-mnie" className="text-mauve/80 hover:text-terracotta text-fs-ui font-medium uppercase tracking-wider transition-colors relative group">
              O mnie 
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-terracotta transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link to="/#opinie" className="text-mauve/80 hover:text-terracotta text-fs-ui font-medium uppercase tracking-wider transition-colors relative group">
              Opinie 
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-terracotta transition-all duration-300 group-hover:w-full"></span>
            </Link>

            <div className="ml-4 flex items-center gap-4">
              <Link to="/kontakt">
                <button className="group relative inline-flex items-center justify-start cursor-pointer outline-none border-0 h-12 min-w-[12rem] w-auto">
                  <span className="circle absolute left-0 top-0 block w-12 h-12 bg-gold transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] group-hover:w-full group-hover:rounded-[1.625rem] z-0" aria-hidden="true">
                    <BlobArrowIcon />
                  </span>
                  <span className="relative z-10 pl-14 pr-6 font-bold uppercase tracking-wider text-fs-label text-mauve transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:text-white whitespace-nowrap w-full text-center">
                    Skontaktuj się ze mną
                  </span>
                </button>
              </Link>

              {user ? (
                <div className="flex items-center gap-4">
                  <Link to={accountHref} className="w-10 h-10 border border-mauve/10 hover:border-terracotta hover:bg-terracotta/10 flex items-center justify-center transition-all duration-500 group" style={{ borderRadius: '42% 58% 63% 37% / 38% 54% 46% 62%' }} title={accountTitle}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-mauve group-hover:text-terracotta transition-colors">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path>
                    </svg>
                  </Link>
                  <button onClick={logout} className="text-fs-ui font-medium text-red-600 flex items-center gap-2 hover:opacity-80" title="Wyloguj">
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowLoginModal(true)} className="w-10 h-10 border border-mauve/10 hover:border-terracotta hover:bg-terracotta/10 flex items-center justify-center transition-all duration-500 group" style={{ borderRadius: '42% 58% 63% 37% / 38% 54% 46% 62%' }} title="Zaloguj">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-mauve group-hover:text-terracotta transition-colors">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path>
                  </svg>
                </button>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={() => setShowLoginModal(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-mauve/30 backdrop-blur-sm" />
          {/* Modal */}
          <div className="relative z-10 bg-white/95 backdrop-blur-xl w-full max-w-md mx-4 p-10 shadow-2xl" style={{ borderRadius: '30px 30px 30px 30px' }} onClick={(e) => e.stopPropagation()}>
            {/* Decorative blob bg */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-rose/10 rounded-full blur-[50px] pointer-events-none -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/5 rounded-full blur-[40px] pointer-events-none translate-y-1/3 -translate-x-1/3" />

            <button onClick={() => setShowLoginModal(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-mauve/50 hover:text-mauve transition-colors">
              <X size={20} />
            </button>

            <div className="relative z-10">
              <h2 className="text-fs-title-md font-serif text-mauve mb-2">Zaloguj się</h2>
              <p className="text-mauve/50 font-light text-fs-ui mb-8">Witaj ponownie. Wpisz dane swojego konta.</p>

              {loginError && (
                <div className="bg-rose/10 border border-rose/20 text-mauve p-3 rounded-xl text-fs-ui mb-4">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="flex flex-col gap-5">
                <div>
                  <label className="block text-fs-label font-bold text-mauve/70 uppercase tracking-wider mb-2">Adres e-mail</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-5 py-3 bg-nude/80 border border-mauve/10 rounded-xl text-mauve focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/30 transition-all font-light"
                    placeholder="twoj@email.pl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-fs-label font-bold text-mauve/70 uppercase tracking-wider mb-2">Hasło</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-5 py-3 bg-nude/80 border border-mauve/10 rounded-xl text-mauve focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/30 transition-all font-light"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <button type="submit" disabled={loginLoading} className="w-full h-14 mt-2 overflow-hidden rounded-2xl bg-gold text-white font-bold tracking-widest uppercase text-fs-label hover:shadow-xl hover:shadow-gold/20 disabled:opacity-50 transition-all duration-300 transform hover:-translate-y-0.5">
                    {loginLoading ? 'Logowanie...' : 'Zaloguj się'}
                  </button>
                  <div className="text-center mt-3">
                    <Link to="/zapomnialam-hasla" onClick={() => setShowLoginModal(false)} className="text-fs-label text-mauve/50 hover:text-gold transition-colors">
                      Zapomniałaś hasła?
                    </Link>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}