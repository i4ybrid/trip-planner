'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bell, Mail, Smartphone, Clock, Save, ArrowLeft } from 'lucide-react';
import { api } from '@/services/api';
import { Settings } from '@/types';
import styles from './notifications-settings.module.css';

export default function NotificationSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      loadSettings();
    }
  }, [status]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const result = await api.getSettings();
      if (result.data) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    try {
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
    setIsSaving(false);
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Loading settings...</span>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className={styles.error}>
        <p>Failed to load notification settings.</p>
        <button onClick={loadSettings}>Try Again</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => router.push('/settings')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>Notification Settings</h1>
          <p>Choose how you want to be notified</p>
        </div>
      </header>

      <main className={styles.content}>
        {/* Channel Preferences */}
        <section className={styles.section}>
          <h2>
            <Bell size={18} />
            Notification Channels
          </h2>
          
          <div className={styles.card}>
            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>In-App Notifications</span>
                <span className={styles.toggleDesc}>Show notifications in the app</span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.inAppAll ?? true}
                  onChange={(e) => updateSetting('inAppAll', e.target.checked)}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
          </div>
        </section>

        {/* Email Notifications */}
        <section className={styles.section}>
          <h2>
            <Mail size={18} />
            Email Notifications
          </h2>
          
          <div className={styles.card}>
            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>Trip Invites</span>
                <span className={styles.toggleDesc}>When someone invites you to a trip</span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.emailTripInvites ?? true}
                  onChange={(e) => updateSetting('emailTripInvites', e.target.checked)}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.divider} />

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>Payment Requests</span>
                <span className={styles.toggleDesc}>When someone requests payment from you</span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.emailPaymentRequests ?? true}
                  onChange={(e) => updateSetting('emailPaymentRequests', e.target.checked)}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.divider} />

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>Voting Reminders</span>
                <span className={styles.toggleDesc}>When a vote is ending soon</span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.emailVotingReminders ?? true}
                  onChange={(e) => updateSetting('emailVotingReminders', e.target.checked)}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.divider} />

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>Trip Reminders</span>
                <span className={styles.toggleDesc}>Reminders before your trip starts</span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.emailTripReminders ?? true}
                  onChange={(e) => updateSetting('emailTripReminders', e.target.checked)}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.divider} />

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>Friend Requests</span>
                <span className={styles.toggleDesc}>When someone sends you a friend request</span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.emailFriendRequests ?? true}
                  onChange={(e) => updateSetting('emailFriendRequests', e.target.checked)}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
          </div>
        </section>

        {/* Push Notifications */}
        <section className={styles.section}>
          <h2>
            <Smartphone size={18} />
            Push Notifications
          </h2>
          
          <div className={styles.card}>
            <div className={styles.pushInfo}>
              <p>Push notifications are configured in your browser settings.</p>
              <button className={styles.secondaryButton}>
                Configure Browser Notifications
              </button>
            </div>

            <div className={styles.divider} />

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>Trip Updates</span>
                <span className={styles.toggleDesc}>Real-time trip notifications</span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.pushTripInvites ?? true}
                  onChange={(e) => updateSetting('pushTripInvites', e.target.checked)}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.divider} />

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>Payments</span>
                <span className={styles.toggleDesc}>Payment-related notifications</span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.pushPaymentRequests ?? true}
                  onChange={(e) => updateSetting('pushPaymentRequests', e.target.checked)}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.divider} />

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>Messages</span>
                <span className={styles.toggleDesc}>Chat and direct messages</span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.pushMessages ?? true}
                  onChange={(e) => updateSetting('pushMessages', e.target.checked)}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
          </div>
        </section>

        {/* Quiet Hours */}
        <section className={styles.section}>
          <h2>
            <Clock size={18} />
            Quiet Hours
          </h2>
          
          <div className={styles.card}>
            <p className={styles.quietHoursDesc}>
              Set a time range when you don&apos;t want to receive notifications.
            </p>
            
            <div className={styles.timeRange}>
              <div className={styles.timeInput}>
                <label>Start</label>
                <input
                  type="time"
                  value={settings.quietHoursStart || '22:00'}
                  onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                />
              </div>
              <span className={styles.timeSeparator}>to</span>
              <div className={styles.timeInput}>
                <label>End</label>
                <input
                  type="time"
                  value={settings.quietHoursEnd || '08:00'}
                  onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        <div className={styles.actions}>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className={styles.buttonSpinner} />
                Saving...
              </>
            ) : saved ? (
              <>
                <Save size={16} />
                Saved!
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
