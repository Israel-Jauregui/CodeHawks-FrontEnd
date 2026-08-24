import { useEffect } from 'react';
import { canonicalUrl, SITE_DESCRIPTION, SITE_IDENTITY } from '../constants/site';

interface PageMetadata {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}

function ensureMeta(selector: string, attributes: Record<string, string>): HTMLMetaElement {
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (existing) return existing;

  const element = document.createElement('meta');
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  document.head.append(element);
  return element;
}

function setMeta(selector: string, attributes: Record<string, string>, content: string) {
  ensureMeta(selector, attributes).setAttribute('content', content);
}

export function usePageMetadata({
  title = SITE_IDENTITY.publicName,
  description = SITE_DESCRIPTION,
  path = '/',
  noIndex = false,
}: PageMetadata) {
  useEffect(() => {
    const fullTitle = title === SITE_IDENTITY.publicName
      ? `${SITE_IDENTITY.publicName} at UNG`
      : `${title} | ${SITE_IDENTITY.publicName}`;
    const pageUrl = canonicalUrl(path);

    document.title = fullTitle;
    setMeta('meta[name="description"]', { name: 'description' }, description);
    setMeta('meta[property="og:title"]', { property: 'og:title' }, fullTitle);
    setMeta('meta[property="og:description"]', { property: 'og:description' }, description);
    setMeta('meta[property="og:type"]', { property: 'og:type' }, 'website');
    setMeta('meta[property="og:url"]', { property: 'og:url' }, pageUrl);
    setMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, SITE_IDENTITY.publicName);
    setMeta('meta[property="og:image"]', { property: 'og:image' }, canonicalUrl('/og-codehawks.png'));
    setMeta('meta[property="og:image:width"]', { property: 'og:image:width' }, '1200');
    setMeta('meta[property="og:image:height"]', { property: 'og:image:height' }, '630');
    setMeta('meta[property="og:image:alt"]', { property: 'og:image:alt' }, 'CodeHawks at the University of North Georgia');
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, fullTitle);
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description);
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, canonicalUrl('/og-codehawks.png'));
    setMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }, 'CodeHawks at the University of North Georgia');
    setMeta('meta[name="robots"]', { name: 'robots' }, noIndex ? 'noindex, nofollow' : 'index, follow');

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.append(canonical);
    }
    canonical.href = pageUrl;
  }, [description, noIndex, path, title]);
}
