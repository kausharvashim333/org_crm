import { useState, useEffect } from 'react';
import { getOrgHomepagePublic } from '../api';

const STORAGE_KEY = 'org_settings_cache';

let cachedSettings = (() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
})();

let listeners = [];

export function normalize(s) {
  if (!s) return null;
  const isLogoBroken = !s.logo || (typeof s.logo === 'string' && s.logo.includes('logo-1783236511925'));
  const isFaviconBroken = !s.favicon || (typeof s.favicon === 'string' && s.favicon.includes('logo-1783236511925'));
  return {
    ...s,
    orgName: (s.orgName && typeof s.orgName === 'string' && s.orgName.trim() !== '') ? s.orgName : 'Lili Organization',
    logo: !isLogoBroken ? s.logo : '/logo.png',
    favicon: !isFaviconBroken ? s.favicon : '',
  };
}

export function getCachedSettings() {
  if (cachedSettings) return cachedSettings;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? normalize(JSON.parse(stored)) : null;
  } catch (e) {
    return null;
  }
}

export function applySettings(settings) {
  if (!settings) {
    settings = getCachedSettings();
  }
  if (!settings) return;

  const orgName = (settings.orgName && typeof settings.orgName === 'string' && settings.orgName.trim() !== '') ? settings.orgName : 'Lili Organization';
  if (!document.title || document.title === 'Franchise CRM - Computer & Vocational Institute Management') {
    if (settings.browserTitle && settings.browserTitle.trim()) {
      document.title = settings.browserTitle;
    } else if (orgName) {
      document.title = orgName;
    }
  }

  // Determine favicon URL: priority settings.favicon -> settings.logo -> '/logo.png'
  let fav = (settings.favicon && typeof settings.favicon === 'string' && settings.favicon.trim() && !settings.favicon.includes('logo-1783236511925'))
    ? settings.favicon.trim()
    : ((settings.logo && typeof settings.logo === 'string' && settings.logo.trim() && !settings.logo.includes('logo-1783236511925')) ? settings.logo.trim() : '/logo.png');

  if (!fav) fav = '/logo.png';
  if (!fav.startsWith('http://') && !fav.startsWith('https://') && !fav.startsWith('/')) {
    fav = '/' + fav;
  }

  const cleanUrl = fav.split('?')[0].toLowerCase();
  let mimeType = 'image/png';
  if (cleanUrl.endsWith('.ico')) mimeType = 'image/x-icon';
  else if (cleanUrl.endsWith('.png')) mimeType = 'image/png';
  else if (cleanUrl.endsWith('.svg')) mimeType = 'image/svg+xml';
  else if (cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg')) mimeType = 'image/jpeg';
  else if (cleanUrl.endsWith('.webp')) mimeType = 'image/webp';

  const rels = [
    { rel: 'icon', type: mimeType },
    { rel: 'shortcut icon', type: mimeType },
    { rel: 'apple-touch-icon' },
  ];

  rels.forEach(({ rel, type }) => {
    let link = document.querySelector(`link[rel="${rel}"]`);
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      document.head.appendChild(link);
    }
    if (type) link.type = type;
    link.href = fav;
  });
}

export function useOrgSettings() {
  const [settings, setSettings] = useState(normalize(cachedSettings));

  useEffect(() => {
    if (cachedSettings) {
      applySettings(normalize(cachedSettings));
    }

    let mounted = true;
    getOrgHomepagePublic()
      .then(res => {
        const s = normalize(res.data.homepage?.settings || {});
        cachedSettings = s;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
        } catch (e) {}
        if (mounted) {
          setSettings(s);
          applySettings(s);
        }
      })
      .catch(() => {});

    const listener = (s) => {
      const norm = normalize(s);
      if (mounted) setSettings(norm);
    };
    listeners.push(listener);

    return () => {
      mounted = false;
      listeners = listeners.filter(fn => fn !== listener);
    };
  }, []);

  return settings;
}

export function refreshOrgSettings() {
  cachedSettings = null;
  return getOrgHomepagePublic().then(res => {
    const s = normalize(res.data.homepage?.settings || {});
    cachedSettings = s;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) {}
    applySettings(s);
    listeners.forEach(fn => fn(s));
    return s;
  });
}

