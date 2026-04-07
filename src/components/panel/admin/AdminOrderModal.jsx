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

function formatPaymentMethod(value) {
  if (value === 'stripe') {
    return 'Stripe';
  }

  if (value === 'bank_transfer') {
    return 'Przelew tradycyjny';
  }

  if (value === 'manual') {
    return 'Nadane ręcznie';
  }

  return value || 'Brak danych';
}

function formatEventType(value) {
  return `${value || 'event'}`
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export default function AdminOrderModal({ initialOrder, products, onClose, onSaved }) {
  const [formData, setFormData] = useState(() => buildInitialState(initialOrder));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [detailsError, setDetailsError] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    setFormData(buildInitialState(initialOrder));
    setError('');
    setDetailsError('');
    setOrderDetails(null);
  }, [initialOrder]);

  useEffect(() => {
    if (!initialOrder?.id) {
      setDetailsLoading(false);
      return;
    }

    let cancelled = false;
    setDetailsLoading(true);
    setDetailsError('');

    axios.get(`/api/admin/orders/${initialOrder.id}`)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setOrderDetails(response.data || null);
        if (response.data?.order) {
          setFormData(buildInitialState(response.data.order));
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setDetailsError(requestError.response?.data?.error || 'Nie udało się pobrać szczegółów zamówienia.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDetailsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialOrder]);

  const detailOrder = orderDetails?.order || initialOrder;
  const detailEvents = orderDetails?.events || [];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await axios.put(`/api/admin/orders/${detailOrder.id}`, {
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
                <p className="mt-2 text-fs-body text-mauve/75">{detailOrder.order_number || 'Brak numeru'}</p>
              </div>
              <div className="rounded-[24px] border border-mauve/10 bg-white/90 p-4">
                <p className="text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Utworzono</p>
                <p className="mt-2 text-fs-body text-mauve/75">{formatDateTime(detailOrder.created_at)}</p>
              </div>
              <div className="rounded-[24px] border border-mauve/10 bg-white/90 p-4 md:col-span-2">
                <p className="text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Klientka</p>
                <p className="mt-2 text-fs-body text-mauve">{getCustomerName(detailOrder)}</p>
                <p className="mt-1 text-fs-ui text-mauve/55">{detailOrder.customer_email}</p>
                <p className="mt-3 break-all text-fs-ui text-mauve/45">ID techniczne: {detailOrder.id}</p>
              </div>
            </div>

            {detailsError ? (
              <div className="rounded-2xl border border-rose/20 bg-rose/10 px-4 py-3 text-fs-body text-rose">
                {detailsError}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-mauve/10 bg-white/90 p-4">
                <p className="text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Metoda płatności</p>
                <p className="mt-2 text-fs-body text-mauve/75">{formatPaymentMethod(detailOrder.payment_method)}</p>
              </div>
              <div className="rounded-[24px] border border-mauve/10 bg-white/90 p-4">
                <p className="text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Produkt</p>
                <p className="mt-2 text-fs-body text-mauve/75">{detailOrder.product_title || 'Brak danych'}</p>
              </div>
              <div className="rounded-[24px] border border-mauve/10 bg-white/90 p-4">
                <p className="text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Ostatnia zmiana</p>
                <p className="mt-2 text-fs-body text-mauve/75">{formatDateTime(detailOrder.updated_at)}</p>
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

            <section className="rounded-[28px] border border-mauve/10 bg-white/85 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Log zdarzeń</p>
                  <p className="mt-1 text-fs-ui text-mauve/50">Tu widać przebieg płatności i ręczne działania administracyjne związane z tym zamówieniem.</p>
                </div>
                {detailsLoading ? <span className="text-fs-ui text-mauve/45">Ładowanie...</span> : null}
              </div>

              {detailEvents.length > 0 ? (
                <ul className="space-y-3">
                  {detailEvents.map((eventItem) => (
                    <li key={eventItem.id} className="rounded-2xl border border-gold/10 bg-nude/60 px-4 py-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-fs-body font-medium text-mauve">{eventItem.message || formatEventType(eventItem.event_type)}</p>
                          <p className="mt-1 text-fs-ui text-mauve/50">{formatEventType(eventItem.event_type)}</p>
                        </div>
                        <p className="text-fs-ui text-mauve/45">{formatDateTime(eventItem.created_at)}</p>
                      </div>
                      {eventItem.context?.customer_email || eventItem.context?.order_number ? (
                        <p className="mt-3 text-fs-ui text-mauve/55">
                          {[eventItem.context?.order_number, eventItem.context?.customer_email].filter(Boolean).join(' • ')}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-2xl border border-mauve/10 bg-mauve/5 px-4 py-4 text-fs-body text-mauve/50">Brak zdarzeń przypisanych do tego zamówienia.</p>
              )}
            </section>
      </form>
    </AdminModalShell>
  );
}