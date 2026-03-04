import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, X } from 'lucide-react';

export default function Header() {
  const { user, login, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const navigate = useNavigate();


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
      const dest = res.user.is_admin ? '/admin' : '/client';
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
            <Link to="/o-mnie" className="text-mauve/80 hover:text-terracotta text-sm font-medium uppercase tracking-wider transition-colors relative group">
              O mnie 
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-terracotta transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link to="/#offer" className="text-mauve/80 hover:text-terracotta text-sm font-medium uppercase tracking-wider transition-colors relative group">
              Oferta 
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-terracotta transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link to="/#reviews" className="text-mauve/80 hover:text-terracotta text-sm font-medium uppercase tracking-wider transition-colors relative group">
              Opinie 
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-terracotta transition-all duration-300 group-hover:w-full"></span>
            </Link>

            <div className="ml-4 flex items-center gap-4">
              <Link to="/#contact">
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
              </Link>

              {user ? (
                <div className="flex items-center gap-4">
                  <Link to={user.is_admin ? "/admin" : "/client"} className="w-10 h-10 border border-mauve/10 hover:border-terracotta hover:bg-terracotta/10 flex items-center justify-center transition-all duration-500 group" style={{ borderRadius: '42% 58% 63% 37% / 38% 54% 46% 62%' }} title={user.is_admin ? "Panel Admina" : "Moje Konto"}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-mauve group-hover:text-terracotta transition-colors">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path>
                    </svg>
                  </Link>
                  <button onClick={logout} className="text-sm font-medium text-red-600 flex items-center gap-2 hover:opacity-80" title="Wyloguj">
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
              <h2 className="text-3xl font-serif text-mauve mb-2">Zaloguj się</h2>
              <p className="text-mauve/50 font-light text-sm mb-8">Witaj ponownie. Wpisz dane swojego konta.</p>

              {loginError && (
                <div className="bg-rose/10 border border-rose/20 text-mauve p-3 rounded-xl text-sm mb-4">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="flex flex-col gap-5">
                <div>
                  <label className="block text-xs font-bold text-mauve/70 uppercase tracking-wider mb-2">Adres e-mail</label>
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
                  <label className="block text-xs font-bold text-mauve/70 uppercase tracking-wider mb-2">Hasło</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-5 py-3 bg-nude/80 border border-mauve/10 rounded-xl text-mauve focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/30 transition-all font-light"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button type="submit" disabled={loginLoading} className="w-full h-14 mt-2 overflow-hidden rounded-2xl bg-gold text-white font-bold tracking-widest uppercase text-sm hover:shadow-xl hover:shadow-gold/20 disabled:opacity-50 transition-all duration-300 transform hover:-translate-y-0.5">
                  {loginLoading ? 'Logowanie...' : 'Zaloguj się'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}