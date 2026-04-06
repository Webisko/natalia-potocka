const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v', '.ogv', '.ogg'];
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.aac', '.flac', '.oga', '.opus'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'];
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