import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { FileText, Film, Image, Link2, Upload, Volume2, X } from 'lucide-react';
import { getMediaKind, isDirectAudioUrl, isDirectVideoUrl, isEmbeddableVideoUrl, matchesAllowedMediaKinds } from '../utils/media';

function MediaPreview({ source, title }) {
  const mediaKind = getMediaKind(source);

  if (mediaKind === 'image') {
    return <img src={source} alt={title} className="h-full w-full object-cover" />;
  }

  if (mediaKind === 'audio' && isDirectAudioUrl(source)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 p-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-gold">
          <Volume2 size={28} />
        </div>
        <audio controls src={source} className="w-full max-w-md">
          Twoja przeglądarka nie obsługuje odtwarzacza audio.
        </audio>
      </div>
    );
  }

  if (mediaKind === 'video') {
    if (isDirectVideoUrl(source)) {
      return <video controls src={source} className="h-full w-full object-cover" />;
    }

    if (isEmbeddableVideoUrl(source)) {
      return <iframe src={source} className="h-full w-full" allowFullScreen title={title} />;
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-mauve/55">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-mauve/45 shadow-sm">
        {mediaKind === 'video' ? <Film size={24} /> : null}
        {mediaKind === 'document' ? <FileText size={24} /> : null}
        {mediaKind === 'other' ? <Link2 size={24} /> : null}
      </div>
      <p className="text-fs-ui leading-6">Podgląd tego typu pliku nie jest dostępny w formularzu.</p>
    </div>
  );
}

