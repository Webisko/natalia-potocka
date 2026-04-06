import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import DatePicker, { registerLocale } from 'react-datepicker';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import AdminCheckbox from './AdminCheckbox';
import AdminModalShell from './AdminModalShell';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('pl', pl);

function resolveProductScopeMode(coupon) {
  if (Array.isArray(coupon?.included_product_ids) && coupon.included_product_ids.length > 0) {
    return 'include';
  }

  if (Array.isArray(coupon?.excluded_product_ids) && coupon.excluded_product_ids.length > 0) {
    return 'exclude';
  }

  return 'exclude';
}

function buildInitialState(coupon) {
  const productScopeMode = resolveProductScopeMode(coupon);
  const scopedProductIds = productScopeMode === 'include'
    ? (Array.isArray(coupon?.included_product_ids) ? coupon.included_product_ids : [])
    : (Array.isArray(coupon?.excluded_product_ids) ? coupon.excluded_product_ids : []);

  return {
    code: coupon?.code || '',
    discount_type: coupon?.discount_type || 'percent',
    value: coupon?.value ?? '',
    description: coupon?.description || '',
    is_active: coupon?.is_active == null ? true : Boolean(coupon.is_active),
    valid_from: coupon?.valid_from ? `${coupon.valid_from}`.slice(0, 16) : '',
    valid_until: coupon?.valid_until ? `${coupon.valid_until}`.slice(0, 16) : '',
    minimum_spend: coupon?.minimum_spend ?? '',
    maximum_spend: coupon?.maximum_spend ?? '',
    usage_limit: coupon?.usage_limit ?? '',
    usage_limit_per_user: coupon?.usage_limit_per_user ?? '',
    product_scope_mode: productScopeMode,
    scoped_product_ids: scopedProductIds,
    allowed_emails: Array.isArray(coupon?.allowed_emails) ? coupon.allowed_emails.join('\n') : '',
    exclude_sale_items: Boolean(coupon?.exclude_sale_items),
  };
}

function prepareNullableValue(value) {
  return value === '' || value == null ? null : value;
}

