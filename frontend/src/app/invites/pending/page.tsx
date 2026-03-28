'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Check, X, MapPin, Calendar, Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import { Invite } from '@/types';
import { Button } from '@/components';
import { LeftSidebar } from '@/components/left-sidebar';
import { AppHeader } from '@/components/app-header';
import styles from './page.module.css';
import { logger } from '@/lib/logger';

export default function PendingInvitesPage() {
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadPendingInvites();
  }, []);

  const loadPendingInvites = async () => {
    setIsLoading(true);
    try {
      const result = await api.getPendingInvites();
      if (result.data) {
        setInvites(result.data);
      }
    } catch (error) {
      logger.error('Failed to load pending invites:', error);
    }
    setIsLoading(false);
  };

  const handleAccept = async (invite: Invite) => {
    setProcessingId(invite.id);
    try {
      const result = await api.acceptInvite(invite.token);
      if (result.data) {
        // Remove from list
        setInvites(prev => prev.filter(i => i.id !== invite.id));
        // Show feedback and navigate
        if (result.data.memberStatus === 'CONFIRMED') {
          router.push(`/trip/${invite.tripId}`);
        } else {
          alert('Your request to join has been sent! Waiting for approval from the trip organizer.');
        }
      }
    } catch (error: any) {
      alert(error.message || 'Failed to accept invite');
    }
    setProcessingId(null);
  };

  const handleDecline = async (invite: Invite) => {
    setProcessingId(invite.id);
    try {
      await api.declineInvite(invite.token);
      // Remove from list
      setInvites(prev => prev.filter(i => i.id !== invite.id));
    } catch (error: any) {
      alert(error.message || 'Failed to decline invite');
    }
    setProcessingId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-theme-gradient">
        <LeftSidebar />
        <AppHeader />
        <main className="ml-sidebar p-6">
          <div className="mx-auto max-w-2xl">
            <div className={styles.loading}>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span>Loading invitations...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-gradient">
      <LeftSidebar />
      <AppHeader />

      <main className="ml-sidebar p-6">
        <div className="mx-auto max-w-2xl">
          <div className={styles.header}>
            <Link href="/dashboard" className={styles.backLink}>
              <ArrowLeft size={20} />
              Back to Dashboard
            </Link>
            <h1 className={styles.title}>
              <Users size={28} />
              Trip Invitations
            </h1>
            <p className={styles.subtitle}>
              You have {invites.length} pending invitation{invites.length !== 1 ? 's' : ''}
            </p>
          </div>

          {invites.length === 0 ? (
            <div className={styles.empty}>
              <Users size={60} strokeWidth={1} />
              <h2>No pending invitations</h2>
              <p>When someone invites you to a trip, it will appear here.</p>
              <Button onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <div className={styles.list}>
              {invites.map((invite) => (
                <div key={invite.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.tripInfo}>
                      {invite.trip?.coverImage ? (
                        <img
                          src={invite.trip.coverImage}
                          alt={invite.trip.name}
                          className={styles.tripImage}
                        />
                      ) : (
                        <div className={styles.tripImagePlaceholder}>
                          <MapPin size={24} />
                        </div>
                      )}
                      <div>
                        <h3 className={styles.tripName}>{invite.trip?.name || 'Unknown Trip'}</h3>
                        <p className={styles.invitedBy}>
                          Invited by {invite.sentBy?.name || 'someone'}
                        </p>
                      </div>
                    </div>
                    {invite.trip?.style === 'MANAGED' && (
                      <span className={styles.badge}>
                        <Calendar size={12} />
                        Requires approval
                      </span>
                    )}
                  </div>

                  {invite.trip?.description && (
                    <p className={styles.tripDescription}>{invite.trip.description}</p>
                  )}

                  <div className={styles.cardFooter}>
                    <div className={styles.expiresInfo}>
                      Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </div>
                    <div className={styles.actions}>
                      <button
                        className={styles.declineButton}
                        onClick={() => handleDecline(invite)}
                        disabled={processingId === invite.id}
                      >
                        {processingId === invite.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X size={16} />
                            Decline
                          </>
                        )}
                      </button>
                      <button
                        className={styles.acceptButton}
                        onClick={() => handleAccept(invite)}
                        disabled={processingId === invite.id}
                      >
                        {processingId === invite.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check size={16} />
                            Accept
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