export default function AdminMediaPicker({
  label,
  value,
  onChange,
  helperText = '',
  allowedKinds = [],
  accept = '*/*',
  emptyStateText = 'Nie wybrano jeszcze pliku.',
  currentValueLabel = 'Aktualnie wybrany plik',
  removeLabel = 'Usuń plik',
  libraryDescription = 'Wybierz istniejący plik z biblioteki mediów albo dodaj nowy z komputera.',
  uploadButtonLabel = 'Wgraj z komputera',
  allowManualUrl = false,
  manualUrlLabel = 'Adres pliku lub embed URL',
  manualUrlPlaceholder = 'https://',
}) {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isLibraryOpen) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    axios.get('/api/admin/media')
      .then((response) => {
        if (!cancelled) {
          setMediaAssets(response.data || []);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          alert(error.response?.data?.error || 'Nie udało się pobrać biblioteki mediów.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isLibraryOpen]);

  useEffect(() => {
    if (value) {
      setIsLibraryOpen(false);
    }
  }, [value]);

  const filteredAssets = useMemo(
    () => mediaAssets.filter((asset) => matchesAllowedMediaKinds(asset, allowedKinds)),
    [allowedKinds, mediaAssets],
  );

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await axios.post('/api/admin/media/upload', formData);
      const uploadedMedia = response.data?.media;
      if (uploadedMedia?.public_url) {
        onChange(uploadedMedia.public_url);
        setMediaAssets((currentAssets) => [uploadedMedia, ...currentAssets]);
        setIsLibraryOpen(false);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Nie udało się wgrać pliku.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <div>
          <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">{label}</label>
          {helperText ? <p className="text-fs-ui leading-6 text-mauve/55">{helperText}</p> : null}
        </div>
        <input ref={fileInputRef} type="file" accept={accept} onChange={handleUpload} className="hidden" />
      </div>

      <div className="overflow-hidden rounded-[28px] border border-mauve/10 bg-white/80">
        {value ? (
          <div className="p-4">
            <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-nude/50">
              <MediaPreview source={value} title={currentValueLabel} />
            </div>
            <div className="mt-4 space-y-3">
              <p className="text-fs-ui font-medium text-mauve">{currentValueLabel}</p>
              {allowManualUrl ? (
                <div>
                  <label className="mb-1 block text-fs-ui text-mauve/55">{manualUrlLabel}</label>
                  <input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={manualUrlPlaceholder}
                    className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
                  />
                </div>
              ) : (
                <p className="break-all text-fs-ui leading-6 text-mauve/60">{value}</p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setIsLibraryOpen(true)}
                  className="inline-flex items-center justify-center rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/75 transition hover:border-gold/30 hover:text-mauve"
                >
                  Biblioteka mediów
                </button>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="inline-flex items-center justify-center rounded-2xl border border-rose/35 bg-rose px-4 py-3 text-fs-label font-bold uppercase tracking-[0.18em] text-white transition hover:bg-rose/90 hover:shadow-lg hover:shadow-rose/20"
                >
                  {removeLabel}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-mauve/15 bg-nude/45 p-6 text-center text-fs-body leading-6 text-mauve/50">
              {emptyStateText}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setIsLibraryOpen(true)}
                className="inline-flex items-center justify-center rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/75 transition hover:border-gold/30 hover:text-mauve"
              >
                Biblioteka mediów
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gold/20 bg-gold/5 px-4 py-3 text-fs-label font-bold uppercase tracking-[0.18em] text-gold transition hover:bg-gold/10 disabled:opacity-50"
              >
                <Upload size={16} /> {uploading ? 'Wgrywanie...' : uploadButtonLabel}
              </button>
            </div>

            {allowManualUrl ? (
              <div className="mt-4">
                <label className="mb-1 block text-fs-ui text-mauve/55">{manualUrlLabel}</label>
                <input
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  placeholder={manualUrlPlaceholder}
                  className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
                />
              </div>
            ) : null}
          </div>
        )}
      </div>

      {isLibraryOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-mauve/45 px-4 py-8 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsLibraryOpen(false)} />
          <div className="relative z-10 max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/70 bg-[#FCF9F7] shadow-2xl shadow-mauve/15">
            <div className="flex items-start justify-between border-b border-gold/10 px-6 py-5 md:px-8">
              <div>
                <p className="text-fs-label font-bold uppercase tracking-[0.24em] text-gold/80">Biblioteka</p>
                <h3 className="mt-2 font-serif text-fs-title-md text-mauve">Biblioteka mediów</h3>
                <p className="mt-2 text-fs-body leading-7 text-mauve/60">{libraryDescription}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-mauve/10 bg-white text-mauve/50 transition hover:border-mauve/20 hover:text-mauve"
                title="Zamknij bibliotekę mediów"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[calc(88vh-92px)] overflow-y-auto px-6 py-6 md:px-8 md:py-8">
              {loading ? (
                <div className="py-8 text-center text-fs-body text-mauve/50">Ładowanie biblioteki mediów...</div>
              ) : filteredAssets.length === 0 ? (
                <div className="py-8 text-center text-fs-body text-mauve/50">Brak pasujących plików w bibliotece mediów.</div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredAssets.map((asset) => {
                    const assetKind = getMediaKind(asset);

                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => {
                          onChange(asset.public_url);
                          setIsLibraryOpen(false);
                        }}
                        className={`overflow-hidden rounded-2xl border text-left transition ${value === asset.public_url ? 'border-gold shadow-lg shadow-gold/10' : 'border-mauve/10 hover:border-gold/30'}`}
                      >
                        <div className="aspect-[16/10] overflow-hidden bg-nude/50">
                          <MediaPreview source={asset.public_url} title={asset.alt_text || asset.original_name} />
                        </div>
                        <div className="space-y-1 p-3">
                          <div className="flex items-center gap-2 text-gold/80">
                            {assetKind === 'image' ? <Image size={14} /> : null}
                            {assetKind === 'video' ? <Film size={14} /> : null}
                            {assetKind === 'audio' ? <Volume2 size={14} /> : null}
                            {assetKind === 'document' ? <FileText size={14} /> : null}
                            <span className="text-fs-label font-bold uppercase tracking-[0.14em]">{assetKind === 'image' ? 'Obraz' : assetKind === 'video' ? 'Wideo' : assetKind === 'audio' ? 'Audio' : assetKind === 'document' ? 'Dokument' : 'Plik'}</span>
                          </div>
                          <p className="truncate text-fs-ui font-medium text-mauve">{asset.original_name}</p>
                          <p className="truncate text-fs-ui text-mauve/50">{asset.public_url}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}