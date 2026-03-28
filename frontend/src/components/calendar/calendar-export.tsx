'use client';

import { useState } from 'react';
import { Calendar, Download, Globe, Mail } from 'lucide-react';
import styles from './calendar-export.module.css';
import { logger } from '@/lib/logger';

interface CalendarExportProps {
  tripId: string;
  tripName: string;
  variant?: 'button' | 'dropdown';
}

export function CalendarExport({ tripId, tripName, variant = 'dropdown' }: CalendarExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleExport = async (type: 'ics' | 'google' | 'outlook') => {
    setIsLoading(type);
    try {
      let url: string;
      let filename: string;
      
      switch (type) {
        case 'ics':
          url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/trips/${tripId}/calendar.ics`;
          filename = `${tripName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-calendar.ics`;
          
          // Download .ics file
          const icsResponse = await fetch(url, {
            headers: {
              Authorization: `Bearer ${await getAuthToken()}`,
            },
          });
          
          if (icsResponse.ok) {
            const blob = await icsResponse.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
          }
          break;
          
        case 'google':
          url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/trips/${tripId}/calendar/google`;
          const googleResponse = await fetch(url, {
            headers: {
              Authorization: `Bearer ${await getAuthToken()}`,
            },
          });
          
          if (googleResponse.ok) {
            const data = await googleResponse.json();
            if (data.data?.url) {
              window.open(data.data.url, '_blank');
            }
          }
          break;
          
        case 'outlook':
          url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/trips/${tripId}/calendar/outlook`;
          const outlookResponse = await fetch(url, {
            headers: {
              Authorization: `Bearer ${await getAuthToken()}`,
            },
          });
          
          if (outlookResponse.ok) {
            const data = await outlookResponse.json();
            if (data.data?.url) {
              window.open(data.data.url, '_blank');
            }
          }
          break;
      }
    } catch (error) {
      logger.error('Failed to export calendar:', error);
    } finally {
      setIsLoading(null);
      setIsOpen(false);
    }
  };

  async function getAuthToken(): Promise<string> {
    // Get token from localStorage or cookie
    const token = localStorage.getItem('next-auth.session-token') || 
                  localStorage.getItem('__Secure-next-auth.session-token') ||
                  '';
    return token;
  }

  if (variant === 'button') {
    return (
      <button
        className={styles.button}
        onClick={() => handleExport('ics')}
        disabled={isLoading === 'ics'}
      >
        <Calendar size={16} />
        <span>{isLoading === 'ics' ? 'Downloading...' : 'Export Calendar'}</span>
      </button>
    );
  }

  return (
    <div className={styles.container}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <Calendar size={16} />
        <span>Add to Calendar</span>
        <svg
          className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <Calendar size={14} />
            <span>Add to Calendar</span>
          </div>
          
          <button
            className={styles.option}
            onClick={() => handleExport('ics')}
            disabled={isLoading !== null}
          >
            <div className={styles.optionIcon}>
              <Download size={16} />
            </div>
            <div className={styles.optionContent}>
              <span className={styles.optionTitle}>Download iCal</span>
              <span className={styles.optionDesc}>For Apple Calendar, Outlook, other apps</span>
            </div>
          </button>

          <button
            className={styles.option}
            onClick={() => handleExport('google')}
            disabled={isLoading !== null}
          >
            <div className={styles.optionIcon} style={{ backgroundColor: '#4285f420', color: '#4285f4' }}>
              <Globe size={16} />
            </div>
            <div className={styles.optionContent}>
              <span className={styles.optionTitle}>Google Calendar</span>
              <span className={styles.optionDesc}>Open in Google Calendar</span>
            </div>
          </button>

          <button
            className={styles.option}
            onClick={() => handleExport('outlook')}
            disabled={isLoading !== null}
          >
            <div className={styles.optionIcon} style={{ backgroundColor: '#0078d420', color: '#0078d4' }}>
              <Mail size={16} />
            </div>
            <div className={styles.optionContent}>
              <span className={styles.optionTitle}>Outlook</span>
              <span className={styles.optionDesc}>Open in Microsoft Outlook</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
