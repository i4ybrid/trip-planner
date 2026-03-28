'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTripStore } from '@/store';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Select, Avatar } from '@/components';
import { InviteModal } from '@/components/trip/invite-modal';
import { TripSettingsModal } from '@/components/trip/settings-modal';
import { HoverDropdown } from '@/components/hover-dropdown';
import { MilestoneStrip } from '@/components/trip/milestone-strip';
import { MilestoneListPanel } from '@/components/trip/milestone-list';
import { RequestPaymentModal } from '@/components/trip/request-payment-modal';
import { RemindSettleModal } from '@/components/trip/remind-settle-modal';
import { MilestoneEditorModal } from '@/components/trip/milestone-editor-modal';
import { AddMilestoneModal } from '@/components/trip/add-milestone-modal';
import { formatDateRange, formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { api } from '@/services/api';
import { logger } from '@/lib/logger';
import { MapPin, Calendar, Users, DollarSign, Share2, Settings, MoreVertical, MoreHorizontal, Shield, Trash2, Flag, Plus, Check } from 'lucide-react';
import { TripMember, User, Activity, BillSplit, MemberRole, TripStyle, Milestone } from '@/types';
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

  // Milestone state
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showRequestPaymentModal, setShowRequestPaymentModal] = useState(false);
  const [showRemindSettleModal, setShowRemindSettleModal] = useState(false);
  const [showMilestoneEditorModal, setShowMilestoneEditorModal] = useState(false);
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  
  // Track if data has been loaded to prevent redundant fetches
  const hasLoadedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentUserMember = members.find(m => m.userId === user?.id);
  const canInvite = !!(currentUserMember && (
    currentUserMember.role === 'MASTER' || 
    (currentTrip?.style === 'OPEN' && ['ORGANIZER', 'MEMBER'].includes(currentUserMember.role))
  ));
  const isMaster = currentUserMember?.role === 'MASTER';
  const canAddMilestone = currentUserMember?.role === 'MASTER' || currentUserMember?.role === 'ORGANIZER';

  // Compute the next upcoming milestone (earliest due date that isn't completed or skipped)
  const nextMilestone = milestones
    .filter(m => {
      if (m.isSkipped) return false;
      const total = m.totalMembers ?? 1;
      const completed = m.completedCount ?? 0;
      return completed < total;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

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
              const paidMembers = b.members?.filter(m => m.status === 'PAID' || m.status === 'CONFIRMED') || [];
              return sum + paidMembers.reduce((memberSum, m) => memberSum + Number(m.dollarAmount), 0);
            }, 0);
            setStats({ total, collected });
          }
        }),
      ]);

      // Fetch milestones
      api.getMilestones(tripId).then(result => {
        if (result.data) setMilestones(result.data);
      }).catch(() => {
        // Milestones might not exist for IDEA trips
      });
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

  // Milestone handlers
  const handleMilestoneClick = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
  };

  const handleEditMilestone = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setShowMilestoneEditorModal(true);
  };

  const handleRequestPayment = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setShowRequestPaymentModal(true);
  };

  const handleRemindSettle = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setShowRemindSettleModal(true);
  };

  const handleMarkComplete = async (milestone: Milestone, userId: string, status: 'COMPLETED' | 'SKIPPED') => {
    await api.updateMilestoneCompletion(milestone.id, userId, status);
    // Refresh milestones
    api.getMilestones(tripId).then(result => {
      if (result.data) setMilestones(result.data);
    });
  };

  const handleMilestoneSuccess = () => {
    api.getMilestones(tripId).then(result => {
      if (result.data) setMilestones(result.data);
    });
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
            <Button variant="outline" onClick={() => setShowSettingsModal(true)}>
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

      {/* Next Milestone Callout */}
      {nextMilestone && (
        <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Your Next Milestone
                </p>
                <h4 className="mt-1 text-lg font-semibold text-gray-900">
                  {nextMilestone.name}
                </h4>
                <p className="mt-1 text-sm text-amber-700">
                  Due: {format(new Date(nextMilestone.dueDate), 'MMMM d, yyyy')}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-300 bg-white text-amber-700 hover:bg-amber-100"
                    onClick={() => handleMarkComplete(nextMilestone, user?.id || '', 'COMPLETED')}
                  >
                    <Check className="mr-1 h-4 w-4" />
                    Mark Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                    onClick={() => handleMilestoneClick(nextMilestone)}
                  >
                    View Details →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Strip */}
      {milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MilestoneStrip
              milestones={milestones}
              totalMembers={members.filter(m => m.status === 'CONFIRMED').length}
              onMilestoneClick={handleMilestoneClick}
            />
          </CardContent>
        </Card>
      )}

      {/* Milestone List Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Milestone Details
            </CardTitle>
            {canAddMilestone && (
              <Button size="sm" variant="outline" onClick={() => setShowAddMilestoneModal(true)}>
                <Plus className="mr-1 h-4 w-4" />
                Add Milestone
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <MilestoneListPanel
            milestones={milestones}
            members={members}
            currentUserId={user?.id || ''}
            currentUserRole={currentUserMember?.role || ''}
            tripId={tripId}
            onRefresh={() => {
              // Re-fetch milestones
              api.getMilestones(tripId).then(result => {
                if (result.data) setMilestones(result.data);
              });
            }}
            onEditMilestone={handleEditMilestone}
            onRequestPayment={handleRequestPayment}
            onRemindSettle={handleRemindSettle}
            onMarkComplete={handleMarkComplete}
          />
        </CardContent>
      </Card>

      {/* Milestone Modals */}
      <RequestPaymentModal
        isOpen={showRequestPaymentModal}
        onClose={() => {
          setShowRequestPaymentModal(false);
          setSelectedMilestone(null);
        }}
        tripId={tripId}
        milestone={selectedMilestone}
        members={members}
        onSuccess={handleMilestoneSuccess}
      />

      <RemindSettleModal
        isOpen={showRemindSettleModal}
        onClose={() => {
          setShowRemindSettleModal(false);
          setSelectedMilestone(null);
        }}
        tripId={tripId}
        milestone={selectedMilestone}
        members={members}
        billSplits={billSplits}
        onSuccess={handleMilestoneSuccess}
      />

      <MilestoneEditorModal
        isOpen={showMilestoneEditorModal}
        onClose={() => {
          setShowMilestoneEditorModal(false);
          setSelectedMilestone(null);
        }}
        milestone={selectedMilestone}
        onSuccess={handleMilestoneSuccess}
      />

      <AddMilestoneModal
        isOpen={showAddMilestoneModal}
        onClose={() => setShowAddMilestoneModal(false)}
        tripId={tripId}
        onSuccess={handleMilestoneSuccess}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trip Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge status={currentTrip.status} className="text-sm" />
                <Select
                  value={currentTrip.status}
                  onChange={(e) => changeStatus(tripId, e.target.value as any)}
                  options={[
                    { value: 'IDEA', label: 'Idea (Feelers)' },
                    { value: 'PLANNING', label: 'Planning' },
                    { value: 'CONFIRMED', label: 'Confirmed' },
                    { value: 'HAPPENING', label: 'Happening' },
                    { value: 'COMPLETED', label: 'Completed' },
                    { value: 'CANCELLED', label: 'Cancelled' },
                  ]}
                />
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
                      <div>
                        <p className="font-medium">{member.user?.name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.role === 'MASTER' && 'Trip Master'}
                          {member.role === 'ORGANIZER' && 'Organizer'}
                          {member.role === 'MEMBER' && 'Member'}
                          {member.role === 'VIEWER' && 'Viewer'}
                          {member.status === 'INVITED' && ' (Invited)'}
                        </p>
                      </div>
                    </div>
                    {renderMemberActions(member)}
                  </div>
                ))}
              </div>
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
              <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <span className="text-sm text-muted-foreground">Memories</span>
                <span className="font-semibold">0</span>
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
