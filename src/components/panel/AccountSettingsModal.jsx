import { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, LockKeyhole, Mail, Phone, Save, User } from 'lucide-react';
import { useAuth } from './AuthContext.jsx';
import AdminModalShell from './admin/AdminModalShell.jsx';
import PanelBlobButton from './PanelBlobButton.jsx';

function AccountNotice({ tone = 'default', children }) {
  const toneClass = tone === 'success'
    ? 'border-emerald-200 bg-emerald-50/90 text-emerald-800'
    : tone === 'warning'
      ? 'border-amber-200 bg-amber-50/95 text-amber-900'
      : tone === 'error'
        ? 'border-rose/20 bg-rose/10 text-mauve/80'
        : 'border-gold/15 bg-gold/10 text-mauve/75';

  return (
    <div className={`rounded-2xl border px-4 py-3 text-fs-body leading-relaxed ${toneClass}`}>
      {children}
    </div>
  );
}

export default function AccountSettingsModal({ onClose }) {
  const { user, refetch } = useAuth();
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [profileState, setProfileState] = useState({ saving: false, success: '', error: '' });
  const [emailForm, setEmailForm] = useState({ email: '' });
  const [emailState, setEmailState] = useState({ saving: false, success: '', error: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', password_confirm: '' });
  const [passwordState, setPasswordState] = useState({ saving: false, success: '', error: '' });

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfileForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
    });
  }, [user?.id, user?.first_name, user?.last_name, user?.phone]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileState({ saving: true, success: '', error: '' });

    try {
      const response = await axios.put('/api/auth/profile', profileForm);
      await refetch();
      setProfileState({
        saving: false,
        success: response.data?.message || 'Dane konta zostały zapisane.',
        error: '',
      });
    } catch (error) {
      setProfileState({
        saving: false,
        success: '',
        error: error?.response?.data?.error || 'Nie udało się zapisać danych konta.',
      });
    }
  };

  const handleEmailChangeSubmit = async (event) => {
    event.preventDefault();
    setEmailState({ saving: true, success: '', error: '' });

    try {
      const response = await axios.post('/api/auth/request-email-change', { email: emailForm.email });
      await refetch();
      setEmailForm({ email: '' });
      setEmailState({
        saving: false,
        success: response.data?.message || 'Wysłano link potwierdzający na nowy adres e-mail.',
        error: '',
      });
    } catch (error) {
      setEmailState({
        saving: false,
        success: '',
        error: error?.response?.data?.error || 'Nie udało się rozpocząć zmiany adresu e-mail.',
      });
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordState({ saving: true, success: '', error: '' });

    try {
      const response = await axios.post('/api/auth/change-password', passwordForm);
      setPasswordForm({ current_password: '', new_password: '', password_confirm: '' });
      setPasswordState({
        saving: false,
        success: response.data?.message || 'Hasło zostało zmienione.',
        error: '',
      });
    } catch (error) {
      setPasswordState({
        saving: false,
        success: '',
        error: error?.response?.data?.error || 'Nie udało się zmienić hasła.',
      });
    }
  };

  return (
    <AdminModalShell
      eyebrow="Moje konto"
      title="Ustawienia konta"
      description="Tutaj zmienisz podstawowe dane, adres e-mail i hasło do swojego konta."
      onClose={onClose}
      maxWidthClassName="max-w-5xl"
      bodyClassName="space-y-8"
    >
      <div className="space-y-8">
        <form onSubmit={handleProfileSubmit} className="rounded-[30px] border border-white/75 bg-white/65 p-6 shadow-[0_24px_50px_-40px_rgba(72,43,62,0.28)]">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/10 text-gold">
              <User size={18} />
            </div>
            <div>
              <h3 className="font-serif text-fs-title-sm text-mauve">Dane konta</h3>
              <p className="mt-1 text-fs-body text-mauve/55">Imię, nazwisko i opcjonalny telefon.</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Imię</span>
              <input
                value={profileForm.first_name}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, first_name: event.target.value }))}
                className="h-14 w-full rounded-2xl border border-gold/10 bg-white px-5 text-fs-body text-mauve outline-none transition focus:ring-2 focus:ring-gold/20"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Nazwisko</span>
              <input
                value={profileForm.last_name}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, last_name: event.target.value }))}
                className="h-14 w-full rounded-2xl border border-gold/10 bg-white px-5 text-fs-body text-mauve outline-none transition focus:ring-2 focus:ring-gold/20"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-2 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Telefon</span>
              <div className="relative">
                <Phone size={16} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-mauve/35" />
                <input
                  value={profileForm.phone}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                  className="h-14 w-full rounded-2xl border border-gold/10 bg-white pl-12 pr-5 text-fs-body text-mauve outline-none transition focus:ring-2 focus:ring-gold/20"
                  placeholder="Opcjonalnie"
                />
              </div>
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {profileState.error ? <AccountNotice tone="error">{profileState.error}</AccountNotice> : null}
            {profileState.success ? <AccountNotice tone="success">{profileState.success}</AccountNotice> : null}
            <div className="flex justify-center">
              <PanelBlobButton
                type="submit"
                disabled={profileState.saving}
                icon={profileState.saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                minWidthClassName="min-w-[11.5rem]"
              >
                Zapisz dane
              </PanelBlobButton>
            </div>
          </div>
        </form>

        <form onSubmit={handleEmailChangeSubmit} className="rounded-[30px] border border-white/75 bg-white/65 p-6 shadow-[0_24px_50px_-40px_rgba(72,43,62,0.28)]">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/10 text-gold">
              <Mail size={18} />
            </div>
            <div>
              <h3 className="font-serif text-fs-title-sm text-mauve">Adres e-mail</h3>
              <p className="mt-1 text-fs-body text-mauve/55">Zmiana zacznie działać po potwierdzeniu linku z wiadomości.</p>
            </div>
          </div>

          <div className="space-y-4">
            <AccountNotice>
              Aktualny adres konta: <strong>{user.email}</strong>
            </AccountNotice>

            {user.pending_email ? (
              <AccountNotice tone="warning">
                Oczekuje na potwierdzenie: <strong>{user.pending_email}</strong>
              </AccountNotice>
            ) : null}

            {emailState.error ? <AccountNotice tone="error">{emailState.error}</AccountNotice> : null}
            {emailState.success ? <AccountNotice tone="success">{emailState.success}</AccountNotice> : null}

            <label className="block">
              <span className="mb-2 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Nowy adres e-mail</span>
              <input
                type="email"
                value={emailForm.email}
                onChange={(event) => setEmailForm({ email: event.target.value })}
                className="h-14 w-full rounded-2xl border border-gold/10 bg-white px-5 text-fs-body text-mauve outline-none transition focus:ring-2 focus:ring-gold/20"
                placeholder="nowy-adres@przyklad.pl"
              />
            </label>

            <div className="flex justify-center pt-1">
              <PanelBlobButton
                tone="secondary"
                type="submit"
                disabled={emailState.saving}
                icon={emailState.saving ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                minWidthClassName="min-w-[16rem]"
              >
                Wyślij link potwierdzający
              </PanelBlobButton>
            </div>
          </div>
        </form>

        <form onSubmit={handlePasswordSubmit} className="rounded-[30px] border border-white/75 bg-white/65 p-6 shadow-[0_24px_50px_-40px_rgba(72,43,62,0.28)]">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/10 text-gold">
              <LockKeyhole size={18} />
            </div>
            <div>
              <h3 className="font-serif text-fs-title-sm text-mauve">Zmiana hasła</h3>
              <p className="mt-1 text-fs-body text-mauve/55">Minimum 12 znaków, mała i wielka litera, cyfra i znak specjalny.</p>
            </div>
          </div>

          <div className="grid gap-5">
            {passwordState.error ? <AccountNotice tone="error">{passwordState.error}</AccountNotice> : null}
            {passwordState.success ? <AccountNotice tone="success">{passwordState.success}</AccountNotice> : null}

            <label className="block">
              <span className="mb-2 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Aktualne hasło</span>
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, current_password: event.target.value }))}
                className="h-14 w-full rounded-2xl border border-gold/10 bg-white px-5 text-fs-body text-mauve outline-none transition focus:ring-2 focus:ring-gold/20"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Nowe hasło</span>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, new_password: event.target.value }))}
                className="h-14 w-full rounded-2xl border border-gold/10 bg-white px-5 text-fs-body text-mauve outline-none transition focus:ring-2 focus:ring-gold/20"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Powtórz nowe hasło</span>
              <input
                type="password"
                value={passwordForm.password_confirm}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, password_confirm: event.target.value }))}
                className="h-14 w-full rounded-2xl border border-gold/10 bg-white px-5 text-fs-body text-mauve outline-none transition focus:ring-2 focus:ring-gold/20"
              />
            </label>

            <div className="flex justify-center pt-1">
              <PanelBlobButton
                type="submit"
                disabled={passwordState.saving}
                icon={passwordState.saving ? <Loader2 size={16} className="animate-spin" /> : <LockKeyhole size={16} />}
                minWidthClassName="min-w-[11.5rem]"
              >
                Zmień hasło
              </PanelBlobButton>
            </div>
          </div>
        </form>
      </div>
    </AdminModalShell>
  );
}