import { SITE_URL } from '../../shared/siteConfig.js';
import { getPagePath, getPageSettingsMap, getServiceLandingPageSettingsBySlug } from './pageSettings.js';
import { getPublishedProducts } from './products.js';
import { getServiceOffers } from './serviceContent.js';
import { toAbsoluteUrl } from './structuredData.js';

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function getSitemapEntries() {
  const pageEntries = Object.values(getPageSettingsMap())
    .filter((page) => page && page.page_key !== 'offer' && !page.noindex)
    .map((page) => ({
      loc: getPagePath(page),
      lastmod: null,
    }));

  const productEntries = getPublishedProducts()
    .filter((product) => product.slug && !product.noindex)
    .map((product) => ({
      loc: `/oferta/${product.slug}`,
      lastmod: product.updated_at || null,
    }));

  const serviceEntries = getServiceOffers()
    .map((service) => ({
      service,
      settings: getServiceLandingPageSettingsBySlug(service.slug),
    }))
    .filter(({ service, settings }) => service.slug && !(settings?.noindex ?? service.noindex))
    .map(({ service, settings }) => ({
      loc: settings?.slug ? `/${settings.slug}` : `/oferta/${service.slug}`,
      lastmod: null,
    }));

  return [...pageEntries, ...serviceEntries, ...productEntries];
}

export function buildSitemapXml() {
  const entries = getSitemapEntries();
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((entry) => {
      const parts = [
        '  <url>',
        `    <loc>${escapeXml(toAbsoluteUrl(entry.loc))}</loc>`,
      ];

      if (entry.lastmod) {
        const lastmod = new Date(entry.lastmod);
        if (!Number.isNaN(lastmod.getTime())) {
          parts.push(`    <lastmod>${lastmod.toISOString()}</lastmod>`);
        }
      }

      parts.push('  </url>');
      return parts.join('\n');
    }),
    '</urlset>',
  ];

  return lines.join('\n');
}

export function buildRobotsTxt() {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /administrator',
    'Disallow: /panel',
    'Disallow: /logowanie',
    'Disallow: /zapomnialam-hasla',
    'Disallow: /resetowanie-hasla',
    '',
    `Sitemap: ${new URL('/sitemap.xml', SITE_URL).toString()}`,
  ].join('\n');
}
