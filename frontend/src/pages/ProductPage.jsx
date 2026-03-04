import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';
import CourseTemplate from '../components/templates/CourseTemplate';
import ServiceTemplate from '../components/templates/ServiceTemplate';
import DigitalTemplate from '../components/templates/DigitalTemplate';

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPassword2, setRegPassword2] = useState('');
  const [regError, setRegError] = useState(null);
  const [regSuccess, setRegSuccess] = useState(null);
  const [regLoading, setRegLoading] = useState(false);
  
  const { user, register, login } = useAuth();

  useEffect(() => {
    axios.get(`/api/products/${slug}`)
      .then(res => setProduct(res.data))
      .catch(err => {
        console.error(err);
        setProduct(null);
      }).finally(() => setLoading(false));
  }, [slug]);

  const handleBuy = async () => {
    if (!user) {
      setShowRegisterModal(true);
      return;
    }
    setBuying(true);
    try {
      const res = await axios.post('/api/checkout/create-session', { productId: product.id, email: user.email });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Wystąpił błąd przy tworzeniu płatności.');
      setBuying(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);
    setRegLoading(true);
    try {
      const res = await register(regEmail, regPassword, regPassword2);
      setRegSuccess(res.message);
      // Auto-login after registration
      try {
        await login(regEmail, regPassword);
        setShowRegisterModal(false);
        // Proceed with purchase
        handleBuy();
      } catch {
        // If auto-login fails (e.g. email not confirmed), just show success
      }
    } catch (err) {
      setRegError(err.response?.data?.error || 'Wystąpił błąd podczas rejestracji.');
    } finally {
      setRegLoading(false);
    }
  };

  if (loading) return <div>Ładowanie...</div>;
  if (!product) return <div>Produkt nie znaleziony.</div>;

  const isPurchased = user && user.purchased_items && user.purchased_items.includes(product.id);
  const isCourse = product.type === 'course' || product.title.toLowerCase().includes('kurs');
  const isService = product.type === 'service' || product.title.toLowerCase().includes('konsultacja') || product.title.toLowerCase().includes('terapia');

  const templateProps = {
    product,
    isPurchased,
    buying,
    handleBuy,
    user
  };

  return (
    <>
      {isCourse ? (
        <CourseTemplate {...templateProps} />
      ) : isService ? (
        <ServiceTemplate {...templateProps} />
      ) : (
        <DigitalTemplate {...templateProps} />
      )}

      {/* REGISTER/LOGIN MODAL for purchase */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={() => setShowRegisterModal(false)}>
          <div className="absolute inset-0 bg-mauve/30 backdrop-blur-sm" />
          <div className="relative z-10 bg-white/95 backdrop-blur-xl w-full max-w-md mx-4 p-10 shadow-2xl" style={{ borderRadius: '30px' }} onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-rose/10 rounded-full blur-[50px] pointer-events-none -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/5 rounded-full blur-[40px] pointer-events-none translate-y-1/3 -translate-x-1/3" />

            <button onClick={() => setShowRegisterModal(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-mauve/50 hover:text-mauve transition-colors">
              <X size={20} />
            </button>

            <div className="relative z-10">
              <h2 className="text-3xl font-serif text-mauve mb-2">Utwórz konto</h2>
              <p className="text-mauve/50 font-light text-sm mb-8">Aby dokonać zakupu, potrzebujesz konta. Podaj swoje dane poniżej.</p>

              {regError && (
                <div className="bg-rose/10 border border-rose/20 text-mauve p-3 rounded-xl text-sm mb-4">
                  {regError}
                </div>
              )}
              {regSuccess && (
                <div className="bg-gold/10 border border-gold/20 text-mauve p-3 rounded-xl text-sm mb-4">
                  {regSuccess}
                </div>
              )}

              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-mauve/70 uppercase tracking-wider mb-2">Adres e-mail</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-5 py-3 bg-nude/80 border border-mauve/10 rounded-xl text-mauve focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/30 transition-all font-light"
                    placeholder="twoj@email.pl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-mauve/70 uppercase tracking-wider mb-2">Hasło <span className="text-mauve/40">(min. 12 znaków)</span></label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-5 py-3 bg-nude/80 border border-mauve/10 rounded-xl text-mauve focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/30 transition-all font-light"
                    placeholder="••••••••••••"
                    required
                    minLength={12}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-mauve/70 uppercase tracking-wider mb-2">Powtórz hasło</label>
                  <input
                    type="password"
                    value={regPassword2}
                    onChange={(e) => setRegPassword2(e.target.value)}
                    className="w-full px-5 py-3 bg-nude/80 border border-mauve/10 rounded-xl text-mauve focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/30 transition-all font-light"
                    placeholder="••••••••••••"
                    required
                    minLength={12}
                  />
                </div>

                <button type="submit" disabled={regLoading} className="w-full h-14 mt-2 overflow-hidden rounded-2xl bg-gold text-white font-bold tracking-widest uppercase text-sm hover:shadow-xl hover:shadow-gold/20 disabled:opacity-50 transition-all duration-300 transform hover:-translate-y-0.5">
                  {regLoading ? 'Tworzenie konta...' : 'Utwórz konto i kup'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