function parseDateTimeValue(value) {
  if (!value) {
    return null;
  }

  const normalizedValue = `${value}`.trim().replace(' ', 'T');
  const parsed = new Date(normalizedValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTimeValue(value) {
  if (!value) {
    return '';
  }

  return format(value, "yyyy-MM-dd'T'HH:mm");
}

function CouponDateTimeField({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">{label}</label>
      <DatePicker
        selected={parseDateTimeValue(value)}
        onChange={(nextValue) => onChange(formatDateTimeValue(nextValue))}
        showTimeSelect
        timeIntervals={15}
        timeCaption="Godzina"
        dateFormat="dd.MM.yyyy HH:mm"
        locale="pl"
        placeholderText="dd.mm.rrrr gg:mm"
        calendarStartDay={1}
        popperPlacement="bottom-start"
        wrapperClassName="admin-datepicker-wrapper"
        className="admin-datepicker-input w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
      />
      <p className="mt-2 text-fs-ui leading-6 text-mauve/55">Format polski: dd.mm.rrrr, godz. gg:mm.</p>
    </div>
  );
}

export default function AdminCouponModal({ initialCoupon, products, onClose, onSaved }) {
  const isEditing = Boolean(initialCoupon?.id);
  const [formData, setFormData] = useState(() => buildInitialState(initialCoupon));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(buildInitialState(initialCoupon));
    setError('');
  }, [initialCoupon]);

  const sortedProducts = useMemo(
    () => [...products].sort((left, right) => `${left.title || ''}`.localeCompare(`${right.title || ''}`, 'pl')),
    [products],
  );

  const toggleScopedProduct = (productId) => {
    setFormData((previous) => {
      const nextItems = previous.scoped_product_ids.includes(productId)
        ? previous.scoped_product_ids.filter((item) => item !== productId)
        : [...previous.scoped_product_ids, productId];

      return {
        ...previous,
        scoped_product_ids: nextItems,
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      code: formData.code.trim().toUpperCase(),
      discount_type: formData.discount_type,
      value: Number(formData.value),
      description: formData.description,
      is_active: formData.is_active,
      valid_from: prepareNullableValue(formData.valid_from),
      valid_until: prepareNullableValue(formData.valid_until),
      minimum_spend: prepareNullableValue(formData.minimum_spend),
      maximum_spend: prepareNullableValue(formData.maximum_spend),
      usage_limit: prepareNullableValue(formData.usage_limit),
      usage_limit_per_user: prepareNullableValue(formData.usage_limit_per_user),
      included_product_ids: formData.product_scope_mode === 'include' ? formData.scoped_product_ids : [],
      excluded_product_ids: formData.product_scope_mode === 'exclude' ? formData.scoped_product_ids : [],
      allowed_emails: formData.allowed_emails
        .split(/\n+/g)
        .map((item) => item.trim())
        .filter(Boolean),
      exclude_sale_items: formData.exclude_sale_items,
    };

    try {
      const response = isEditing
        ? await axios.put(`/api/admin/coupons/${initialCoupon.id}`, payload)
        : await axios.post('/api/admin/coupons', payload);

      onSaved(response.data?.message || (isEditing ? 'Kupon został zaktualizowany.' : 'Kupon został utworzony.'));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Nie udało się zapisać kuponu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminModalShell
      eyebrow={isEditing ? 'Edycja kuponu' : 'Nowy kupon'}
      title={isEditing ? `Edytuj kupon ${initialCoupon.code}` : 'Dodaj kupon'}
      description="Zakres opcji odpowiada temu, co realnie działa w tym sklepie: terminy, limity użyć, ograniczenia do produktów, wykluczenia produktów promocyjnych i lista dozwolonych adresów e-mail."
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
            form="admin-coupon-form"
            disabled={submitting}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-gold px-6 text-fs-label font-bold uppercase tracking-[0.2em] text-white transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Zapisywanie...' : isEditing ? 'Zapisz kupon' : 'Dodaj kupon'}
          </button>
        </div>
      )}
    >
      <form id="admin-coupon-form" onSubmit={handleSubmit} className="space-y-8">
        {error ? (
          <div className="rounded-2xl border border-rose/20 bg-rose/10 px-4 py-3 text-fs-body text-rose">
            {error}
          </div>
        ) : null}

        <section className="space-y-5">
          <div>
            <p className="text-fs-label font-bold uppercase tracking-[0.24em] text-gold">Ogólne</p>
            <h3 className="mt-2 font-serif text-fs-title-sm text-mauve">Kod, rabat i status</h3>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Kod kuponu</label>
              <input
                required
                value={formData.code}
                onChange={(event) => setFormData((previous) => ({ ...previous, code: event.target.value.toUpperCase() }))}
                className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 font-mono text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Typ rabatu</label>
              <select
                value={formData.discount_type}
                onChange={(event) => setFormData((previous) => ({ ...previous, discount_type: event.target.value }))}
                className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
              >
                <option value="percent">Zniżka procentowa</option>
                <option value="amount">Zniżka kwotowa</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Wartość rabatu</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.value}
                onChange={(event) => setFormData((previous) => ({ ...previous, value: event.target.value }))}
                className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Status</label>
              <select
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(event) => setFormData((previous) => ({ ...previous, is_active: event.target.value === 'active' }))}
                className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
              >
                <option value="active">Aktywny</option>
                <option value="inactive">Nieaktywny</option>
              </select>
            </div>
            <div className="md:col-span-2 xl:col-span-4">
              <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Opis wewnętrzny</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(event) => setFormData((previous) => ({ ...previous, description: event.target.value }))}
                className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20 resize-none"
                placeholder="Np. kampania wiosenna, webinar, oferta dla klientek po konsultacji"
              />
            </div>
          </div>
        </section>

        <section className="space-y-5 border-t border-gold/10 pt-8">
          <div>
            <p className="text-fs-label font-bold uppercase tracking-[0.24em] text-gold">Limity</p>
            <h3 className="mt-2 font-serif text-fs-title-sm text-mauve">Terminy i warunki użycia</h3>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <CouponDateTimeField
              label="Ważny od"
              value={formData.valid_from}
              onChange={(nextValue) => setFormData((previous) => ({ ...previous, valid_from: nextValue }))}
            />
            <CouponDateTimeField
              label="Ważny do"
              value={formData.valid_until}
              onChange={(nextValue) => setFormData((previous) => ({ ...previous, valid_until: nextValue }))}
            />
            <div>
              <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Minimalna kwota</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.minimum_spend}
                onChange={(event) => setFormData((previous) => ({ ...previous, minimum_spend: event.target.value }))}
                className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Maksymalna kwota</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.maximum_spend}
                onChange={(event) => setFormData((previous) => ({ ...previous, maximum_spend: event.target.value }))}
                className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Limit użyć łącznie</label>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.usage_limit}
                onChange={(event) => setFormData((previous) => ({ ...previous, usage_limit: event.target.value }))}
                className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Limit użyć na e-mail</label>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.usage_limit_per_user}
                onChange={(event) => setFormData((previous) => ({ ...previous, usage_limit_per_user: event.target.value }))}
                className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
            </div>
          </div>

          <AdminCheckbox
            checked={Boolean(formData.exclude_sale_items)}
            onChange={(checked) => setFormData((previous) => ({ ...previous, exclude_sale_items: checked }))}
            label="Wyklucz produkty będące aktualnie w promocji"
            description="Jeżeli produkt ma aktywną cenę promocyjną, kupon nie zostanie zaakceptowany przy checkoutcie."
            className="bg-white"
          />
        </section>

        <section className="space-y-5 border-t border-gold/10 pt-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div>
                <p className="text-fs-label font-bold uppercase tracking-[0.24em] text-gold">Zakres</p>
                <h3 className="mt-2 font-serif text-fs-title-sm text-mauve">Zakres działania kuponu</h3>
              </div>

              <div className="inline-flex rounded-2xl border border-mauve/10 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setFormData((previous) => ({ ...previous, product_scope_mode: 'include' }))}
                  className={`inline-flex min-w-[8.5rem] items-center justify-center rounded-xl px-4 py-2.5 text-fs-label font-bold uppercase tracking-[0.16em] transition ${formData.product_scope_mode === 'include' ? 'bg-gold text-white shadow-sm shadow-gold/20' : 'text-mauve/60 hover:text-mauve'}`}
                >
                  Dozwolone
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((previous) => ({ ...previous, product_scope_mode: 'exclude' }))}
                  className={`inline-flex min-w-[8.5rem] items-center justify-center rounded-xl px-4 py-2.5 text-fs-label font-bold uppercase tracking-[0.16em] transition ${formData.product_scope_mode === 'exclude' ? 'bg-gold text-white shadow-sm shadow-gold/20' : 'text-mauve/60 hover:text-mauve'}`}
                >
                  Wykluczone
                </button>
              </div>
            </div>

            <div className="self-start rounded-[24px] border border-mauve/10 bg-white px-5 py-4 text-fs-ui text-mauve/70 lg:min-w-[16.5rem]">
              <p className="text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/45">Zaznaczone produkty</p>
              <p className="mt-2 font-medium text-mauve">{formData.scoped_product_ids.length}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/55">
                {formData.product_scope_mode === 'include' ? 'Dozwolone produkty' : 'Wykluczone produkty'}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {sortedProducts.map((product) => {
                const checked = formData.scoped_product_ids.includes(product.id);

                return (
                  <AdminCheckbox
                    key={product.id}
                    checked={checked}
                    onChange={() => toggleScopedProduct(product.id)}
                    label={product.title}
                    description={product.slug}
                    className={checked ? 'border-gold/25 bg-gold/10' : 'bg-white hover:border-mauve/20'}
                  />
                );
              })}
            </div>
          </div>
        </section>

        <section className="space-y-5 border-t border-gold/10 pt-8">
          <div>
            <p className="text-fs-label font-bold uppercase tracking-[0.24em] text-gold">Adresy e-mail</p>
            <h3 className="mt-2 font-serif text-fs-title-sm text-mauve">Lista dozwolonych adresów</h3>
          </div>

          <div>
            <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Dozwolone adresy e-mail</label>
            <textarea
              rows={6}
              value={formData.allowed_emails}
              onChange={(event) => setFormData((previous) => ({ ...previous, allowed_emails: event.target.value }))}
              className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20 resize-none"
              placeholder={'jeden@adres.pl\n*@gmail.com'}
            />
            <p className="mt-2 text-fs-ui leading-6 text-mauve/55">Możesz wpisać konkretne adresy lub wzorce z gwiazdką, np. *@gmail.com.</p>
          </div>
        </section>
      </form>
    </AdminModalShell>
  );
}