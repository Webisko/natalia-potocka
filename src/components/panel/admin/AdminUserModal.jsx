import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle2, Copy, KeyRound, Mail, Package, ScrollText, ShieldPlus, ShoppingBag } from 'lucide-react';
import AdminCheckbox from './AdminCheckbox';
import AdminModalShell from './AdminModalShell';

function buildInitialState(user) {
  return {
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    password: '',
    is_admin: Boolean(user?.is_admin),
    purchased_items: Array.isArray(user?.purchased_items) ? user.purchased_items : [],
  };
}

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

function translateProductType(type) {
  const labels = {
    service: 'Usługa',
    video: 'Wideo',
    audio: 'Audio',
    course: 'Szkolenie',
  };

  return labels[type] || type || 'Produkt';
}

function renderOrderStatus(status) {
  if (status === 'completed') {
    return 'Opłacone';
  }

  if (status === 'pending_bank_transfer') {
    return 'Przelew oczekujący';
  }

  if (status === 'manual') {
    return 'Nadane ręcznie';
  }

  if (status === 'pending') {
    return 'Oczekujące';
  }

  if (status === 'failed') {
    return 'Nieopłacone';
  }

  if (status === 'refunded') {
    return 'Zwrócone';
  }

  if (status === 'cancelled') {
    return 'Anulowane';
  }

  return status || 'Brak danych';
}

function formatCurrency(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 'Brak danych';
  }

  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
  }).format(numericValue);
}

