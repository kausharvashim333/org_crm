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
  return {
    ...s,
    orgName: (s.orgName && typeof s.orgName === 'string' && s.orgName.trim() !== '') ? s.orgName : 'Lili Organization',
    logo: (s.logo && typeof s.logo === 'string' && s.logo.trim() !== '') ? s.logo : '/uploads/logo-1783236511925-286536357.jpeg',
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

  if (settings.favicon) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = settings.favicon;
  }
}

export function refreshOrgSettings() {
  cachedSettings = null;
  return getOrgHomepagePublic().then(res => {
    const s = res.data.homepage?.settings || {};
    cachedSettings = s;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) {}
    applySettings(s);
    listeners.forEach(fn => fn(s));
    return s;
  });
}

