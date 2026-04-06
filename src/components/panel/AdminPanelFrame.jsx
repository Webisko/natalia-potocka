import { useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import BlobArrowIcon from './BlobArrowIcon.jsx';

function AdminFrameContent({ children, title }) {
  const { logout, user, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      window.location.replace('/logowanie');
      return;
    }

    if (!user.is_admin) {
      window.location.replace('/panel');
    }
  }, [loading, user]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  if (loading || !user || !user.is_admin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center text-fs-label font-bold uppercase tracking-[0.24em] text-mauve/45">
        Ładowanie panelu administratora...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nude flex flex-col">
      <header className="fixed top-0 z-50 w-full border-b border-gold/10 bg-nude">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-4">
          <div className="font-serif text-fs-title-sm font-bold text-mauve">{title}</div>
          <div className="flex items-center gap-6">
            <span className="hidden text-fs-ui font-light text-mauve/70 sm:inline-block">
              Zalogowano: <strong className="font-medium text-mauve">{user.email}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="group relative inline-flex h-10 min-w-[2.5rem] w-auto cursor-pointer items-center justify-start border-0 outline-none sm:min-w-[10rem]"
            >
              <span
                className="circle absolute left-0 top-0 block h-10 w-10 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-gold transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:w-full group-hover:rounded-[1.25rem] z-0"
                aria-hidden="true"
              >
                <BlobArrowIcon wrapperClassName="left-[0.56rem] h-6 w-6" iconClassName="group-hover:translate-x-2" size={16} />
              </span>
              <span className="relative z-10 hidden w-full whitespace-nowrap pl-12 pr-4 text-center text-fs-label font-bold uppercase tracking-wider text-mauve transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:text-white sm:block">
                Wyloguj
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow px-4 pt-24 sm:px-6">
        {children}
      </main>
    </div>
  );
}

export default function AdminPanelFrame({ children, title = 'Panel administratora' }) {
  return (
    <AuthProvider>
      <AdminFrameContent title={title}>{children}</AdminFrameContent>
    </AuthProvider>
  );
}