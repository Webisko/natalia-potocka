import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

export default function AdminProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [formData, setFormData] = useState({
    title: '', slug: '', description: '', price: 0,
    stripe_price_id: '', type: 'video', content_url: '',
    thumbnail_url: '', meta_title: '', meta_desc: ''
  });
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew) {
      axios.get('/api/admin/products')
        .then(res => {
          const prod = res.data.find(p => p.id === id);
          if (prod) setFormData(prod);
          setLoading(false);
        }).catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id, isNew]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isNew) {
        await axios.post('/api/admin/products', formData);
      } else {
        await axios.put(`/api/admin/products/${id}`, formData);
      }
      navigate('/admin');
    } catch (err) {
      alert(err.response?.data?.error || 'Wystąpił błąd zapisu.');
    }
  };

  if (loading) return <div>Ładowanie...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-light">{isNew ? 'Nowy Produkt' : 'Edytuj Produkt'}</h1>
        <button type="button" onClick={() => navigate('/admin')} className="text-stone-500 hover:text-stone-800 text-sm transition">Wróć</button>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface p-8 rounded-2xl border border-stone-100 shadow-sm flex flex-col gap-6">
        
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm text-stone-600 mb-1">Tytuł</label>
            <input name="title" value={formData.title} onChange={handleChange} required className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm text-stone-600 mb-1">Slug (URL)</label>
            <input name="slug" value={formData.slug} onChange={handleChange} required className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-stone-600 mb-1">Opis (Wyświetlany na stronie)</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm text-stone-600 mb-1">Cena (PLN)</label>
            <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} required className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm text-stone-600 mb-1">ID Ceny Stripe (np. price_1234...)</label>
            <input name="stripe_price_id" value={formData.stripe_price_id} onChange={handleChange} required className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-stone-50 border border-stone-100">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-stone-700 mb-1">Typ Produktu</label>
            <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-2 border border-stone-200 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none">
              <option value="video">Wideo / Kurs</option>
              <option value="audio">Audio / Medytacja</option>
              <option value="text">Tekst / PDF</option>
              <option value="service">Usługa / Konsultacja</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-stone-700 mb-1">Adres zawartości (URL do mp3/wideo/Vimeo/Dysku zablokowane dla innych)</label>
            <input name="content_url" value={formData.content_url || ''} onChange={handleChange} placeholder="https://" className="w-full px-4 py-2 border border-stone-200 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-stone-600 mb-1">URL Miniaturki (Obrazek)</label>
          <input name="thumbnail_url" value={formData.thumbnail_url || ''} onChange={handleChange} className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" />
        </div>

        <hr className="border-stone-100 my-2" />
        
        <div>
          <h3 className="text-sm font-medium text-stone-800 mb-3">SEO Tagowanie</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Meta Title</label>
              <input name="meta_title" value={formData.meta_title || ''} onChange={handleChange} className="w-full px-3 py-1.5 border border-stone-200 rounded focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Meta Description</label>
              <textarea name="meta_desc" value={formData.meta_desc || ''} onChange={handleChange} rows={2} className="w-full px-3 py-1.5 border border-stone-200 rounded focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm" />
            </div>
          </div>
        </div>

        <button type="submit" className="w-full bg-teal-600 text-white mt-4 py-3 rounded-xl font-medium hover:bg-teal-700 transition">
          Zapisz Produkt
        </button>

      </form>
    </div>
  );
}
