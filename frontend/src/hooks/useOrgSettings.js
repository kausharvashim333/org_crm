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

export function useOrgSettings() {
  const [settings, setSettings] = useState(cachedSettings);

  useEffect(() => {
    if (cachedSettings) {
      applySettings(cachedSettings);
    }

    let mounted = true;
    getOrgHomepagePublic()
      .then(res => {
        const s = res.data.homepage?.settings || {};
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
      if (mounted) setSettings(s);
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

  if (settings.browserTitle) {
    document.title = settings.browserTitle;
  } else if (settings.orgName) {
    document.title = settings.orgName;
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

