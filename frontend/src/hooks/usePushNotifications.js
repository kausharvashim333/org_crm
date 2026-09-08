import { useEffect, useState } from 'react';
import { isPushSupported, subscribeToPush, unsubscribeFromPush, getNotificationPermission } from '../api/push';

export function usePushNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const isSupported = await isPushSupported();
      if (!isSupported) return;
      if (!mounted) return;
      setSupported(true);
      const perm = await getNotificationPermission();
      setPermission(perm);
      if (perm === 'granted') {
        try {
          const result = await subscribeToPush();
          if (result.success) setSubscribed(true);
        } catch (e) {
          console.error('Push subscribe error:', e);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const requestPermission = async () => {
    try {
      const result = await subscribeToPush();
      if (result.success) {
        setSubscribed(true);
        setPermission('granted');
      }
      return result;
    } catch (e) {
      console.error('Push subscribe error:', e);
      return { success: false, error: e?.message || 'Push subscription failed' };
    }
  };

  const unsubscribe = async () => {
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
    } catch (e) {
      console.error('Push unsubscribe error:', e);
    }
  };

  return { supported, permission, subscribed, requestPermission, unsubscribe };
}
