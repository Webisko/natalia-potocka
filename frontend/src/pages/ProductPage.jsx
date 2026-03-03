import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag } from 'lucide-react';
import CourseTemplate from '../components/templates/CourseTemplate';
import ServiceTemplate from '../components/templates/ServiceTemplate';
import DigitalTemplate from '../components/templates/DigitalTemplate';

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  
  const { user } = useAuth();

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
      alert('Zaloguj się lub załóż konto, aby kupić produkt.');
      // Opcjonalnie: przejście do logowania z przekazaniem next URL
      // ale CheckoutStripe wyłapuje email i tak.
    }
    setBuying(true);
    try {
      const email = user ? user.email : prompt("Podaj e-mail dla zamówienia:");
      if (!email) {
        setBuying(false);
        return;
      }
      
      const res = await axios.post('/api/checkout/create-session', { productId: product.id, email });
      if (res.data.url) {
        window.location.href = res.data.url; // Przekierowanie do Stripe
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Wystąpił błąd przy tworzeniu płatności.');
      setBuying(false);
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

  if (isCourse) {
    return <CourseTemplate {...templateProps} />;
  } else if (isService) {
    return <ServiceTemplate {...templateProps} />;
  } else {
    return <DigitalTemplate {...templateProps} />;
  }
}
