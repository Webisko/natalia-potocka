import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminModalShell from './AdminModalShell';

const STATUS_OPTIONS = [
  { value: 'completed', label: 'Opłacone' },
  { value: 'pending_bank_transfer', label: 'Przelew oczekujący' },
  { value: 'manual', label: 'Nadane ręcznie' },
  { value: 'pending', label: 'Oczekujące' },
  { value: 'failed', label: 'Nieopłacone' },
  { value: 'refunded', label: 'Zwrócone' },
  { value: 'cancelled', label: 'Anulowane' },
];

function formatDateTime(value) {
  if (!value) {
    return 'Brak danych';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Brak danych';
  }

  return parsed.toLocaleString('pl-PL');
}

function buildInitialState(order) {
  return {
    customer_email: order?.customer_email || '',
    product_id: order?.product_id || '',
    amount_total: order?.amount_total ?? 0,
    status: order?.status || 'completed',
  };
}

function getCustomerName(order) {
  const fullName = [order?.customer_first_name, order?.customer_last_name]
    .map((part) => `${part || ''}`.trim())
    .filter(Boolean)
    .join(' ');

  return fullName || 'Klientka bez uzupełnionego profilu';
}

export default function AdminOrderModal({ initialOrder, products, onClose, onSaved }) {
  const [formData, setFormData] = useState(() => buildInitialState(initialOrder));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(buildInitialState(initialOrder));
    setError('');
  }, [initialOrder]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await axios.put(`/api/admin/orders/${initialOrder.id}`, {
        customer_email: formData.customer_email,
        product_id: formData.product_id,
        amount_total: Number(formData.amount_total),
        status: formData.status,
      });
      onSaved('Zamówienie zostało zaktualizowane.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Nie udało się zapisać zamówienia.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminModalShell
      eyebrow="Zamówienie"
      title="Szczegóły zamówienia"
      description="Możesz sprawdzić szczegóły zamówienia i poprawić jego dane bezpośrednio z tego miejsca."
      onClose={onClose}
      maxWidthClassName="max-w-3xl"
      footer={(
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-mauve/15 bg-white px-6 text-fs-label font-bold uppercase tracking-[0.2em] text-mauve/60 transition hover:border-mauve/25 hover:text-mauve"
          >
            Anuluj
          </button>
          <button
            type="submit"
            form="admin-order-form"
            disabled={submitting}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-gold px-6 text-fs-label font-bold uppercase tracking-[0.2em] text-white transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Zapisywanie...' : 'Zapisz zamówienie'}
          </button>
        </div>
      )}
    >
      <form id="admin-order-form" onSubmit={handleSubmit} className="space-y-6">
            {error ? (
              <div className="rounded-2xl border border-rose/20 bg-rose/10 px-4 py-3 text-fs-body text-rose">
                {error}
              </div>
            ) : null}

            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-mauve/10 bg-white/90 p-4">
                <p className="text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Numer zamówienia</p>
                <p className="mt-2 text-fs-body text-mauve/75">{initialOrder.order_number || 'Brak numeru'}</p>
              </div>
              <div className="rounded-[24px] border border-mauve/10 bg-white/90 p-4">
                <p className="text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Utworzono</p>
                <p className="mt-2 text-fs-body text-mauve/75">{formatDateTime(initialOrder.created_at)}</p>
              </div>
              <div className="rounded-[24px] border border-mauve/10 bg-white/90 p-4 md:col-span-2">
                <p className="text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Klientka</p>
                <p className="mt-2 text-fs-body text-mauve">{getCustomerName(initialOrder)}</p>
                <p className="mt-1 text-fs-ui text-mauve/55">{initialOrder.customer_email}</p>
                <p className="mt-3 break-all text-fs-ui text-mauve/45">ID techniczne: {initialOrder.id}</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/60">Adres e-mail</label>
                <input
                  type="email"
                  required
                  value={formData.customer_email}
                  onChange={(event) => setFormData((prev) => ({ ...prev, customer_email: event.target.value }))}
                  className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/60">Produkt</label>
                <select
                  value={formData.product_id}
                  onChange={(event) => setFormData((prev) => ({ ...prev, product_id: event.target.value }))}
                  className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/60">Kwota</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount_total}
                  onChange={(event) => setFormData((prev) => ({ ...prev, amount_total: event.target.value }))}
                  className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/60">Status</label>
                <select
                  value={formData.status}
                  onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))}
                  className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
                >
                  {STATUS_OPTIONS.map((statusOption) => (
                    <option key={statusOption.value} value={statusOption.value}>{statusOption.label}</option>
                  ))}
                </select>
              </div>
            </div>
      </form>
    </AdminModalShell>
  );
}