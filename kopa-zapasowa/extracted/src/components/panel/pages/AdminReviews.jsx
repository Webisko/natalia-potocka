import { Suspense, lazy, useEffect, useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Edit, GripVertical, PlusCircle, Trash2 } from 'lucide-react';
import AdminActionIconButton from '../admin/AdminActionIconButton';
import AdminListCard from '../admin/AdminListCard';
import AdminStatusIcon from '../admin/AdminStatusIcon';

const AdminReviewModal = lazy(() => import('../admin/AdminReviewModal'));

const TABLE_ACTION_BUTTON_CLASS = 'h-9 w-9 rounded-lg';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModalState, setReviewModalState] = useState({ isOpen: false, review: null });
  const [draggedReviewId, setDraggedReviewId] = useState(null);

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

  const openCreateModal = () => {
    setReviewModalState({ isOpen: true, review: null });
  };

  const openEditModal = (review) => {
    setReviewModalState({ isOpen: true, review });
  };

  const closeModal = () => {
    setReviewModalState({ isOpen: false, review: null });
  };

  const handleSaved = (message) => {
    closeModal();
    alert(message);
    fetchReviews();
  };

  const handleReorder = async (sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) {
      return;
    }

    const sourceIndex = reviews.findIndex((review) => review.id === sourceId);
    const targetIndex = reviews.findIndex((review) => review.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    const reordered = [...reviews];
    const [movedItem] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    const normalized = reordered.map((review, index) => ({
      ...review,
      order_index: index,
    }));

    setReviews(normalized);

    try {
      await axios.post('/api/reviews/reorder', {
        orderedIds: normalized.map((review) => review.id),
      });
    } catch (err) {
      alert(err.response?.data?.error || 'Nie udało się zapisać nowej kolejności opinii.');
      fetchReviews();
    }
  };

  return (
    <div className="space-y-8">
      <AdminListCard
        title="Lista opinii"
        count={reviews.length}
        description="Dodawaj, edytuj i porządkuj recenzje w spójnym widoku panelu. Kolejność możesz zmieniać przeciągając wiersze."
        action={(
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gold px-6 py-3 text-fs-label font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.02] hover:bg-gold/90 hover:shadow-xl hover:shadow-gold/20"
          >
            <PlusCircle size={18} /> Dodaj opinię
          </button>
        )}
      >
        <div className="admin-scrollbar admin-scrollbar-x overflow-x-auto">
        {loading ? (
          <div className="p-20 text-center text-fs-body text-mauve/50">Ładowanie opinii...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gold/5 bg-nude/30 text-fs-label font-bold uppercase tracking-[0.2em] text-mauve/40">
                <th className="w-20 px-8 py-4">Przesuń</th>
                <th className="px-8 py-4 pr-6">Autorka</th>
                <th className="hidden px-8 py-4 pr-6 lg:table-cell">Treść</th>
                <th className="px-8 py-4 pr-6">Zdjęcie</th>
                <th className="px-8 py-4 pr-6">Status</th>
                <th className="px-8 py-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/5">
              {reviews.map(r => (
                <tr
                  key={r.id}
                  draggable
                  onDragStart={() => setDraggedReviewId(r.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    handleReorder(draggedReviewId, r.id);
                    setDraggedReviewId(null);
                  }}
                  onDragEnd={() => setDraggedReviewId(null)}
                  className={`transition ${draggedReviewId === r.id ? 'bg-gold/10' : 'hover:bg-white/40'}`}
                >
                  <td className="px-8 py-6 pr-4">
                    <div className="flex h-10 w-10 cursor-grab items-center justify-center rounded-2xl border border-mauve/10 bg-white text-mauve/40 active:cursor-grabbing">
                      <GripVertical size={16} />
                    </div>
                  </td>
                  <td className="p-0 pr-6 text-mauve">
                    <button
                      type="button"
                      onClick={() => openEditModal(r)}
                      className="block w-full px-8 py-6 text-left transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/30"
                    >
                      <strong className="block font-serif text-fs-body-lg font-normal text-mauve">{r.author}</strong>
                      <span className="mt-1 block text-fs-label uppercase tracking-[0.16em] text-mauve/45">{r.subtitle || 'Bez podtytułu'}</span>
                    </button>
                  </td>
                  <td className="hidden max-w-md px-8 py-6 pr-6 text-fs-ui italic text-mauve/50 lg:table-cell">
                    <span
                      title={r.content}
                      style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {r.content}
                    </span>
                  </td>
                  <td className="px-8 py-6 pr-6 text-fs-ui text-mauve/45">{r.thumbnail_url ? 'Tak' : 'Brak'}</td>
                  <td className="px-8 py-6 pr-6 text-fs-ui">
                    <AdminStatusIcon title={r.is_active ? 'Widoczna' : 'Ukryta'} tone={r.is_active ? 'success' : 'warning'} icon={r.is_active ? Eye : EyeOff} className="h-10 w-10" />
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-end gap-2">
                      <AdminActionIconButton title="Edytuj opinię" onClick={() => openEditModal(r)} icon={<Edit size={16} />} className={TABLE_ACTION_BUTTON_CLASS} />
                      <AdminActionIconButton title="Usuń opinię" onClick={() => handleDelete(r.id)} icon={<Trash2 size={16} />} tone="danger" className={TABLE_ACTION_BUTTON_CLASS} />
                    </div>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-8 py-10 text-center text-mauve/50 italic">Brak dodanych opinii.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        </div>
      </AdminListCard>

      {reviewModalState.isOpen && (
        <Suspense fallback={null}>
          <AdminReviewModal initialReview={reviewModalState.review} onClose={closeModal} onSaved={handleSaved} />
        </Suspense>
      )}
    </div>
  );
}
