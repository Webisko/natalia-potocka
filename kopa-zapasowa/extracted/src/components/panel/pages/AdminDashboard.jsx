import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CircleSlash,
  CheckCircle2,
  Clock3,
  Edit,
  Eye,
  FileText,
  PlusCircle,
  Settings,
  ShoppingBag,
  Star,
  Tag,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import AdminActionIconButton from '../admin/AdminActionIconButton';
import AdminCouponModal from '../admin/AdminCouponModal';
import AdminListCard from '../admin/AdminListCard';
import AdminPageSettingsModal from '../admin/AdminPageSettingsModal';
import AdminMediaLibraryTab from '../admin/AdminMediaLibraryTab';
import AdminStatusBadge from '../admin/AdminStatusBadge';
import AdminStatusIcon from '../admin/AdminStatusIcon';

const AdminReviews = lazy(() => import('./AdminReviews'));
const CourseEditorModal = lazy(() => import('../admin/CourseEditorModal'));
const AdminUserModal = lazy(() => import('../admin/AdminUserModal'));
const AdminProductEdit = lazy(() => import('./AdminProductEdit'));
const AdminOrderModal = lazy(() => import('../admin/AdminOrderModal'));

function LazyPanelLoader() {
  return <div className="p-8 text-center text-fs-body text-mauve/60">Ładowanie narzędzia...</div>;
}

