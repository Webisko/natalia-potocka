import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { FileText, Film, Image, PlusCircle, Trash2, Volume2 } from 'lucide-react';
import { buildMediaAssetGroups, getImageVariantWidth, getMediaKind, isDirectAudioUrl, isDirectVideoUrl, isEmbeddableVideoUrl } from '../utils/media';
import AdminListCard from './AdminListCard';
import AdminModalShell from './AdminModalShell';

const FILTER_KINDS = ['image', 'video', 'audio', 'document'];

function formatBytes(value) {
  const size = Number(value || 0);
  if (!Number.isFinite(size) || size <= 0) {
    return null;
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function MediaCardPreview({ asset }) {
  const mediaKind = getMediaKind(asset);

  if (mediaKind === 'image') {
    return <img src={asset.public_url} alt={asset.alt_text || asset.original_name} className="h-full w-full object-cover" />;
  }

  if (mediaKind === 'audio' && isDirectAudioUrl(asset.public_url)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold"><Volume2 size={24} /></div>
        <audio controls src={asset.public_url} className="w-full" />
      </div>
    );
  }

  if (mediaKind === 'video') {
    if (isDirectVideoUrl(asset.public_url)) {
      return <video controls src={asset.public_url} className="h-full w-full object-cover" />;
    }

    if (isEmbeddableVideoUrl(asset.public_url)) {
      return <iframe src={asset.public_url} className="h-full w-full" allowFullScreen title={asset.original_name} />;
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-mauve/55">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-mauve/45 shadow-sm">
        {mediaKind === 'video' ? <Film size={24} /> : null}
        {mediaKind === 'document' ? <FileText size={24} /> : null}
        {mediaKind === 'image' ? <Image size={24} /> : null}
      </div>
      <p className="text-fs-ui leading-6">Podgląd tego pliku nie jest dostępny.</p>
    </div>
  );
}

function getKindLabel(kind) {
  if (kind === 'image') return 'Obraz';
  if (kind === 'video') return 'Wideo';
  if (kind === 'audio') return 'Audio';
  if (kind === 'document') return 'Dokument';
  return 'Plik';
}

function MediaDetailsModal({ group, submitting, deletingGroup, onClose, onDelete, onDeleteGroup, onSave, details, setDetails }) {
  if (!group) {
    return null;
  }

  return (
    <AdminModalShell
      eyebrow="Szczegóły medium"
      title={group.title}
      description="Tutaj zarządzasz metadanymi SEO i sprawdzasz wszystkie wygenerowane wersje wybranego pliku."
      onClose={onClose}
      maxWidthClassName="max-w-5xl"
      footer={(
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onDeleteGroup}
            disabled={submitting || deletingGroup}
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-rose/20 bg-rose/5 px-6 text-fs-label font-bold uppercase tracking-[0.2em] text-rose transition hover:bg-rose hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deletingGroup ? 'Usuwanie...' : 'Usuń całe medium'}
          </button>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting || deletingGroup}
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-mauve/15 bg-white px-6 text-fs-label font-bold uppercase tracking-[0.2em] text-mauve/60 transition hover:border-mauve/25 hover:text-mauve"
          >
            Zamknij
          </button>
          <button
            type="submit"
            form="media-details-form"
            disabled={submitting || deletingGroup}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-gold px-6 text-fs-label font-bold uppercase tracking-[0.2em] text-white transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Zapisywanie...' : 'Zapisz szczegóły'}
          </button>
          </div>
        </div>
      )}
    >
      <form
        id="media-details-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
        className="space-y-8"
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-stretch">
          <div className="h-full">
            <div className="relative min-h-[320px] overflow-hidden rounded-[28px] bg-nude/50 lg:h-full lg:min-h-0">
              <div className="overflow-hidden lg:absolute lg:inset-0">
                <MediaCardPreview asset={group.previewAsset} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-mauve/10 bg-white/90 p-5">
              <p className="text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/45">Szczegóły SEO</p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Tytuł</label>
                  <input
                    value={details.title}
                    onChange={(event) => setDetails((current) => ({ ...current, title: event.target.value }))}
                    className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Alt / podpis SEO</label>
                  <input
                    value={details.alt_text}
                    onChange={(event) => setDetails((current) => ({ ...current, alt_text: event.target.value }))}
                    className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-mauve/10 bg-white/90 p-5">
              <p className="text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/45">Podstawowe dane</p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-mauve/40">Typ</p>
                  <p className="mt-1 text-fs-body text-mauve/75">{getKindLabel(group.kind)}</p>
                </div>
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-mauve/40">Liczba wersji</p>
                  <p className="mt-1 text-fs-body text-mauve/75">{group.assets.length}</p>
                </div>
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-mauve/40">Główny adres pliku</p>
                  <p className="mt-1 break-all text-fs-ui leading-6 text-mauve/55">{group.primaryAsset.public_url}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-mauve/10 bg-white/90 p-5">
          <p className="text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/45">Wersje i rozmiary</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {group.assets.map((assetItem) => {
              const variantWidth = getImageVariantWidth(assetItem);
              const fileSize = formatBytes(assetItem.size_bytes);
              const label = group.kind === 'image'
                ? variantWidth > 0
                  ? `${variantWidth}px`
                  : 'Oryginał'
                : getKindLabel(group.kind);

              return (
                <div key={assetItem.id} className="rounded-[20px] border border-mauve/10 bg-nude/30 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-fs-ui font-semibold text-mauve">{label}</p>
                      <p className="mt-1 break-all text-[13px] leading-5 text-mauve/55">{assetItem.public_url}</p>
                      {fileSize ? <p className="mt-2 text-[12px] uppercase tracking-[0.14em] text-mauve/40">Waga pliku: {fileSize}</p> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDelete(assetItem)}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-rose/20 bg-rose/5 text-rose transition hover:bg-rose hover:text-white"
                      title="Usuń plik"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </form>
    </AdminModalShell>
  );
}

export default function AdminMediaLibraryTab({ onContentChanged }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [openGroupId, setOpenGroupId] = useState(null);
  const [detailsDraft, setDetailsDraft] = useState({ title: '', alt_text: '' });
  const [savingDetails, setSavingDetails] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const fileInputRef = useRef(null);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/media');
      setAssets(response.data || []);
    } catch (error) {
      alert(error.response?.data?.error || 'Nie udało się pobrać biblioteki mediów.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const assetGroups = useMemo(() => buildMediaAssetGroups(assets), [assets]);

  const groupedCounts = useMemo(() => {
    return assetGroups.reduce((accumulator, group) => {
      accumulator[group.kind] = (accumulator[group.kind] || 0) + 1;
      return accumulator;
    }, {});
  }, [assetGroups]);

  const filteredGroups = useMemo(() => {
    if (activeFilter === 'all') {
      return assetGroups;
    }

    return assetGroups.filter((group) => group.kind === activeFilter);
  }, [activeFilter, assetGroups]);

  const openGroup = useMemo(() => {
    if (!openGroupId) {
      return null;
    }

    return assetGroups.find((group) => group.id === openGroupId) || null;
  }, [assetGroups, openGroupId]);

  useEffect(() => {
    if (openGroupId && !assetGroups.some((group) => group.id === openGroupId)) {
      setOpenGroupId(null);
    }
  }, [assetGroups, openGroupId]);

  useEffect(() => {
    setDetailsDraft({
      title: openGroup?.primaryAsset?.title || '',
      alt_text: openGroup?.primaryAsset?.alt_text || '',
    });
  }, [openGroup]);

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
      if (uploadedMedia) {
        setAssets((currentAssets) => [uploadedMedia, ...currentAssets]);
        setActiveFilter('all');
        onContentChanged?.();
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Nie udało się wgrać pliku.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async (asset) => {
    if (!window.confirm(`Usunąć plik ${asset.original_name}?`)) {
      return;
    }

    try {
      await axios.delete(`/api/admin/media/${asset.id}`);
      setAssets((currentAssets) => currentAssets.filter((currentAsset) => currentAsset.id !== asset.id));
      onContentChanged?.();
    } catch (error) {
      alert(error.response?.data?.error || 'Nie udało się usunąć pliku.');
    }
  };

  const handleSaveDetails = async () => {
    if (!openGroup) {
      return;
    }

    setSavingDetails(true);

    try {
      const relatedIds = openGroup.assets.map((asset) => asset.id);
      await axios.put(`/api/admin/media/${openGroup.primaryAsset.id}`, {
        title: detailsDraft.title,
        alt_text: detailsDraft.alt_text,
        related_ids: relatedIds,
      });

      setAssets((currentAssets) => currentAssets.map((asset) => {
        if (!relatedIds.includes(asset.id)) {
          return asset;
        }

        return {
          ...asset,
          title: detailsDraft.title || null,
          alt_text: detailsDraft.alt_text || null,
        };
      }));
      setOpenGroupId(null);
      onContentChanged?.();
    } catch (error) {
      alert(error.response?.data?.error || 'Nie udało się zapisać szczegółów medium.');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!openGroup) {
      return;
    }

    if (!window.confirm(`Usunąć całe medium ${openGroup.title} wraz ze wszystkimi jego wersjami?`)) {
      return;
    }

    setDeletingGroup(true);

    try {
      const relatedIds = openGroup.assets.map((asset) => asset.id);
      await axios.delete(`/api/admin/media/${openGroup.primaryAsset.id}`, {
        data: {
          related_ids: relatedIds,
        },
      });

      setAssets((currentAssets) => currentAssets.filter((asset) => !relatedIds.includes(asset.id)));
      setOpenGroupId(null);
      onContentChanged?.();
    } catch (error) {
      alert(error.response?.data?.error || 'Nie udało się usunąć całego medium.');
    } finally {
      setDeletingGroup(false);
    }
  };

  return (
    <AdminListCard
      title="Biblioteka mediów"
      count={assetGroups.length}
      description="W tym miejscu trzymasz obrazki, pliki audio, wideo i dokumenty wykorzystywane w produktach oraz innych sekcjach panelu."
      bodyClassName="px-8 pb-8"
      action={(
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gold px-6 py-3 text-fs-label font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.02] hover:bg-gold/90 hover:shadow-xl hover:shadow-gold/20 disabled:opacity-50"
          disabled={uploading}
        >
          <PlusCircle size={18} /> {uploading ? 'Wgrywanie...' : 'Dodaj plik'}
        </button>
      )}
    >
      <input ref={fileInputRef} type="file" accept="image/*,audio/*,video/*,.pdf" onChange={handleUpload} className="hidden" />

      <div className="mb-8 pt-8">
        <div className="grid gap-4 md:grid-cols-4">
        {FILTER_KINDS.map((kind) => {
          const isActive = activeFilter === kind;

          return (
          <button
            key={kind}
            type="button"
            onClick={() => setActiveFilter((currentFilter) => (currentFilter === kind ? 'all' : kind))}
            className={`rounded-[24px] border px-5 py-4 text-left transition ${isActive ? 'border-gold bg-gold/10 shadow-sm' : 'border-gold/10 bg-white hover:border-gold/30 hover:bg-gold/5'}`}
          >
            <p className="text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/45">{getKindLabel(kind)}</p>
            <p className="mt-2 font-serif text-fs-title-sm text-mauve">{groupedCounts[kind] || 0}</p>
          </button>
          );
        })}
        </div>
        {activeFilter !== 'all' ? (
          <p className="mt-3 text-fs-ui text-mauve/55">Aktywny filtr: {getKindLabel(activeFilter)}. Kliknij ponownie aktywny kafel, aby pokazać wszystkie media.</p>
        ) : null}
      </div>

      {loading ? (
        <div className="p-20 text-center text-fs-body text-mauve/50">Ładowanie biblioteki mediów...</div>
      ) : assetGroups.length === 0 ? (
        <div className="p-20 text-center text-fs-body text-mauve/50">Biblioteka mediów jest jeszcze pusta.</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredGroups.map((group) => {
            const kind = group.kind;
            const asset = group.previewAsset;

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setOpenGroupId(group.id)}
                className="overflow-hidden rounded-[28px] border border-mauve/10 bg-white/85 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gold/25 hover:shadow-md"
              >
                <div className="aspect-[16/10] overflow-hidden bg-nude/50">
                  <MediaCardPreview asset={asset} />
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-fs-label font-bold uppercase tracking-[0.16em] text-gold/80">{getKindLabel(kind)}</span>
                    {group.assets.length > 1 ? <span className="rounded-full bg-gold/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-gold">Wersje: {group.assets.length}</span> : null}
                  </div>
                  <p className="truncate font-serif text-fs-body-lg text-mauve">{group.title}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <MediaDetailsModal
        group={openGroup}
        submitting={savingDetails}
        deletingGroup={deletingGroup}
        onClose={() => setOpenGroupId(null)}
        onDelete={handleDelete}
        onDeleteGroup={handleDeleteGroup}
        onSave={handleSaveDetails}
        details={detailsDraft}
        setDetails={setDetailsDraft}
      />
    </AdminListCard>
  );
}