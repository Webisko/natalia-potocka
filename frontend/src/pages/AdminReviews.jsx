import { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  
  const [formData, setFormData] = useState({
      author: '',
      subtitle: '',
      content: '',
      thumbnail_url: '',
      order_index: 0,
      is_active: 1
  });

  const fetchReviews = async () => {
    try {
      const res = await axios.get('/api/reviews/all');
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Na pewno usunąć tę opinię?')) return;
    try {
      await axios.delete(`/api/reviews/${id}`);
      fetchReviews();
    } catch (err) {
      alert('Błąd usuwania: ' + err.message);
    }
  };

  const handleEdit = (r) => {
      setEditingReview(r.id);
      setFormData({
          author: r.author,
          subtitle: r.subtitle || '',
          content: r.content,
          thumbnail_url: r.thumbnail_url || '',
          order_index: r.order_index,
          is_active: r.is_active
      });
  };

  const handeCancelEdit = () => {
      setEditingReview(null);
      setFormData({
          author: '',
          subtitle: '',
          content: '',
          thumbnail_url: '',
          order_index: 0,
          is_active: 1
      });
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
          if (editingReview) {
              await axios.put(`/api/reviews/${editingReview}`, formData);
          } else {
              await axios.post('/api/reviews', formData);
          }
          handeCancelEdit();
          fetchReviews();
      } catch (err) {
          alert('Wystąpił błąd: ' + err.message);
      }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-light">Zarządzanie Opiniami</h1>
        <Link to="/admin" className="text-teal-600 hover:underline">Wróć do kokpitu</Link>
      </div>

      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-stone-100 mb-8 overflow-x-auto">
        <h2 className="text-lg font-medium mb-4">{editingReview ? 'Edytuj Opinię' : 'Dodaj Nową Opinię'}</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-2xl">
            <input 
                type="text" 
                placeholder="Imię i nazwisko / Autor" 
                value={formData.author}
                onChange={e => setFormData({...formData, author: e.target.value})}
                required
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" 
            />
            <input 
                type="text" 
                placeholder="Podtytuł (np. Mama Zuzi)" 
                value={formData.subtitle}
                onChange={e => setFormData({...formData, subtitle: e.target.value})}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" 
            />
            <input 
                type="text" 
                placeholder="URL zdjęcia (opcjonalnie)" 
                value={formData.thumbnail_url}
                onChange={e => setFormData({...formData, thumbnail_url: e.target.value})}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" 
            />
            <textarea 
                placeholder="Treść opinii..."
                rows="4"
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                required
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" 
            />
            <div className="flex gap-4">
               <div>
                  <label className="text-sm text-stone-500 block mb-1">Kolejność</label>
                  <input 
                    type="number" 
                    value={formData.order_index}
                    onChange={e => setFormData({...formData, order_index: parseInt(e.target.value)})}
                    className="px-4 py-2 border border-stone-200 rounded-lg w-24" 
                  />
               </div>
               <div>
                  <label className="text-sm text-stone-500 block mb-1">Widoczność</label>
                  <select 
                    value={formData.is_active}
                    onChange={e => setFormData({...formData, is_active: parseInt(e.target.value)})}
                    className="px-4 py-2 border border-stone-200 rounded-lg"
                  >
                     <option value={1}>Widoczna</option>
                     <option value={0}>Ukryta</option>
                  </select>
               </div>
            </div>
            
            <div className="flex gap-3">
               <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition">
                  {editingReview ? 'Zapisz Zmiany' : 'Dodaj Opinię'}
               </button>
               {editingReview && (
                  <button type="button" onClick={handeCancelEdit} className="bg-stone-200 text-stone-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-300 transition">
                     Anuluj
                  </button>
               )}
            </div>
        </form>
      </div>
      
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-stone-100 mb-8 overflow-x-auto">
        <h2 className="text-lg font-medium mb-4">Wszystkie Opinie</h2>
        {loading ? (
          <div className="text-stone-500 text-sm">Ładowanie opinii...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 text-sm text-stone-500">
                <th className="py-3 font-medium">Autor</th>
                <th className="py-3 font-medium hidden md:table-cell">Treść</th>
                <th className="py-3 font-medium">Status</th>
                <th className="py-3 font-medium text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id} className="border-b last:border-0 border-stone-50 hover:bg-stone-50/50 transition">
                  <td className="py-3 text-stone-800">
                     {r.author}<br/>
                     <span className="text-xs text-stone-400">{r.subtitle}</span>
                  </td>
                  <td className="py-3 text-sm text-stone-500 hidden md:table-cell italic max-w-sm truncate">{r.content}</td>
                  <td className="py-3 text-sm">{r.is_active ? <span className="text-teal-600">Aktywna</span> : <span className="text-red-500">Ukryta</span>}</td>
                  <td className="py-3 flex justify-end gap-3 text-stone-400">
                    <button onClick={() => handleEdit(r)} className="hover:text-teal-600 transition"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(r.id)} className="hover:text-red-500 transition"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-stone-500 italic">Brak dodanych opinii.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