function SettingsGroup({ eyebrow, title, description, children, className = '' }) {
  return (
    <section className={`rounded-[32px] border border-white/80 bg-white/70 p-6 shadow-sm md:p-8 ${className}`.trim()}>
      <div className="border-b border-gold/10 pb-5">
        <p className="text-fs-label font-bold uppercase tracking-[0.24em] text-gold/80">{eyebrow}</p>
        <div className="mt-3 flex items-center gap-4">
          <h3 className="font-serif text-fs-title-sm text-mauve">{title}</h3>
          <span className="h-px flex-1 bg-gold/15" />
        </div>
        {description ? <p className="mt-3 max-w-3xl text-fs-body leading-7 text-mauve/65">{description}</p> : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function formatCurrency(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return '0.00 PLN';
  }

  return `${numericValue.toFixed(2)} PLN`;
}

function formatDateTime(value) {
  if (!value) {
    return 'Brak daty';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Brak daty';
  }

  return parsed.toLocaleString('pl-PL');
}

function formatDate(value) {
  if (!value) {
    return 'bez terminu';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'bez terminu';
  }

  return parsed.toLocaleDateString('pl-PL');
}

function getUserDisplayName(user) {
  const firstName = `${user?.first_name || ''}`.trim();
  if (firstName) {
    return firstName;
  }

  if (user?.email === 'doula.otula.np@gmail.com') {
    return 'Natalia';
  }

  const emailPrefix = `${user?.email || ''}`.split('@')[0]?.trim();
  return emailPrefix || 'nieznajoma';
}

function getOrderNumberLabel(order) {
  const visibleNumber = `${order?.order_number || ''}`.trim();
  return visibleNumber || `Techniczne: ${`${order?.id || ''}`.slice(0, 8)}`;
}

function getOrderCustomerName(order) {
  const fullName = [order?.customer_first_name, order?.customer_last_name]
    .map((part) => `${part || ''}`.trim())
    .filter(Boolean)
    .join(' ');

  return fullName || 'Klientka bez uzupełnionego profilu';
}

function getProductTypeMeta(type) {
  if (type === 'audio') {
    return { label: 'Medytacja', tone: 'meditation' };
  }

  if (type === 'course') {
    return { label: 'Kurs', tone: 'course' };
  }

  return { label: 'Webinar', tone: 'webinar' };
}

function getProductStatusMeta(product) {
  if (product?.type === 'course' && !product?.is_published) {
    return { title: 'Kurs testowy i niepubliczny', tone: 'warning', icon: AlertTriangle };
  }

  return product?.is_published
    ? { title: 'Opublikowany', tone: 'success', icon: CheckCircle2 }
    : { title: 'Nieopublikowany', tone: 'neutral', icon: CircleSlash };
}

function getOrderStatusMeta(status) {
  if (status === 'completed' || status === 'manual') {
    return { title: 'Zrealizowane', tone: 'success', icon: CheckCircle2 };
  }

  if (status === 'pending' || status === 'pending_bank_transfer') {
    return { title: 'W trakcie realizacji', tone: 'warning', icon: Clock3 };
  }

  return { title: 'Anulowane lub niezrealizowane', tone: 'danger', icon: XCircle };
}

function getCouponStatusMeta(coupon) {
  return coupon?.is_active
    ? { title: 'Aktywny', tone: 'success', icon: CheckCircle2 }
    : { title: 'Nieaktywny', tone: 'neutral', icon: CircleSlash };
}

function isSeoLengthIdeal(value, kind) {
  const length = `${value || ''}`.trim().length;

  if (kind === 'description') {
    return length >= 150 && length <= 160;
  }

  return length >= 50 && length <= 60;
}

function getPageSeoMeta(page) {
  const hasRequiredFields = Boolean(page?.meta_title?.trim() && page?.meta_desc?.trim() && page?.canonical_url?.trim());

  if (!hasRequiredFields) {
    return { title: 'SEO nieuzupełnione', tone: 'neutral', icon: CircleSlash };
  }

  if (page.noindex || !isSeoLengthIdeal(page.meta_title, 'title') || !isSeoLengthIdeal(page.meta_desc, 'description')) {
    return {
      title: page.noindex ? 'SEO uzupełnione, ale strona ma noindex' : 'SEO uzupełnione, ale wymaga poprawy',
      tone: 'warning',
      icon: AlertTriangle,
    };
  }

  return { title: 'SEO kompletne i optymalne', tone: 'success', icon: CheckCircle2 };
}

function isPromoActive(product) {
  return Boolean(
    product?.promotional_price
      && (!product.promotional_price_until || new Date(product.promotional_price_until) >= new Date()),
  );
}

function renderCouponRestrictions(coupon) {
  const fragments = [];

  if (coupon.minimum_spend != null || coupon.maximum_spend != null) {
    fragments.push(`kwota ${coupon.minimum_spend != null ? `od ${formatCurrency(coupon.minimum_spend)}` : ''}${coupon.minimum_spend != null && coupon.maximum_spend != null ? ' ' : ''}${coupon.maximum_spend != null ? `do ${formatCurrency(coupon.maximum_spend)}` : ''}`.trim());
  }

  if (Array.isArray(coupon.included_product_ids) && coupon.included_product_ids.length > 0) {
    fragments.push(`produkty: ${coupon.included_product_ids.length}`);
  }

  if (Array.isArray(coupon.excluded_product_ids) && coupon.excluded_product_ids.length > 0) {
    fragments.push(`wykluczenia: ${coupon.excluded_product_ids.length}`);
  }

  if (Array.isArray(coupon.allowed_emails) && coupon.allowed_emails.length > 0) {
    fragments.push(`e-maile: ${coupon.allowed_emails.length}`);
  }

  if (coupon.exclude_sale_items) {
    fragments.push('bez promocji');
  }

  if (coupon.valid_until) {
    fragments.push(`do ${formatDate(coupon.valid_until)}`);
  }

  return fragments.length > 0 ? fragments.join(' • ') : 'Brak dodatkowych ograniczeń';
}

function getProductPreviewPath(product) {
  const slug = `${product?.slug || ''}`.trim();
  return slug ? `/oferta/${slug}` : '/oferta';
}

function getPagePreviewPath(page) {
  if (page?.page_key === 'home') {
    return '/';
  }

  const slug = `${page?.slug || page?.page_key || ''}`.trim().replace(/^\/+/, '');
  return slug ? `/${slug}` : '/';
}

function openPreviewInNewTab(path) {
  if (typeof window === 'undefined' || !path) {
    return;
  }

  window.open(path, '_blank', 'noopener,noreferrer');
}

const TABLE_ACTION_BUTTON_CLASS = 'h-9 w-9 rounded-lg';

function getClickableCellClassName(baseClassName) {
  return `${baseClassName} p-0`;
}

function getClickableCellButtonClassName(paddingClassName) {
  return `block w-full ${paddingClassName} text-left transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/30`;
}

export default function AdminDashboard({ initialTab = 'pages' }) {
  const { user } = useAuth();
  const isAdmin = user?.is_admin;

  const [activeTab, setActiveTab] = useState(initialTab);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({});
  const [pages, setPages] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userModalState, setUserModalState] = useState({ isOpen: false, user: null });
  const [orderModalState, setOrderModalState] = useState({ isOpen: false, order: null });
  const [pageModalState, setPageModalState] = useState({ isOpen: false, page: null });
  const [couponModalState, setCouponModalState] = useState({ isOpen: false, coupon: null });
  const [editingCourse, setEditingCourse] = useState(null);
  const [productModalState, setProductModalState] = useState({ isOpen: false, productId: 'new' });

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      if (activeTab === 'products') {
        const response = await axios.get('/api/admin/products');
        setProducts(response.data || []);
      } else if (activeTab === 'users') {
        const [usersResponse, productsResponse] = await Promise.all([
          axios.get('/api/admin/users'),
          axios.get('/api/admin/products'),
        ]);
        setUsers(usersResponse.data || []);
        setProducts(productsResponse.data || []);
      } else if (activeTab === 'orders') {
        const [ordersResponse, productsResponse] = await Promise.all([
          axios.get('/api/admin/orders'),
          axios.get('/api/admin/products'),
        ]);
        setOrders(ordersResponse.data || []);
        setProducts(productsResponse.data || []);
      } else if (activeTab === 'coupons' && isAdmin) {
        const [couponsResponse, productsResponse] = await Promise.all([
          axios.get('/api/admin/coupons'),
          axios.get('/api/admin/products'),
        ]);
        setCoupons(couponsResponse.data || []);
        setProducts(productsResponse.data || []);
      } else if (activeTab === 'pages' && isAdmin) {
        const response = await axios.get('/api/admin/pages');
        setPages((response.data || []).map((page) => ({
          ...page,
          use_featured_meta_image: !page.meta_image_url || page.meta_image_url === page.featured_image_url,
        })));
      } else if (activeTab === 'settings' && isAdmin) {
        const response = await axios.get('/api/admin/settings');
        setSettings(response.data || {});
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleDeleteProduct = async (productId) => {
    if (!isAdmin || !window.confirm('Na pewno usunąć ten produkt?')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/products/${productId}`);
      fetchData();
    } catch (error) {
      alert(`Błąd usuwania: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userRecord) => {
    if (!isAdmin || !window.confirm(`Usunąć konto ${userRecord.email}?`)) {
      return;
    }

    try {
      await axios.delete(`/api/admin/users/${userRecord.id}`);
      alert('Użytkownik został usunięty.');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Nie udało się usunąć użytkownika.');
    }
  };

  const handleDeleteOrder = async (orderRecord) => {
    if (!isAdmin || !window.confirm(`Usunąć zamówienie ${getOrderNumberLabel(orderRecord)} przypisane do ${orderRecord.customer_email}?`)) {
      return;
    }

    try {
      await axios.delete(`/api/admin/orders/${orderRecord.id}`);
      alert('Zamówienie zostało usunięte.');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Nie udało się usunąć zamówienia.');
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!isAdmin || !window.confirm('Usunąć ten kupon?')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/coupons/${couponId}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Nie udało się usunąć kuponu.');
    }
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();

    try {
      await axios.post('/api/admin/settings', settings);
      alert('Ustawienia zapisane');
    } catch (error) {
      alert(`Błąd: ${error.message}`);
    }
  };

  const tabs = isAdmin
    ? [
        { id: 'pages', label: 'Strony', icon: <FileText size={18} /> },
        { id: 'products', label: 'Produkty', icon: <BookOpen size={18} /> },
        { id: 'orders', label: 'Zamówienia', icon: <ShoppingBag size={18} /> },
        { id: 'reviews', label: 'Opinie', icon: <Star size={18} /> },
        { id: 'users', label: 'Użytkownicy', icon: <Users size={18} /> },
        { id: 'coupons', label: 'Kupony', icon: <Tag size={18} /> },
        { id: 'media', label: 'Media', icon: <FileText size={18} /> },
        { id: 'settings', label: 'Ustawienia', icon: <Settings size={18} /> },
      ]
    : [
        { id: 'products', label: 'Produkty', icon: <BookOpen size={18} /> },
        { id: 'orders', label: 'Zamówienia', icon: <ShoppingBag size={18} /> },
        { id: 'reviews', label: 'Opinie', icon: <Star size={18} /> },
        { id: 'users', label: 'Użytkownicy', icon: <Users size={18} /> },
      ];

  return (
    <div className="bg-nude">
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="mb-10 flex flex-col gap-6 pb-4">
          <div>
            <h1 className="mb-2 font-serif text-fs-title-md text-mauve">
              Hej, {getUserDisplayName(user)}!
            </h1>
          </div>

          <nav className="admin-scrollbar admin-scrollbar-x relative z-0 flex w-full flex-nowrap items-center justify-start gap-1.5 overflow-x-auto rounded-[28px] border border-white/60 bg-white/40 p-2 shadow-sm lg:gap-2 xl:justify-between xl:gap-0 xl:overflow-visible">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex min-w-max shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-center text-[0.68rem] font-bold uppercase leading-tight tracking-[0.14em] transition-all sm:px-4 sm:text-fs-label md:px-3 md:py-2.5 md:text-[0.72rem] md:tracking-[0.12em] lg:gap-2 lg:px-3.5 lg:text-[0.76rem] xl:px-4 xl:text-fs-label ${activeTab === tab.id ? 'bg-gold text-white shadow-lg shadow-gold/20' : 'text-mauve/65 hover:bg-white/40 hover:text-mauve'} xl:first:ml-0 xl:last:mr-0`}
              >
                <span className="flex shrink-0 justify-center">{tab.icon}</span>
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="animate-in fade-in duration-500 space-y-8">
          {activeTab === 'products' ? (
            <AdminListCard
              title="Lista produktów"
              count={products.length}
              description="Publikuj, ukrywaj i edytuj ofertę sklepu w jednym, spójnym widoku tabeli."
              action={(
                <button
                  type="button"
                  onClick={() => setProductModalState({ isOpen: true, productId: 'new' })}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gold px-6 py-3 text-fs-label font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.02] hover:bg-gold/90 hover:shadow-xl hover:shadow-gold/20"
                >
                  <PlusCircle size={18} /> Dodaj nowy produkt
                </button>
              )}
            >
              {loading ? (
                <div className="p-20 text-center text-fs-body text-mauve/50">Ładowanie produktów...</div>
              ) : (
                <div className="admin-scrollbar admin-scrollbar-x overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gold/5 bg-nude/30">
                        <th className="px-8 py-4 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Tytuł</th>
                        <th className="px-8 py-4 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Typ</th>
                        <th className="px-8 py-4 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Status</th>
                        <th className="px-8 py-4 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Adres</th>
                        <th className="px-8 py-4 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Cena</th>
                        <th className="px-8 py-4 text-right text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Akcje</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gold/5">
                      {products.map((product) => {
                        const promoActive = isPromoActive(product);
                        const typeMeta = getProductTypeMeta(product.type);
                        const statusMeta = getProductStatusMeta(product);
                        const productPreviewPath = getProductPreviewPath(product);
                        const isPreviewAvailable = Boolean(product.is_published);
                        const isTestCourse = product.type === 'course' && !product.is_published;

                        return (
                          <tr key={product.id} className="transition-colors hover:bg-white/40">
                            <td className={getClickableCellClassName('px-8 py-6')}>
                              <button
                                type="button"
                                onClick={() => setProductModalState({ isOpen: true, productId: product.id })}
                                className={getClickableCellButtonClassName('px-8 py-6')}
                              >
                                <div>
                                  <p className="font-serif text-fs-body-lg text-mauve transition group-hover:text-terracotta">{product.title}</p>
                                  <div className="mt-2 flex flex-wrap gap-2 text-fs-ui text-mauve/50">
                                    {product.type === 'course' ? <span>{product.module_count || 0} modułów • {product.lesson_count || 0} lekcji</span> : null}
                                    {isTestCourse ? <span>Kurs roboczy do testów panelu i ścieżki klientki.</span> : null}
                                    {promoActive ? <span>Aktywna cena promocyjna jest widoczna w sklepie.</span> : null}
                                  </div>
                                </div>
                              </button>
                            </td>
                            <td className="px-8 py-6"><AdminStatusBadge label={typeMeta.label} tone={typeMeta.tone} /></td>
                            <td className="px-8 py-6"><AdminStatusIcon title={statusMeta.title} tone={statusMeta.tone} icon={statusMeta.icon} /></td>
                            <td className="px-8 py-6 text-fs-ui italic text-mauve/55">{productPreviewPath}</td>
                            <td className="px-8 py-6">
                              <div className="space-y-1">
                                <div className="font-serif text-fs-body-lg text-mauve whitespace-nowrap">{promoActive ? formatCurrency(product.promotional_price) : formatCurrency(product.price)}</div>
                                {promoActive ? <div className="text-fs-label text-mauve/50 line-through">{formatCurrency(product.price)}</div> : null}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex justify-end gap-2">
                                <AdminActionIconButton title="Podgląd produktu" onClick={() => openPreviewInNewTab(productPreviewPath)} icon={<Eye size={16} />} tone="accent" className={TABLE_ACTION_BUTTON_CLASS} />
                                <AdminActionIconButton title="Edytuj produkt" onClick={() => setProductModalState({ isOpen: true, productId: product.id })} icon={<Edit size={16} />} className={TABLE_ACTION_BUTTON_CLASS} />
                                {product.type === 'course' ? (
                                  <AdminActionIconButton title="Edytuj lekcje" onClick={() => setEditingCourse({ productId: product.id, productTitle: product.title })} icon={<BookOpen size={16} />} tone="accent" className={TABLE_ACTION_BUTTON_CLASS} />
                                ) : null}
                                {isAdmin ? <AdminActionIconButton title="Usuń produkt" onClick={() => handleDeleteProduct(product.id)} icon={<Trash2 size={16} />} tone="danger" className={TABLE_ACTION_BUTTON_CLASS} /> : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-8 py-10 text-center italic text-mauve/55">Brak produktów do wyświetlenia.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              )}
            </AdminListCard>
          ) : null}

          {activeTab === 'reviews' ? (
            <Suspense fallback={<LazyPanelLoader />}>
              <AdminReviews />
            </Suspense>
          ) : null}

          {activeTab === 'users' ? (
            <AdminListCard
              title="Lista użytkowników"
              count={users.length}
              description="Twórz i edytuj konta, role oraz dostępy do produktów z jednego widoku."
              action={(
                <button
                  type="button"
                  onClick={() => setUserModalState({ isOpen: true, user: null })}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gold px-6 py-3 text-fs-label font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.02] hover:bg-gold/90 hover:shadow-xl hover:shadow-gold/20"
                >
                  <PlusCircle size={18} /> Dodaj użytkownika
                </button>
              )}
            >
              {loading ? (
                <div className="p-20 text-center text-fs-body text-mauve/50">Ładowanie użytkowników...</div>
              ) : (
                <div className="admin-scrollbar admin-scrollbar-x overflow-x-auto">
                  <table className="w-full table-fixed text-left">
                    <thead>
                      <tr className="border-b border-gold/5 bg-nude/30">
                        <th className="w-[36%] px-3 py-4 text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/55 md:px-5 lg:px-6">Użytkownik</th>
                        <th className="w-[34%] px-3 py-4 text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/55 md:px-5 lg:px-6">E-mail</th>
                        <th className="w-[74px] px-2 py-4 text-center text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/55 md:w-[98px] md:px-3">Zakupione produkty</th>
                        <th className="w-[56px] px-2 py-4 text-center text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/55 md:w-[72px] md:px-4">Status</th>
                        <th className="w-[82px] px-2 py-4 text-right text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/55 md:w-[96px] md:px-4 lg:px-5">Akcje</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gold/5">
                      {users.map((account) => {
                        const displayName = [account.first_name, account.last_name].filter(Boolean).join(' ');
                        const purchasedProductsCount = Array.isArray(account.purchased_items) ? account.purchased_items.length : 0;

                        return (
                          <tr key={account.id} className={`transition-colors hover:bg-white/40 ${account.is_admin ? 'bg-rose/5' : ''}`}>
                            <td className={getClickableCellClassName('px-3 py-5 md:px-5 lg:px-6')}>
                              <button
                                type="button"
                                onClick={() => setUserModalState({ isOpen: true, user: account })}
                                className={getClickableCellButtonClassName('px-3 py-5 md:px-5 lg:px-6')}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate font-serif text-fs-body text-mauve sm:text-fs-body-lg">
                                      {displayName || 'Bez nazwy kontaktu'}
                                    </span>
                                    {account.is_admin ? (
                                      <span title="Administrator" className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rose/20 bg-rose/10 text-rose sm:h-7 sm:w-7">
                                        <Star size={14} fill="currentColor" />
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="mt-1 truncate text-[0.66rem] uppercase tracking-[0.14em] text-mauve/50 sm:mt-2 sm:text-fs-label sm:tracking-[0.16em]">ID: {account.id.slice(0, 8)}</div>
                                </div>
                              </button>
                            </td>
                            <td className="px-3 py-5 md:px-5 lg:px-6"><div className="max-w-[108px] truncate text-[0.8rem] font-medium text-mauve sm:max-w-[140px] md:max-w-[210px]" title={account.email}>{account.email}</div></td>
                            <td className="px-2 py-5 text-center text-fs-ui font-semibold text-mauve/70 md:px-3">{purchasedProductsCount}</td>
                            <td className="px-2 py-5 text-center md:px-4">
                              <span title={account.email_confirmed ? 'Potwierdzony e-mail' : 'Niepotwierdzony e-mail'} className={`inline-flex h-7 w-7 items-center justify-center rounded-full border md:h-8 md:w-8 ${account.email_confirmed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                                {account.email_confirmed ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                              </span>
                            </td>
                            <td className="px-2 py-5 md:px-4 lg:px-5">
                              <div className="flex justify-end gap-1 md:gap-1.5">
                                <AdminActionIconButton title="Edytuj użytkownika" onClick={() => setUserModalState({ isOpen: true, user: account })} icon={<Edit size={16} />} className={TABLE_ACTION_BUTTON_CLASS} />
                                <AdminActionIconButton title="Usuń użytkownika" onClick={() => handleDeleteUser(account)} icon={<Trash2 size={16} />} tone="danger" className={TABLE_ACTION_BUTTON_CLASS} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-8 py-10 text-center italic text-mauve/55">Brak użytkowników do wyświetlenia.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              )}
            </AdminListCard>
          ) : null}

          {activeTab === 'orders' ? (
            <AdminListCard title="Lista zamówień" count={orders.length} description="Rejestr transakcji ze Stripe, przelewów tradycyjnych i dostępów nadawanych ręcznie.">
              {loading ? (
                <div className="p-20 text-center text-fs-body text-mauve/50">Ładowanie zamówień...</div>
              ) : (
                <div className="admin-scrollbar admin-scrollbar-x overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gold/5 bg-nude/30">
                        <th className="px-8 py-4 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Zamówienie</th>
                        <th className="px-8 py-4 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Klientka</th>
                        <th className="px-8 py-4 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Produkt</th>
                        <th className="px-8 py-4 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Kwota</th>
                        <th className="px-8 py-4 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Status</th>
                        <th className="px-8 py-4 text-right text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Akcje</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gold/5">
                      {orders.map((order) => {
                        const statusMeta = getOrderStatusMeta(order.status);

                        return (
                          <tr key={order.id} className="transition-colors hover:bg-white/40">
                            <td className={getClickableCellClassName('px-8 py-6 text-fs-ui text-mauve/60')}>
                              <button
                                type="button"
                                onClick={() => setOrderModalState({ isOpen: true, order })}
                                className={getClickableCellButtonClassName('px-8 py-6 text-fs-ui text-mauve/60')}
                              >
                                <div>
                                  <p className="font-serif text-fs-body text-mauve">{getOrderNumberLabel(order)}</p>
                                  <div className="mt-2 text-fs-label uppercase tracking-[0.16em] text-mauve/45">{formatDateTime(order.created_at)}</div>
                                </div>
                              </button>
                            </td>
                            <td className="px-8 py-6">
                              <div className="space-y-1">
                                <div className="font-medium text-mauve">{getOrderCustomerName(order)}</div>
                                <div className="text-fs-ui text-mauve/55">{order.customer_email}</div>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-fs-ui text-mauve/75">{order.product_title || order.product_id}</td>
                            <td className="px-8 py-6">
                              <div className="space-y-1">
                                <div className="font-serif text-fs-body-lg text-mauve whitespace-nowrap">{formatCurrency(order.amount_total)}</div>
                                {order.applied_coupon_code ? <div className="text-fs-label uppercase tracking-[0.16em] text-mauve/45">Kupon: {order.applied_coupon_code}</div> : null}
                              </div>
                            </td>
                            <td className="px-8 py-6"><AdminStatusIcon title={statusMeta.title} tone={statusMeta.tone} icon={statusMeta.icon} /></td>
                            <td className="px-8 py-6">
                              <div className="flex justify-end gap-2">
                                <AdminActionIconButton title="Edytuj zamówienie" onClick={() => setOrderModalState({ isOpen: true, order })} icon={<Edit size={16} />} className={TABLE_ACTION_BUTTON_CLASS} />
                                <AdminActionIconButton title="Usuń zamówienie" onClick={() => handleDeleteOrder(order)} icon={<Trash2 size={16} />} tone="danger" className={TABLE_ACTION_BUTTON_CLASS} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-8 py-10 text-center italic text-mauve/55">Brak zamówień do wyświetlenia.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              )}
            </AdminListCard>
          ) : null}

          {activeTab === 'pages' && isAdmin ? (
            <AdminListCard title="Lista stron" count={pages.length} description="Ujednolicony widok stron publicznych. Pełne ustawienia danej strony otwierają się w modalu, tak jak w innych zakładkach panelu.">
              {loading ? (
                <div className="p-20 text-center text-fs-body text-mauve/50">Ładowanie stron...</div>
              ) : (
                <div className="admin-scrollbar admin-scrollbar-x overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gold/5 bg-nude/30">
                        <th className="px-8 py-4 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Strona</th>
                        <th className="px-8 py-4 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Adres</th>
                        <th className="px-8 py-4 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">SEO</th>
                        <th className="px-8 py-4 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Obrazek</th>
                        <th className="px-8 py-4 text-right text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Akcje</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gold/5">
                      {pages.map((page) => {
                        const seoMeta = getPageSeoMeta(page);
                        const pagePreviewPath = getPagePreviewPath(page);

                        return (
                          <tr key={page.page_key} className="transition-colors hover:bg-white/40">
                            <td className={getClickableCellClassName('px-8 py-6')}>
                              <button
                                type="button"
                                onClick={() => setPageModalState({ isOpen: true, page })}
                                className={getClickableCellButtonClassName('px-8 py-6')}
                              >
                                <div>
                                  <p className="font-serif text-fs-body-lg text-mauve">{page.page_name}</p>
                                  <div className="mt-2 text-fs-label uppercase tracking-[0.16em] text-mauve/45">Klucz: {page.page_key}</div>
                                </div>
                              </button>
                            </td>
                            <td className="px-8 py-6 text-fs-ui text-mauve/60">{pagePreviewPath}</td>
                            <td className="px-8 py-6"><AdminStatusIcon title={seoMeta.title} tone={seoMeta.tone} icon={seoMeta.icon} /></td>
                            <td className="px-8 py-6 text-fs-ui text-mauve/60">{page.featured_image_url ? 'Dodany' : 'Brak'}</td>
                            <td className="px-8 py-6">
                              <div className="flex justify-end gap-2">
                                <AdminActionIconButton title="Podgląd strony" onClick={() => openPreviewInNewTab(pagePreviewPath)} icon={<Eye size={16} />} tone="accent" className={TABLE_ACTION_BUTTON_CLASS} />
                                <AdminActionIconButton title="Edytuj stronę" onClick={() => setPageModalState({ isOpen: true, page })} icon={<Edit size={16} />} className={TABLE_ACTION_BUTTON_CLASS} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </AdminListCard>
          ) : null}

          {activeTab === 'coupons' && isAdmin ? (
            <AdminListCard
              title="Lista kuponów"
              count={coupons.length}
              description="Kody rabatowe korzystają z tego samego układu listy i modali co pozostałe sekcje panelu."
              action={(
                <button
                  type="button"
                  onClick={() => setCouponModalState({ isOpen: true, coupon: null })}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gold px-6 py-3 text-fs-label font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.02] hover:bg-gold/90 hover:shadow-xl hover:shadow-gold/20"
                >
                  <PlusCircle size={18} /> Dodaj kupon
                </button>
              )}
            >
              {loading ? (
                <div className="p-20 text-center text-fs-body text-mauve/50">Ładowanie kuponów...</div>
              ) : (
                <div className="admin-scrollbar admin-scrollbar-x overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gold/5 bg-nude/30">
                        <th className="px-8 py-4 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Kod</th>
                        <th className="px-8 py-4 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Rabat</th>
                        <th className="px-8 py-4 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Ograniczenia</th>
                        <th className="px-8 py-4 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Status</th>
                        <th className="px-8 py-4 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Użycia</th>
                        <th className="px-8 py-4 text-right text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Akcje</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gold/5">
                      {coupons.map((coupon) => {
                        const statusMeta = getCouponStatusMeta(coupon);

                        return (
                          <tr key={coupon.id} className="transition-colors hover:bg-white/40">
                            <td className={getClickableCellClassName('px-8 py-6 font-mono text-fs-body-lg font-bold text-mauve')}>
                              <button
                                type="button"
                                onClick={() => setCouponModalState({ isOpen: true, coupon })}
                                className={getClickableCellButtonClassName('px-8 py-6 font-mono text-fs-body-lg font-bold text-mauve')}
                              >
                                {coupon.code}
                              </button>
                            </td>
                            <td className="px-8 py-6 text-fs-ui font-bold text-gold">{coupon.discount_type === 'percent' ? `-${coupon.value}%` : `-${formatCurrency(coupon.value)}`}</td>
                            <td className="px-8 py-6 text-fs-ui text-mauve/60">{renderCouponRestrictions(coupon)}</td>
                            <td className="px-8 py-6"><AdminStatusIcon title={statusMeta.title} tone={statusMeta.tone} icon={statusMeta.icon} /></td>
                            <td className="px-8 py-6 text-fs-ui text-mauve/70">{coupon.times_used}{coupon.usage_limit != null ? ` / ${coupon.usage_limit}` : ''}</td>
                            <td className="px-8 py-6">
                              <div className="flex justify-end gap-2">
                                <AdminActionIconButton title="Edytuj kupon" onClick={() => setCouponModalState({ isOpen: true, coupon })} icon={<Edit size={16} />} className={TABLE_ACTION_BUTTON_CLASS} />
                                <AdminActionIconButton title="Usuń kupon" onClick={() => handleDeleteCoupon(coupon.id)} icon={<Trash2 size={16} />} tone="danger" className={TABLE_ACTION_BUTTON_CLASS} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {coupons.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-8 py-10 text-center italic text-mauve/55">Brak aktywnych kuponów w sklepie.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              )}
            </AdminListCard>
          ) : null}

          {activeTab === 'media' && isAdmin ? <AdminMediaLibraryTab /> : null}

          {activeTab === 'settings' && isAdmin ? (
            <div className="animate-in slide-in-from-right-4 duration-500 space-y-6">
              <div className="rounded-[40px] border border-white/80 bg-white/60 p-8 shadow-sm md:p-12">
                <h2 className="mb-2 font-serif text-fs-title-sm text-mauve">Ustawienia platformy</h2>
                <p className="text-fs-body text-mauve/60">Sekcje ustawień korzystają z tych samych odstępów i układu co pozostałe elementy panelu.</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <SettingsGroup eyebrow="Płatności" title="Stripe" description="Wszystkie klucze Stripe są zebrane w jednym bloku, aby łatwiej kontrolować konfigurację checkoutu i webhooków.">
                  <div className="grid gap-5 xl:grid-cols-2">
                    <div className="space-y-1">
                      <label className="ml-1 text-fs-label font-bold uppercase tracking-[0.2em] text-gold">Klucz Stripe (Publiczny)</label>
                      <input value={settings.stripe_pub || ''} onChange={(event) => setSettings({ ...settings, stripe_pub: event.target.value })} className="h-14 w-full rounded-2xl border border-gold/10 bg-white px-6 font-mono text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20" placeholder="STRIPE_PUBLISHABLE_KEY_PLACEHOLDER" />
                    </div>
                    <div className="space-y-1">
                      <label className="ml-1 text-fs-label font-bold uppercase tracking-[0.2em] text-gold">Klucz Stripe (Prywatny / Secret)</label>
                      <input type="password" value={settings.stripe_secret || ''} onChange={(event) => setSettings({ ...settings, stripe_secret: event.target.value })} className="h-14 w-full rounded-2xl border border-gold/10 bg-white px-6 font-mono text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20" placeholder="STRIPE_SECRET_KEY_PLACEHOLDER" />
                    </div>
                    <div className="space-y-1 xl:col-span-2">
                      <label className="ml-1 text-fs-label font-bold uppercase tracking-[0.2em] text-gold">Klucz Webhook Stripe</label>
                      <input type="password" value={settings.stripe_webhook_secret || ''} onChange={(event) => setSettings({ ...settings, stripe_webhook_secret: event.target.value })} className="h-14 w-full rounded-2xl border border-gold/10 bg-white px-6 font-mono text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20" placeholder="STRIPE_WEBHOOK_SECRET_PLACEHOLDER" />
                    </div>
                  </div>
                </SettingsGroup>

                <SettingsGroup eyebrow="Komunikacja" title="Kontakt i powiadomienia" description="W tym miejscu trzymasz dane kontaktowe marki oraz adres, na który mają trafiać wiadomości systemowe i informacje o zamówieniach.">
                  <div className="grid gap-5 xl:grid-cols-2">
                    <div className="space-y-1">
                      <label className="ml-1 text-fs-label font-bold uppercase tracking-[0.2em] text-gold">E-mail kontaktowy i powiadomień</label>
                      <input value={settings.notify_email || ''} onChange={(event) => setSettings({ ...settings, notify_email: event.target.value })} className="h-14 w-full rounded-2xl border border-gold/10 bg-white px-6 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20" placeholder="kontakt@domena.pl" />
                    </div>
                    <div className="space-y-1">
                      <label className="ml-1 text-fs-label font-bold uppercase tracking-[0.2em] text-gold">Telefon</label>
                      <input value={settings.contact_phone || ''} onChange={(event) => setSettings({ ...settings, contact_phone: event.target.value })} className="h-14 w-full rounded-2xl border border-gold/10 bg-white px-6 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20" placeholder="+48 ..." />
                    </div>
                    <div className="space-y-1">
                      <label className="ml-1 text-fs-label font-bold uppercase tracking-[0.2em] text-gold">Instagram</label>
                      <input value={settings.instagram_url || ''} onChange={(event) => setSettings({ ...settings, instagram_url: event.target.value })} className="h-14 w-full rounded-2xl border border-gold/10 bg-white px-6 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20" placeholder="https://instagram.com/..." />
                    </div>
                    <div className="space-y-1">
                      <label className="ml-1 text-fs-label font-bold uppercase tracking-[0.2em] text-gold">Facebook</label>
                      <input value={settings.facebook_url || ''} onChange={(event) => setSettings({ ...settings, facebook_url: event.target.value })} className="h-14 w-full rounded-2xl border border-gold/10 bg-white px-6 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20" placeholder="https://facebook.com/..." />
                    </div>
                  </div>
                </SettingsGroup>

                <SettingsGroup eyebrow="Obsługa ręczna" title="Przelewy tradycyjne" description="Dane wyświetlane klientce przy wyborze przelewu manualnego. Sekcja jest podzielona na czytelne pola w układzie dwukolumnowym.">
                  <div className="grid gap-5 xl:grid-cols-2">
                    <div className="space-y-1">
                      <label className="ml-1 text-fs-label font-bold uppercase tracking-[0.2em] text-gold">Odbiorca przelewu tradycyjnego</label>
                      <input value={settings.bank_account_name || ''} onChange={(event) => setSettings({ ...settings, bank_account_name: event.target.value })} className="h-14 w-full rounded-2xl border border-gold/10 bg-white px-6 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20" placeholder="Imię i nazwisko lub nazwa odbiorcy" />
                    </div>
                    <div className="space-y-1">
                      <label className="ml-1 text-fs-label font-bold uppercase tracking-[0.2em] text-gold">Numer konta do przelewu</label>
                      <input value={settings.bank_account_number || ''} onChange={(event) => setSettings({ ...settings, bank_account_number: event.target.value })} className="h-14 w-full rounded-2xl border border-gold/10 bg-white px-6 font-mono text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20" placeholder="12 3456 7890 1234 5678 9012 3456" />
                    </div>
                    <div className="space-y-1">
                      <label className="ml-1 text-fs-label font-bold uppercase tracking-[0.2em] text-gold">Nazwa banku</label>
                      <input value={settings.bank_name || ''} onChange={(event) => setSettings({ ...settings, bank_name: event.target.value })} className="h-14 w-full rounded-2xl border border-gold/10 bg-white px-6 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20" placeholder="Opcjonalnie" />
                    </div>
                    <div className="space-y-1 xl:col-span-2">
                      <label className="ml-1 text-fs-label font-bold uppercase tracking-[0.2em] text-gold">Dodatkowe instrukcje do przelewu</label>
                      <textarea value={settings.bank_transfer_instructions || ''} onChange={(event) => setSettings({ ...settings, bank_transfer_instructions: event.target.value })} className="min-h-32 w-full rounded-2xl border border-gold/10 bg-white px-6 py-4 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20 resize-y" placeholder="Np. poproś klientkę o przesłanie potwierdzenia przelewu albo dodaj dodatkowe instrukcje." />
                    </div>
                  </div>
                </SettingsGroup>

                <div className="sticky bottom-4 flex justify-end">
                  <button type="submit" className="inline-flex h-14 items-center justify-center rounded-2xl bg-gold px-8 text-fs-label font-bold uppercase tracking-widest text-white shadow-xl shadow-gold/20 transition-all hover:scale-[1.01]">
                    Zapisz wszystkie ustawienia
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </div>
      </div>

      {editingCourse ? (
        <Suspense fallback={<LazyPanelLoader />}>
          <CourseEditorModal productId={editingCourse.productId} productTitle={editingCourse.productTitle} onClose={() => setEditingCourse(null)} />
        </Suspense>
      ) : null}

      {productModalState.isOpen ? (
        <Suspense fallback={<LazyPanelLoader />}>
          <AdminProductEdit
            productId={productModalState.productId}
            embedded={true}
            onClose={() => setProductModalState({ isOpen: false, productId: 'new' })}
            onSaved={(message) => {
              setProductModalState({ isOpen: false, productId: 'new' });
              alert(message);
              fetchData();
            }}
          />
        </Suspense>
      ) : null}

      {userModalState.isOpen ? (
        <Suspense fallback={<LazyPanelLoader />}>
          <AdminUserModal
            initialUser={userModalState.user}
            products={products}
            currentUserId={user?.id}
            onClose={() => setUserModalState({ isOpen: false, user: null })}
            onSaved={(message) => {
              setUserModalState({ isOpen: false, user: null });
              alert(message);
              fetchData();
            }}
          />
        </Suspense>
      ) : null}

      {orderModalState.isOpen && orderModalState.order ? (
        <Suspense fallback={<LazyPanelLoader />}>
          <AdminOrderModal
            initialOrder={orderModalState.order}
            products={products}
            onClose={() => setOrderModalState({ isOpen: false, order: null })}
            onSaved={(message) => {
              setOrderModalState({ isOpen: false, order: null });
              alert(message);
              fetchData();
            }}
          />
        </Suspense>
      ) : null}

      {pageModalState.isOpen && pageModalState.page ? (
        <AdminPageSettingsModal
          page={pageModalState.page}
          onClose={() => setPageModalState({ isOpen: false, page: null })}
          onSaved={(message) => {
            setPageModalState({ isOpen: false, page: null });
            alert(message);
            fetchData();
          }}
        />
      ) : null}

      {couponModalState.isOpen ? (
        <AdminCouponModal
          initialCoupon={couponModalState.coupon}
          products={products}
          onClose={() => setCouponModalState({ isOpen: false, coupon: null })}
          onSaved={(message) => {
            setCouponModalState({ isOpen: false, coupon: null });
            alert(message);
            fetchData();
          }}
        />
      ) : null}
    </div>
  );
}