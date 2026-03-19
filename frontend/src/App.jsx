import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Home from './pages/Home';
import BlobArrowIcon from './components/BlobArrowIcon';
import Header from './components/Header';
import Footer from './components/Footer';

const ProductPage = lazy(() => import('./pages/ProductPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const LegalTermsPage = lazy(() => import('./pages/LegalTermsPage'));
const LegalPrivacyPage = lazy(() => import('./pages/LegalPrivacyPage'));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top on route change if no hash is present in the URL
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}

function RouteLoader() {
  return (
    <div className="text-fs-label flex min-h-[40vh] items-center justify-center px-6 text-center font-bold uppercase tracking-[0.24em] text-mauve/45">
      Ładowanie widoku...
    </div>
  );
}

function RequireAuth({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Ładowanie...</div>;

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requireAdmin && !user.is_admin) {
    return <Navigate to="/panel" replace />;
  }

  return children;
}

function LayoutManager({ children }) {
  const location = useLocation();
  const { logout, user } = useAuth();
  
  const isPanelRoute = location.pathname.startsWith('/administrator') || location.pathname.startsWith('/panel');

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  if (isPanelRoute) {
    let panelTitle = 'Panel użytkownika';
    if (location.pathname.startsWith('/administrator')) panelTitle = 'Panel administratora';

    return (
      <div className="min-h-screen bg-nude flex flex-col">
        <header className="bg-nude border-b border-gold/10 z-50 fixed w-full top-0">
          <div className="max-w-[1200px] mx-auto px-6 py-4 flex justify-between items-center w-full">
            <div className="font-serif text-mauve text-2xl font-bold">
              {panelTitle}
            </div>
            <div className="flex gap-6 items-center">
              {user && (
                <span className="text-sm text-mauve/70 font-light hidden sm:inline-block">
                  Zalogowano: <strong className="font-medium text-mauve">{user.email}</strong>
                </span>
              )}
              <button 
                onClick={handleLogout} 
                className="group relative inline-flex items-center justify-start cursor-pointer outline-none border-0 h-10 min-w-[2.5rem] sm:min-w-[10rem] w-auto">
                <span className="circle absolute left-0 top-0 block w-10 h-10 bg-gold transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] group-hover:w-full group-hover:rounded-[1.25rem] z-0" aria-hidden="true">
                  <BlobArrowIcon wrapperClassName="left-[0.56rem] h-6 w-6" iconClassName="group-hover:translate-x-2" size={16} />
                </span>
                <span className="text-fs-label relative z-10 pl-12 pr-4 font-bold uppercase tracking-wider text-mauve transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:text-white whitespace-nowrap w-full text-center hidden sm:block"> 
                  Wyloguj
                </span>
              </button>
            </div>
          </div>
        </header>
        <main className="flex-grow pt-24 px-4 sm:px-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <ScrollToTop />
        <LayoutManager>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/oferta/:slug" element={<div className="pt-24"><ProductPage /></div>} />
              {/* Legacy redirects */}
              <Route path="/product/:slug" element={<div className="pt-24"><ProductPage /></div>} />
              <Route path="/uslugi/:slug" element={<div className="pt-24"><ProductPage /></div>} />
              <Route path="/produkty/:slug" element={<div className="pt-24"><ProductPage /></div>} />

              <Route path="/o-mnie" element={<div className="pt-24"><AboutPage /></div>} />
              <Route path="/kontakt" element={<div className="pt-24"><ContactPage /></div>} />
              <Route path="/regulamin-sklepu" element={<div className="pt-24"><LegalTermsPage /></div>} />
              <Route path="/polityka-prywatnosci" element={<div className="pt-24"><LegalPrivacyPage /></div>} />
            </Routes>
          </Suspense>
        </LayoutManager>
      </Router>
    </AuthProvider>
  );
}

export default App;
