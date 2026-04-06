export const LOCAL_OPTIMIZED_IMAGE_WIDTHS = [288, 480, 960, 1440];

const LOCAL_OPTIMIZABLE_IMAGE_PATTERN = /^\/images\/(?!optimized\/)(.+)\.(png|jpe?g)$/i;

function normalizeLocalImageSrc(src) {
  if (typeof src !== 'string') {
    return null;
  }

  return src.split('?')[0].split('#')[0];
}

export function getOptimizedImageOutputBaseName(src) {
  const normalizedSrc = normalizeLocalImageSrc(src);
  const match = normalizedSrc?.match(LOCAL_OPTIMIZABLE_IMAGE_PATTERN);

  if (!match) {
    return null;
  }

  return match[1].replace(/\//g, '--');
}

export function getOptimizedImageVariants(src) {
  const baseName = getOptimizedImageOutputBaseName(src);

  if (!baseName) {
    return null;
  }

  return {
    srcSet: LOCAL_OPTIMIZED_IMAGE_WIDTHS.map((width) => `/images/optimized/${baseName}-${width}.webp ${width}w`).join(', '),
  };
}