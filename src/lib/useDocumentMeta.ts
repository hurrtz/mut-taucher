import { useEffect } from 'react';

const BASE_URL = 'https://mut-taucher.de';

interface MetaOptions {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
}

function setMeta(name: string, content: string, attribute = 'name') {
  let el = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useDocumentMeta(titleOrOptions: string | MetaOptions, description?: string) {
  const opts: MetaOptions = typeof titleOrOptions === 'string'
    ? { title: titleOrOptions, description }
    : titleOrOptions;

  useEffect(() => {
    document.title = opts.title;

    if (opts.description) {
      setMeta('description', opts.description);
    }

    // Open Graph
    setMeta('og:title', opts.title, 'property');
    if (opts.description) setMeta('og:description', opts.description, 'property');
    setMeta('og:type', opts.ogType || 'website', 'property');
    setMeta('og:locale', 'de_DE', 'property');
    if (opts.canonical) {
      setMeta('og:url', opts.canonical, 'property');
    }
    if (opts.ogImage) {
      setMeta('og:image', opts.ogImage, 'property');
    }

    // Twitter Card
    setMeta('twitter:card', opts.ogImage ? 'summary_large_image' : 'summary');
    setMeta('twitter:title', opts.title);
    if (opts.description) setMeta('twitter:description', opts.description);
    if (opts.ogImage) setMeta('twitter:image', opts.ogImage);

    // Canonical
    if (opts.canonical) {
      setLink('canonical', opts.canonical);
    }
  }, [opts.title, opts.description, opts.canonical, opts.ogImage, opts.ogType]);
}

export { BASE_URL };
export type { MetaOptions };