function formatEventType(value) {
  return `${value || 'event'}`
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export default function AdminUserModal({
  initialUser,
  products,
  onClose,
  onSaved,
}) {
  const isEditing = Boolean(initialUser?.id);
  const [formData, setFormData] = useState(() => buildInitialState(initialUser));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [detailsError, setDetailsError] = useState('');
  const [detailsLoading, setDetailsLoading] = useState(Boolean(isEditing));
  const [userDetails, setUserDetails] = useState(null);
  const [resetLinkData, setResetLinkData] = useState({ url: '', expiresAt: '', copied: false });
  const [secondaryActionType, setSecondaryActionType] = useState('');
  const [manualAccessProductId, setManualAccessProductId] = useState('');

  const grantableProducts = products.filter((product) => product.type !== 'service');

  const fetchDetails = useCallback(async (userId) => {
    if (!userId) {
      setUserDetails(null);
      setDetailsLoading(false);
      return;
    }

    setDetailsLoading(true);
    setDetailsError('');

    try {
      const response = await axios.get(`/api/admin/users/${userId}`);
      setUserDetails(response.data || null);
    } catch (requestError) {
      setDetailsError(requestError.response?.data?.error || 'Nie udało się pobrać szczegółów użytkownika.');
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  useEffect(() => {
    setFormData(buildInitialState(initialUser));
    setError('');
    setNotice('');
    setDetailsError('');
    setResetLinkData({ url: '', expiresAt: '', copied: false });
  }, [initialUser]);

  useEffect(() => {
    if (!manualAccessProductId && grantableProducts[0]?.id) {
      setManualAccessProductId(grantableProducts[0].id);
    }
  }, [grantableProducts, manualAccessProductId]);

  useEffect(() => {
    if (!isEditing || !initialUser?.id) {
      setUserDetails(null);
      setDetailsLoading(false);
      return;
    }

    void fetchDetails(initialUser.id);
  }, [fetchDetails, initialUser, isEditing]);

  const togglePurchasedItem = (productId) => {
    setFormData((prev) => {
      const nextItems = prev.purchased_items.includes(productId)
        ? prev.purchased_items.filter((item) => item !== productId)
        : [...prev.purchased_items, productId];

      return {
        ...prev,
        purchased_items: nextItems,
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setNotice('');

    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        purchased_items: formData.purchased_items,
      };

      if (isEditing) {
        await axios.put(`/api/admin/users/${initialUser.id}`, payload);
      } else {
        payload.is_admin = Boolean(formData.is_admin);
        await axios.post('/api/admin/users', payload);
      }

      onSaved(isEditing ? 'Użytkownik został zaktualizowany.' : 'Użytkownik został utworzony.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Nie udało się zapisać użytkownika.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateResetLink = async () => {
    if (!isEditing || !initialUser?.id) {
      return;
    }

    setSecondaryActionType('reset-link');
    setError('');
    setNotice('');

    try {
      const response = await axios.post(`/api/admin/users/${initialUser.id}/reset-password-link`);
      setResetLinkData({
        url: response.data?.reset_url || '',
        expiresAt: response.data?.expires_at || '',
        copied: false,
      });
      setNotice('Link resetu hasła został wygenerowany.');
      await fetchDetails(initialUser.id);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Nie udało się wygenerować linku resetu hasła.');
    } finally {
      setSecondaryActionType('');
    }
  };

  const handleSendResetEmail = async () => {
    if (!isEditing || !initialUser?.id) {
      return;
    }

    setSecondaryActionType('reset-email');
    setError('');
    setNotice('');

    try {
      const response = await axios.post(`/api/admin/users/${initialUser.id}/send-reset-password-email`);
      const details = response.data?.delivery?.details ? ` ${response.data.delivery.details}` : '';
      const previewPath = response.data?.delivery?.html_path ? ` Podgląd HTML: ${response.data.delivery.html_path}` : '';
      setNotice(`${response.data?.message || 'Wiadomość resetująca została wysłana.'}${details}${previewPath}`.trim());
      setResetLinkData((prev) => ({
        ...prev,
        expiresAt: response.data?.expires_at || prev.expiresAt,
      }));
      await fetchDetails(initialUser.id);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Nie udało się wysłać wiadomości resetującej.');
    } finally {
      setSecondaryActionType('');
    }
  };

  const handleCopyResetLink = async () => {
    if (!resetLinkData.url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(resetLinkData.url);
      setResetLinkData((prev) => ({ ...prev, copied: true }));
      setNotice('Link resetu został skopiowany do schowka.');
    } catch {
      setError('Nie udało się skopiować linku do schowka.');
    }
  };

  const handleGrantAccess = async () => {
    if (!isEditing || !detailUser?.email || !manualAccessProductId) {
      return;
    }

    setSecondaryActionType('grant-access');
    setError('');
    setNotice('');

    try {
      const response = await axios.post('/api/admin/grant-access', {
        email: detailUser.email,
        product_id: manualAccessProductId,
      });

      setNotice(response.data?.message || 'Dostęp został nadany.');
      setFormData((prev) => ({
        ...prev,
        purchased_items: prev.purchased_items.includes(manualAccessProductId)
          ? prev.purchased_items
          : [...prev.purchased_items, manualAccessProductId],
      }));
      await fetchDetails(initialUser.id);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Nie udało się nadać dostępu ręcznie.');
    } finally {
      setSecondaryActionType('');
    }
  };

  const detailUser = userDetails?.user || initialUser;
  const detailOrders = userDetails?.orders || [];
  const detailProducts = userDetails?.purchased_products || [];
  const detailEvents = userDetails?.events || [];
  const accountRoleLabel = isEditing
    ? (detailUser?.is_admin ? 'Administrator' : 'Użytkownik')
    : (formData.is_admin ? 'Administrator' : 'Użytkownik');
  const accountStatusLabel = detailUser?.email_confirmed ? 'Adres e-mail potwierdzony' : 'Adres e-mail niepotwierdzony';

  let historySectionContent;

  if (!isEditing) {
    historySectionContent = (
      <p className="text-fs-body leading-7 text-mauve/60">
        Po utworzeniu konta z tego miejsca będzie można wrócić do historii zamówień oraz wygenerować link resetu hasła.
      </p>
    );
  } else if (detailsLoading) {
    historySectionContent = <div className="py-8 text-fs-body text-mauve/50">Ładowanie szczegółów użytkownika...</div>;
  } else if (detailsError) {
    historySectionContent = (
      <div className="rounded-2xl border border-rose/20 bg-rose/10 px-4 py-3 text-fs-body text-rose">
        {detailsError}
      </div>
    );
  } else {
    historySectionContent = (
      <div className="space-y-6">
        <div className="grid gap-4 text-fs-ui text-mauve/70 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-mauve/10 bg-white px-4 py-4">
            <p className="text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/45">Adres e-mail</p>
            <p className="mt-2 break-all font-medium text-mauve">{detailUser?.email || 'Brak danych'}</p>
          </div>
          <div className="rounded-2xl border border-mauve/10 bg-white px-4 py-4">
            <p className="text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/45">Utworzono</p>
            <p className="mt-2 font-medium text-mauve">{formatDateTime(detailUser?.created_at)}</p>
          </div>
          <div className="rounded-2xl border border-mauve/10 bg-white px-4 py-4">
            <p className="text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/45">Ostatnia aktualizacja</p>
            <p className="mt-2 font-medium text-mauve">{formatDateTime(detailUser?.updated_at)}</p>
          </div>
          <div className="rounded-2xl border border-mauve/10 bg-white px-4 py-4">
            <p className="text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/45">Zakupione produkty</p>
            <p className="mt-2 font-medium text-mauve">{detailProducts.length}</p>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-mauve/55">
            <Package size={15} className="text-gold" />
            <p className="text-fs-label font-bold uppercase tracking-[0.16em]">Zakupione produkty</p>
          </div>
          {detailProducts.length > 0 ? (
            <div className="overflow-hidden rounded-[28px] border border-mauve/10 bg-white">
              <ul className="divide-y divide-gold/5">
                {detailProducts.map((product) => (
                  <li key={product.id} className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-mauve">{product.title}</p>
                      <p className="mt-1 text-fs-ui text-mauve/50">{translateProductType(product.type)}{product.slug ? ` • /oferta/${product.slug}` : ''}</p>
                    </div>
                    <div className="shrink-0 text-left md:text-right">
                      <p className="text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/45">Data zakupu</p>
                      <p className="mt-1 text-fs-ui font-medium text-mauve/70">
                        {product.purchased_at ? formatDateTime(product.purchased_at) : 'Dostęp nadany ręcznie'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="rounded-2xl border border-mauve/10 bg-mauve/5 px-4 py-4 text-fs-body text-mauve/50">Brak przypisanych produktów.</p>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-mauve/55">
            <ShoppingBag size={15} className="text-gold" />
            <p className="text-fs-label font-bold uppercase tracking-[0.16em]">Historia zamówień</p>
          </div>
          {detailOrders.length > 0 ? (
            <div className="overflow-hidden rounded-[28px] border border-mauve/10 bg-white">
              <ul className="divide-y divide-gold/5">
                {detailOrders.map((order) => (
                  <li key={order.id} className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-mauve">{order.product_title || order.product_id}</p>
                      <p className="mt-1 text-fs-ui text-mauve/50">ID zamówienia: {order.id.slice(0, 8)}</p>
                      <p className="mt-1 text-fs-ui text-mauve/50">{formatDateTime(order.created_at)}</p>
                    </div>
                    <div className="grid gap-2 text-left lg:text-right">
                      <p className="text-fs-ui font-medium text-mauve/70">{formatCurrency(order.amount_total)}</p>
                      <span className="inline-flex items-center rounded-full bg-nude px-3 py-1.5 text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/55 lg:ml-auto">
                        {renderOrderStatus(order.status)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="rounded-2xl border border-mauve/10 bg-mauve/5 px-4 py-4 text-fs-body text-mauve/50">Brak zamówień przypisanych do tego adresu e-mail.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <AdminModalShell
      eyebrow={isEditing ? 'Edycja konta' : 'Nowe konto'}
      title={isEditing ? 'Edytuj użytkownika' : 'Dodaj użytkownika'}
      description="Zarządzasz danymi konta, dostępami do produktów i historią zamówień z jednego pionowego układu bez bocznego panelu."
      onClose={onClose}
      maxWidthClassName="max-w-6xl"
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
            form="admin-user-form"
            disabled={submitting}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-gold px-6 text-fs-label font-bold uppercase tracking-[0.2em] text-white transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Zapisywanie...' : isEditing ? 'Zapisz użytkownika' : 'Utwórz użytkownika'}
          </button>
        </div>
      )}
    >
      <form id="admin-user-form" onSubmit={handleSubmit} className="space-y-8">
        {error ? (
          <div className="rounded-2xl border border-rose/20 bg-rose/10 px-4 py-3 text-fs-body text-rose">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-fs-body text-emerald-800">
            {notice}
          </div>
        ) : null}

        <section className="space-y-5">
          <div>
            <p className="text-fs-label font-bold uppercase tracking-[0.24em] text-gold">Konto</p>
            <h3 className="mt-2 font-serif text-fs-title-sm text-mauve">Status i rola</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-mauve/10 bg-white px-5 py-4">
              <p className="text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Status konta</p>
              <p className="mt-2 text-fs-body leading-7 text-mauve/70">{accountStatusLabel}</p>
            </div>
            <div className="rounded-[24px] border border-mauve/10 bg-white px-5 py-4">
              <p className="text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Rola</p>
              {isEditing ? (
                <p className="mt-2 text-fs-body leading-7 text-mauve/70">{accountRoleLabel}</p>
              ) : (
                <div className="mt-2 space-y-2">
                  <select
                    value={formData.is_admin ? 'admin' : 'user'}
                    onChange={(event) => setFormData((prev) => ({ ...prev, is_admin: event.target.value === 'admin' }))}
                    className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
                  >
                    <option value="user">Użytkownik</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <p className="text-fs-ui leading-6 text-mauve/55">Domyślnie nowe konto jest zwykłym użytkownikiem, ale możesz od razu nadać mu rolę administratora.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-5 border-t border-gold/10 pt-8">
          <div>
            <p className="text-fs-label font-bold uppercase tracking-[0.24em] text-gold">Dane</p>
            <h3 className="mt-2 font-serif text-fs-title-sm text-mauve">Podstawowe informacje logowania</h3>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Imię</label>
              <input
                value={formData.first_name}
                onChange={(event) => setFormData((prev) => ({ ...prev, first_name: event.target.value }))}
                className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Nazwisko</label>
              <input
                value={formData.last_name}
                onChange={(event) => setFormData((prev) => ({ ...prev, last_name: event.target.value }))}
                className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">E-mail</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">
                {isEditing ? 'Nowe hasło' : 'Hasło'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
                placeholder={isEditing ? 'Zostaw puste, aby nie zmieniać hasła' : 'Minimum 6 znaków'}
              />
              <p className="mt-2 text-fs-ui leading-6 text-mauve/55">
                {isEditing ? 'Pozostaw puste, jeśli hasło ma zostać bez zmian.' : 'Nowe konto otrzyma hasło ustawione w tym formularzu.'}
              </p>
              {isEditing ? (
                <div className="mt-4 space-y-3 rounded-[24px] border border-gold/10 bg-white px-4 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-fs-label font-bold uppercase tracking-[0.18em] text-gold">Reset hasła</p>
                      <p className="mt-1 text-fs-ui leading-6 text-mauve/55">Wyślij gotowy link resetu hasła na skrzynkę użytkowniczki albo wygeneruj go do ręcznego przekazania.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={handleSendResetEmail}
                        disabled={Boolean(secondaryActionType)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-gold/20 bg-gold px-5 text-fs-label font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Mail size={16} /> {secondaryActionType === 'reset-email' ? 'Wysyłanie...' : 'Wyślij link do resetu'}
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateResetLink}
                        disabled={Boolean(secondaryActionType)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-gold/20 bg-gold/5 px-5 text-fs-label font-bold uppercase tracking-[0.18em] text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <KeyRound size={16} /> {secondaryActionType === 'reset-link' ? 'Generowanie...' : 'Wygeneruj link'}
                      </button>
                    </div>
                  </div>

                  {resetLinkData.url ? (
                    <div className="space-y-3">
                      <p className="text-fs-ui leading-6 text-mauve/55">Link wygasa {formatDateTime(resetLinkData.expiresAt)}.</p>
                      <div className="flex flex-col gap-3 lg:flex-row">
                        <input
                          readOnly
                          value={resetLinkData.url}
                          className="min-w-0 flex-1 rounded-2xl border border-mauve/10 bg-nude/35 px-4 py-3 text-fs-body text-mauve/70 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleCopyResetLink}
                          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-gold/20 bg-white px-5 text-fs-label font-bold uppercase tracking-[0.2em] text-gold transition hover:border-gold/35 hover:bg-gold/10"
                        >
                          {resetLinkData.copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                          {resetLinkData.copied ? 'Skopiowano' : 'Kopiuj link'}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="space-y-5 border-t border-gold/10 pt-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-fs-label font-bold uppercase tracking-[0.24em] text-gold">Dostępy</p>
              <h3 className="mt-2 font-serif text-fs-title-sm text-mauve">Produkty przypisane do konta</h3>
              <p className="mt-2 text-fs-body leading-7 text-mauve/60">Zaznacz produkty, które mają być od razu dostępne z poziomu konta klienta.</p>
            </div>
            <div className="rounded-[24px] border border-mauve/10 bg-white px-5 py-4 text-fs-ui text-mauve/70">
              <p className="text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/45">Wybrane produkty</p>
              <p className="mt-2 font-medium text-mauve">{formData.purchased_items.length}</p>
            </div>
          </div>

          {products.length === 0 ? (
            <p className="rounded-2xl border border-mauve/10 bg-mauve/5 px-4 py-4 text-fs-body text-mauve/50">
              Brak produktów do przypisania.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => {
                const checked = formData.purchased_items.includes(product.id);

                return (
                  <AdminCheckbox
                    key={product.id}
                    checked={checked}
                    onChange={() => togglePurchasedItem(product.id)}
                    label={product.title}
                    description={translateProductType(product.type)}
                    className={checked ? 'border-gold/25 bg-gold/10' : 'bg-white hover:border-mauve/20'}
                  />
                );
              })}
            </div>
          )}
        </section>

        {isEditing ? (
          <section className="space-y-5 border-t border-gold/10 pt-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-fs-label font-bold uppercase tracking-[0.24em] text-gold">Akcje</p>
                <h3 className="mt-2 font-serif text-fs-title-sm text-mauve">Ręczne nadanie dostępu</h3>
                <p className="mt-2 text-fs-body leading-7 text-mauve/60">Dodaj produkt do konta i zapisz to działanie jako osobne zamówienie manualne z numerem i logiem zdarzeń.</p>
              </div>
              <div className="rounded-[24px] border border-mauve/10 bg-white px-5 py-4 text-fs-ui text-mauve/70">
                <p className="text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/45">Adres konta</p>
                <p className="mt-2 break-all font-medium text-mauve">{detailUser?.email || 'Brak danych'}</p>
              </div>
            </div>

            {grantableProducts.length > 0 ? (
              <div className="rounded-[28px] border border-gold/10 bg-white px-5 py-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <div>
                    <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Produkt do nadania</label>
                    <select
                      value={manualAccessProductId}
                      onChange={(event) => setManualAccessProductId(event.target.value)}
                      className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
                    >
                      {grantableProducts.map((product) => (
                        <option key={product.id} value={product.id}>{product.title}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleGrantAccess}
                    disabled={Boolean(secondaryActionType) || !manualAccessProductId}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-gold/20 bg-gold/5 px-5 text-fs-label font-bold uppercase tracking-[0.18em] text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShieldPlus size={16} /> {secondaryActionType === 'grant-access' ? 'Zapisywanie...' : 'Nadaj dostęp'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="rounded-2xl border border-mauve/10 bg-mauve/5 px-4 py-4 text-fs-body text-mauve/50">Brak produktów cyfrowych, które można nadać ręcznie.</p>
            )}
          </section>
        ) : null}

        <section className="space-y-5 border-t border-gold/10 pt-8">
          <div>
            <div>
              <p className="text-fs-label font-bold uppercase tracking-[0.24em] text-gold">Historia</p>
              <h3 className="mt-2 font-serif text-fs-title-sm text-mauve">Szczegóły konta i zamówienia</h3>
              <p className="mt-2 text-fs-body leading-7 text-mauve/60">
                {isEditing ? 'Podgląd danych zapisanych dla tego użytkownika.' : 'Po zapisaniu konta tutaj pojawi się historia zamówień i dodatkowe informacje.'}
              </p>
            </div>
          </div>

          {historySectionContent}

          {isEditing && !detailsLoading && !detailsError ? (
            <div className="rounded-[28px] border border-mauve/10 bg-white px-5 py-5">
              <div className="mb-4 flex items-center gap-2 text-mauve/55">
                <ScrollText size={15} className="text-gold" />
                <p className="text-fs-label font-bold uppercase tracking-[0.16em]">Oś zdarzeń konta</p>
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
                      {eventItem.context?.order_number || eventItem.context?.product_title || eventItem.context?.customer_email ? (
                        <p className="mt-3 text-fs-ui text-mauve/55">
                          {[eventItem.context?.order_number, eventItem.context?.product_title, eventItem.context?.customer_email].filter(Boolean).join(' • ')}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-2xl border border-mauve/10 bg-mauve/5 px-4 py-4 text-fs-body text-mauve/50">Brak zapisanych zdarzeń dla tego konta.</p>
              )}
            </div>
          ) : null}
        </section>
      </form>
    </AdminModalShell>
  );
}