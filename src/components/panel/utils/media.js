const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v', '.ogv', '.ogg'];
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.aac', '.flac', '.oga', '.opus'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif', '.ico'];
const DOCUMENT_EXTENSIONS = ['.pdf'];

function getLowercasePathname(value) {
  if (!value) {
    return '';
  }

  try {
    return new URL(value, 'http://localhost').pathname.toLowerCase();
  } catch {
    return `${value}`.split('?')[0].split('#')[0].toLowerCase();
  }
}

function hasMatchingExtension(value, extensions) {
  const pathname = getLowercasePathname(value);
  return extensions.some((extension) => pathname.endsWith(extension));
}

function stripExtension(value) {
  return `${value || ''}`.replace(/\.[^.]+$/u, '');
}

function getImageGroupKey(asset) {
  const pathname = getLowercasePathname(asset?.public_url || asset?.original_name);
  const fileName = pathname.split('/').pop() || `${asset?.original_name || asset?.id || 'image'}`.toLowerCase();
  const baseName = stripExtension(fileName);

  if (pathname.includes('/images/optimized/')) {
    return baseName.replace(/-\d+$/u, '');
  }

  return baseName;
}

export function getImageVariantWidth(asset) {
  const pathname = getLowercasePathname(asset?.public_url || asset?.original_name);
  const fileName = pathname.split('/').pop() || `${asset?.original_name || ''}`.toLowerCase();
  const match = stripExtension(fileName).match(/-(\d+)$/u);
  return match ? Number.parseInt(match[1], 10) : 0;
}

export function isDirectVideoUrl(value) {
  return hasMatchingExtension(value, VIDEO_EXTENSIONS);
}

export function isDirectAudioUrl(value) {
  return hasMatchingExtension(value, AUDIO_EXTENSIONS);
}

export function isEmbeddableVideoUrl(value) {
  const normalizedValue = `${value || ''}`.toLowerCase();
  return /(youtube\.com|youtu\.be|vimeo\.com|loom\.com|wistia\.)/.test(normalizedValue);
}

export function getMediaKind(source) {
  if (source && typeof source === 'object') {
    const mimeType = `${source.mime_type || ''}`.toLowerCase();

    if (mimeType.startsWith('image/')) {
      return 'image';
    }

    if (mimeType.startsWith('audio/')) {
      return 'audio';
    }

    if (mimeType.startsWith('video/')) {
      return 'video';
    }

    if (mimeType === 'application/pdf') {
      return 'document';
    }

    if (source.public_url) {
      return getMediaKind(source.public_url);
    }
  }

  const value = `${source || ''}`.trim();
  if (!value) {
    return 'other';
  }

  if (hasMatchingExtension(value, IMAGE_EXTENSIONS)) {
    return 'image';
  }

  if (isDirectAudioUrl(value)) {
    return 'audio';
  }

  if (isDirectVideoUrl(value) || isEmbeddableVideoUrl(value)) {
    return 'video';
  }

  if (hasMatchingExtension(value, DOCUMENT_EXTENSIONS)) {
    return 'document';
  }

  return 'other';
}

export function matchesAllowedMediaKinds(source, allowedKinds = []) {
  if (!Array.isArray(allowedKinds) || allowedKinds.length === 0) {
    return true;
  }

  return allowedKinds.includes(getMediaKind(source));
}

export function buildMediaAssetGroups(assets = []) {
  const groupedImages = new Map();
  const groups = [];

  assets.forEach((asset) => {
    const kind = getMediaKind(asset);

    if (kind !== 'image') {
      groups.push({
        id: `${kind}-${asset.id}`,
        kind,
        title: asset.title || asset.original_name,
        previewAsset: asset,
        primaryAsset: asset,
        assets: [asset],
      });
      return;
    }

    const key = getImageGroupKey(asset);
    const existingGroup = groupedImages.get(key);

    if (existingGroup) {
      existingGroup.assets.push(asset);
      return;
    }

    groupedImages.set(key, {
      id: `image-${key}`,
      kind,
      title: stripExtension(asset.original_name || key),
      assets: [asset],
    });
  });

  groupedImages.forEach((group) => {
    const sortedAssets = [...group.assets].sort((left, right) => {
      const leftPath = getLowercasePathname(left.public_url);
      const rightPath = getLowercasePathname(right.public_url);
      const leftIsOriginal = !leftPath.includes('/images/optimized/');
      const rightIsOriginal = !rightPath.includes('/images/optimized/');

      if (leftIsOriginal !== rightIsOriginal) {
        return leftIsOriginal ? -1 : 1;
      }

      return getImageVariantWidth(right) - getImageVariantWidth(left);
    });

    const primaryAsset = sortedAssets[0];

    groups.push({
      ...group,
      title: primaryAsset?.title || stripExtension(primaryAsset?.original_name || group.title),
      previewAsset: primaryAsset,
      primaryAsset,
      assets: sortedAssets,
    });
  });

  return groups.sort((left, right) => left.title.localeCompare(right.title, 'pl', { sensitivity: 'base' }));
}