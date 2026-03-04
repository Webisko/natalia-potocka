import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import AdminProductEdit from './pages/AdminProductEdit';
import ClientDashboard from './pages/ClientDashboard';
import ProductPage from './pages/ProductPage';
import AboutPage from './pages/AboutPage';

import Header from './components/Header';
import Footer from './components/Footer';
import AdminReviews from './pages/AdminReviews';

function RequireAuth({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Ładowanie...</div>;

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requireAdmin && !user.is_admin) {
    return <Navigate to="/client" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <div className="min-h-screen bg-background flex flex-col">
          <Header />
          <main className="flex-grow relative z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/oferta/:slug" element={<div className="pt-24"><ProductPage /></div>} />
              {/* Legacy redirects */}
              <Route path="/product/:slug" element={<div className="pt-24"><ProductPage /></div>} />
              <Route path="/uslugi/:slug" element={<div className="pt-24"><ProductPage /></div>} />
              <Route path="/produkty/:slug" element={<div className="pt-24"><ProductPage /></div>} />

              <Route path="/o-mnie" element={<div className="pt-24"><AboutPage /></div>} />

              <Route path="/admin" element={
                <RequireAuth requireAdmin={true}>
                  <div className="pt-24"><AdminDashboard /></div>
                </RequireAuth>
              } />

              <Route path="/admin/reviews" element={
                <RequireAuth requireAdmin={true}>
                  <div className="pt-24"><AdminReviews /></div>
                </RequireAuth>
              } />
              
              <Route path="/admin/product/:id" element={
                <RequireAuth requireAdmin={true}>
                  <div className="pt-24"><AdminProductEdit /></div>
                </RequireAuth>
              } />

              <Route path="/admin/product/new" element={
                <RequireAuth requireAdmin={true}>
                  <div className="pt-24"><AdminProductEdit /></div>
                </RequireAuth>
              } />
              
              <Route path="/client" element={
                <RequireAuth>
                  <div className="pt-24"><ClientDashboard /></div>
                </RequireAuth>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
