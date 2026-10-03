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

function normalize(s) {
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

function applySettings(settings) {
  if (!settings) return;

  const orgName = (settings.orgName && typeof settings.orgName === 'string' && settings.orgName.trim() !== '') ? settings.orgName : 'Lili Organization';
  if (settings.browserTitle && settings.browserTitle.trim()) {
    document.title = settings.browserTitle;
  } else if (orgName) {
    document.title = orgName;
  }

  // Determine favicon URL: priority settings.favicon -> settings.logo -> '/logo.png'
  let fav = (settings.favicon && typeof settings.favicon === 'string' && settings.favicon.trim() && !settings.favicon.includes('logo-1783236511925'))
    ? settings.favicon.trim()
    : ((settings.logo && typeof settings.logo === 'string' && settings.logo.trim() && !settings.logo.includes('logo-1783236511925')) ? settings.logo.trim() : '/logo.png');

  if (fav) {
    if (!fav.startsWith('http://') && !fav.startsWith('https://') && !fav.startsWith('/')) {
      fav = '/' + fav;
    }
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    const cleanUrl = fav.split('?')[0].toLowerCase();
    if (cleanUrl.endsWith('.ico')) link.type = 'image/x-icon';
    else if (cleanUrl.endsWith('.png')) link.type = 'image/png';
    else if (cleanUrl.endsWith('.svg')) link.type = 'image/svg+xml';
    else if (cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg')) link.type = 'image/jpeg';
    else if (cleanUrl.endsWith('.webp')) link.type = 'image/webp';
    link.href = fav;
  }
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

