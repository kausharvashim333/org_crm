import API from './axios';

const SW_PATH = '/sw-push.js';

export async function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function subscribeToPush() {
  if (!await isPushSupported()) return { success: false, error: 'Push not supported' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { success: false, error: 'Permission denied' };

  const reg = await navigator.serviceWorker.register(SW_PATH, { scope: '/' });
  await navigator.serviceWorker.ready;

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    const res = await API.get('/push/vapid-public-key');
    const publicKey = res.data.publicKey;
    const convertedKey = urlBase64ToUint8Array(publicKey);

    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    });
  }

  await API.post('/push/subscribe', { subscription });
  return { success: true, subscription };
}

export async function unsubscribeFromPush() {
  if (!await isPushSupported()) return { success: false };

  const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (reg) {
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await API.post('/push/unsubscribe', { endpoint: subscription.endpoint });
      await subscription.unsubscribe();
    }
  }
  return { success: true };
}

export async function sendPushNotification(userId, { title, body, url }) {
  return API.post('/push/send', { userId, title, body, url });
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
