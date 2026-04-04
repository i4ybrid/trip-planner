'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTripStore } from '@/store';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Avatar, Modal } from '@/components';
import { InviteModal } from '@/components/trip/invite-modal';
import { TripSettingsModal } from '@/components/trip/settings-modal';
import { HoverDropdown } from '@/components/hover-dropdown';
import { formatDateRange, formatCurrency, cn, getNextStatus, getNextStatusLabel, canMoveToHappening } from '@/lib/utils';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';
import { MapPin, Calendar, Users, DollarSign, Share2, Settings, MoreVertical, MoreHorizontal, Shield, Trash2, Check } from 'lucide-react';
import { api } from '@/services/api';
import { TripMember, User, Activity, BillSplit, MemberRole, TripStyle, TripStatus } from '@/types';
import { useAuth } from '@/hooks/use-auth';

export default function TripOverview() {
  const params = useParams();
  const tripId = params.id as string;

  const { currentTrip, isLoading, fetchTrip, changeStatus } = useTripStore();
  const { user } = useAuth();
  const [members, setMembers] = useState<TripMember[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [billSplits, setBillSplits] = useState<BillSplit[]>([]);
  const [stats, setStats] = useState({ total: 0, collected: 0 });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Track if data has been loaded to prevent redundant fetches
  const hasLoadedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentUserMember = members.find(m => m.userId === user?.id);
  const canInvite = !!(currentUserMember && (
    currentUserMember.role === 'MASTER' ||
    (currentTrip?.style === 'OPEN' && ['ORGANIZER', 'MEMBER'].includes(currentUserMember.role))
  ));
  const isMaster = currentUserMember?.role === 'MASTER';

  const nextStatus = currentTrip ? getNextStatus(currentTrip.status) : null;
  const isTerminal = currentTrip ? (currentTrip.status === 'COMPLETED' || currentTrip.status === 'CANCELLED') : false;
  const within24Hours = currentTrip ? canMoveToHappening(currentTrip.startDate) : false;

  const getAdvanceButtonLabel = (): string => {
    if (!currentTrip) return '';
    if (currentTrip.status === 'CONFIRMED' && !within24Hours) {
      return 'Mark as Happening';
    }
    if (currentTrip.status === 'CONFIRMED' && within24Hours) {
      return 'Happening';
    }
    return getNextStatusLabel(currentTrip.status);
  };

  const handleAdvanceStatus = () => {
    if (nextStatus === 'CANCELLED') {
      setShowCancelDialog(true);
    } else if (nextStatus) {
      changeStatus(tripId, nextStatus as TripStatus);
    }
  };

  const handleConfirmCancel = () => {
    changeStatus(tripId, 'CANCELLED' as TripStatus);
    setShowCancelDialog(false);
  };

  const loadTripData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      await Promise.all([
        fetchTrip(tripId),
        api.getTripMembers(tripId).then(result => {
          if (result.data) setMembers(result.data);
        }),
        api.getActivities(tripId).then(result => {
          if (result.data) setActivities(result.data);
        }),
        api.getBillSplits(tripId).then(result => {
          if (result.data) {
            setBillSplits(result.data);
            const total = result.data.reduce((sum, b) => sum + Number(b.amount), 0);
            const collected = result.data.reduce((sum, b) => {
              const paidMembers = b.members?.filter(m => m.status === 'CONFIRMED') || [];
              return sum + paidMembers.reduce((memberSum, m) => memberSum + Number(m.dollarAmount), 0);
            }, 0);
            setStats({ total, collected });
          }
        }),
      ]);

      hasLoadedRef.current = true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        logger.error('Failed to load trip data:', error);
      }
    }
  }, [tripId, fetchTrip]);

  useEffect(() => {
    if (tripId && !hasLoadedRef.current) {
      loadTripData();
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [tripId, loadTripData]);

  const handleMemberAdded = useCallback(() => {
    // With caching, this will be fast if recently loaded
    api.getTripMembers(tripId).then(result => {
      if (result.data) setMembers(result.data);
    });
  }, [tripId]);

  const handleTripUpdated = useCallback(() => {
    fetchTrip(tripId);
  }, [tripId, fetchTrip]);

  const handlePromoteToOrganizer = async (userId: string) => {
    await api.updateTripMember(tripId, userId, { role: 'ORGANIZER' });
    handleMemberAdded();
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member from the trip?')) return;
    await api.removeTripMember(tripId, userId);
    handleMemberAdded();
  };

  const renderMemberActions = (member: TripMember) => {
    if (!isMaster || member.role === 'MASTER') return null;

    return (
      <HoverDropdown
        mode="click"
        align="right"
        trigger={
          <button className="rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        }
        items={[
          {
            label: member.role !== 'ORGANIZER' ? 'Make Organizer' : 'Remove Organizer',
            onClick: () => handlePromoteToOrganizer(member.userId),
            icon: <Shield className="h-4 w-4" />,
          },
          {
            label: 'Remove from Trip',
            onClick: () => handleRemoveMember(member.userId),
            icon: <Trash2 className="h-4 w-4" />,
            className: 'text-red-600 hover:text-red-700',
          },
        ]}
      />
    );
  };

  if (isLoading || !currentTrip) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{currentTrip.name}</h2>
          {currentTrip.destination && (
            <p className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {currentTrip.destination}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {canInvite && (
            <Button variant="outline" onClick={() => setShowInviteModal(true)}>
              <Share2 className="mr-2 h-4 w-4" />
              Invite
            </Button>
          )}
          {isMaster && (
            <Button variant="outline" onClick={() => setShowSettingsModal(true)} data-testid="settings-btn" aria-label="Trip Settings">
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        tripId={tripId}
        tripStyle={currentTrip.style}
        onMemberAdded={handleMemberAdded}
      />

      <TripSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        trip={currentTrip}
        onTripUpdated={handleTripUpdated}
      />

      <Modal
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        title="Cancel Trip"
        description="This trip cannot be uncancelled. Are you sure?"
      >
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
            Go Back
          </Button>
          <Button variant="danger" onClick={handleConfirmCancel}>
            Confirm
          </Button>
        </div>
      </Modal>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trip Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge status={currentTrip.status} className="text-sm" />
                {!isTerminal && isMaster && (
                  <Button
                    size="sm"
                    onClick={handleAdvanceStatus}
                    disabled={
                      (currentTrip.status === 'CONFIRMED' && !within24Hours && !nextStatus) ||
                      (currentTrip.status === 'CONFIRMED' && !within24Hours && nextStatus === 'HAPPENING')
                    }
                    title={
                      currentTrip.status === 'CONFIRMED' && !within24Hours
                        ? 'Will be enabled 1 day before the trip start date'
                        : undefined
                    }
                  >
                    {getAdvanceButtonLabel()}
                  </Button>
                )}
              </div>
              
              {currentTrip.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                  <p className="mt-1">{currentTrip.description}</p>
                </div>
              )}
              
              {currentTrip.startDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-current" />
                  <span>{formatDateRange(currentTrip.startDate, currentTrip.endDate)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {members.map((member) => (
                  <div key={member.userId} className="flex items-center justify-between rounded-lg border border-border p-3 pr-2">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={member.user?.avatarUrl || undefined}
                        name={member.user?.name || 'User'}
                        size="md"
                      />
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.user?.name || 'User'}</p>
                        {member.status === 'INVITED' && (
                          <Badge status="INVITED" className="text-xs">Pending</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {member.role === 'MASTER' && 'Trip Master'}
                        {member.role === 'ORGANIZER' && 'Organizer'}
                        {member.role === 'MEMBER' && 'Member'}
                        {member.role === 'VIEWER' && 'Viewer'}
                      </p>
                    </div>
                    {renderMemberActions(member)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.filter(a => a.status === 'CONFIRMED').length === 0 ? (
                <p className="text-sm text-muted-foreground">No confirmed activities yet</p>
              ) : (
                <div className="space-y-3">
                  {activities.filter(a => a.status === 'CONFIRMED').map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {activity.category && (
                              <Badge variant="secondary" className="text-xs">{activity.category}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {activity.startTime && format(new Date(activity.startTime), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="font-semibold">{formatCurrency(Number(activity.cost) || 0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <span className="text-sm text-muted-foreground">Activities</span>
                <span className="font-semibold">{activities.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <span className="text-sm text-muted-foreground">Members</span>
                <span className="font-semibold">{members.length}</span>
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-semibold">{formatCurrency(stats.total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Collected</span>
                <span className="font-semibold text-green-600">{formatCurrency(stats.collected)}</span>
              </div>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = `/trip/${tripId}/payments`}>
                View Payments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
