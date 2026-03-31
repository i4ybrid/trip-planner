'use client';

import { useState, useEffect, useCallback } from 'react';
import { VAPID_PUBLIC_KEY } from '@/lib/push';
import { logger } from '@/lib/logger';
import { getHeaders } from '@/services/api';

interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Register service worker and check subscription status on mount
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        setSwRegistration(reg);
        return checkSubscriptionStatus(reg);
      })
      .catch((err) => logger.error('SW registration failed:', err));
  }, []);

  async function checkSubscriptionStatus(reg: ServiceWorkerRegistration) {
    const sub = await reg.pushManager.getSubscription();
    setIsSubscribed(!!sub);
    if (Notification.permission !== 'default') {
      setPermission(Notification.permission);
    }
  }

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      logger.warn('Notifications not supported');
      return 'denied';
    }
    const perm = await Notification.requestPermission();
    setPermission(perm);
    return perm;
  }, []);

  const subscribe = useCallback(async () => {
    if (!swRegistration) {
      logger.error('Service worker not registered');
      return;
    }
    setIsLoading(true);
    try {
      const perm = await requestPermission();
      if (perm !== 'granted') {
        logger.warn('Notification permission not granted');
        setIsLoading(false);
        return;
      }

      const sub = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      const subJson = sub.toJSON() as PushSubscriptionJSON;
      const extraHeaders = await getHeaders();
      const authHeaders = typeof extraHeaders === 'object' && !Array.isArray(extraHeaders)
        ? extraHeaders as Record<string, string>
        : {};
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          subscription: {
            endpoint: subJson.endpoint,
            keys: {
              p256dh: subJson.keys.p256dh,
              auth: subJson.keys.auth,
            },
          },
        }),
      });
      if (!response.ok) {
        throw new Error(`Subscribe failed: ${response.statusText}`);
      }

      setIsSubscribed(true);
    } catch (err) {
      logger.error('Push subscription failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [swRegistration, requestPermission]);

  const unsubscribe = useCallback(async () => {
    if (!swRegistration) return;
    setIsLoading(true);
    try {
      const sub = await swRegistration.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
      }
      const extraHeaders = await getHeaders();
      const authHeaders = typeof extraHeaders === 'object' && !Array.isArray(extraHeaders)
        ? extraHeaders as Record<string, string>
        : {};
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/push/unsubscribe`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!response.ok) {
        throw new Error(`Unsubscribe failed: ${response.statusText}`);
      }
      setIsSubscribed(false);
    } catch (err) {
      logger.error('Push unsubscription failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [swRegistration]);

  return {
    permission,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}

// Helper: convert VAPID key from urlBase64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
