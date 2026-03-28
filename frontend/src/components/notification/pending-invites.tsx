'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Check, X, MapPin, Calendar, Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import { Invite } from '@/types';
import styles from './pending-invites.module.css';
import { logger } from '@/lib/logger';

interface PendingInvitesProps {
  onInviteProcessed?: () => void;
}

export function PendingInvites({ onInviteProcessed }: PendingInvitesProps) {
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
        // Notify parent to refresh
        onInviteProcessed?.();
        // Show success and optionally navigate
        if (result.data.memberStatus === 'CONFIRMED') {
          // Auto-confirmed, go to trip
          router.push(`/trip/${invite.tripId}`);
        } else {
          // Pending approval, show a message
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
      // Notify parent to refresh
      onInviteProcessed?.();
    } catch (error: any) {
      alert(error.message || 'Failed to decline invite');
    }
    setProcessingId(null);
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading invitations...</span>
      </div>
    );
  }

  if (invites.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <Users size={20} />
        </div>
        <div>
          <h3 className={styles.title}>Trip Invitations</h3>
          <p className={styles.subtitle}>You have {invites.length} pending invitation{invites.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

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
                    <MapPin size={20} />
                  </div>
                )}
                <div>
                  <h4 className={styles.tripName}>{invite.trip?.name || 'Unknown Trip'}</h4>
                  <p className={styles.invitedBy}>
                    Invited by {invite.sentBy?.name || 'someone'}
                  </p>
                </div>
              </div>
            </div>

            {invite.trip?.description && (
              <p className={styles.tripDescription}>{invite.trip.description}</p>
            )}

            <div className={styles.cardFooter}>
              <div className={styles.tripMeta}>
                {invite.trip?.style === 'MANAGED' && (
                  <span className={styles.badge}>
                    <Calendar size={12} />
                    Requires approval
                  </span>
                )}
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
    </div>
  );
}
