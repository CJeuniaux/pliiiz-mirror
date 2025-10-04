// src/lib/share.ts

export const canonicalProfilePath = (slug: string) => {
  if (!slug) throw new Error('canonicalProfilePath: slug manquant');
  return `/p/${encodeURIComponent(slug)}`;
};

const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://pliiiz.app';
};

export const canonicalProfileUrl = (slug: string) =>
  `${getBaseUrl()}${canonicalProfilePath(slug)}`;
