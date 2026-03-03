import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import AdminProductEdit from './pages/AdminProductEdit';
import ClientDashboard from './pages/ClientDashboard';
import ProductPage from './pages/ProductPage';
import Login from './pages/Login';
import AboutPage from './pages/AboutPage';
import { LogOut } from 'lucide-react';

function RequireAuth({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Ładowanie...</div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !user.is_admin) {
    return <Navigate to="/client" replace />;
  }

  return children;
}


import Header from './components/Header';
import Footer from './components/Footer';
import AdminReviews from './pages/AdminReviews';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background flex flex-col">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:slug" element={<div className="pt-24"><ProductPage /></div>} />
              <Route path="/uslugi/:slug" element={<div className="pt-24"><ProductPage /></div>} />
              <Route path="/produkty/:slug" element={<div className="pt-24"><ProductPage /></div>} />

              <Route path="/login" element={<div className="pt-24"><Login /></div>} />
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
            <Footer />
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
