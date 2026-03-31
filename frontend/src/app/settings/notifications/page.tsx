'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is deprecated. Notification settings are now in /settings?tab=notifications.
// This page redirects to the main settings page.
export default function DeprecatedNotificationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings?tab=notifications');
  }, [router]);

  return null;
}
