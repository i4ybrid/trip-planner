'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTripStore } from '@/store';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Select, Avatar } from '@/components';
import { InviteModal } from '@/components/trip/invite-modal';
import { formatDateRange, formatCurrency, cn } from '@/lib/utils';
import { api } from '@/services/api';
import { MapPin, Calendar, Users, DollarSign, Share2, Settings, MoreVertical, Shield, Trash2 } from 'lucide-react';
import { TripMember, User, Activity, BillSplit, MemberRole, TripStyle } from '@/types';
import { useAuthStore } from '@/store';

export default function TripOverview() {
  const params = useParams();
  const tripId = params.id as string;

  const { currentTrip, isLoading, fetchTrip, changeStatus } = useTripStore();
  const { user } = useAuthStore();
  const [members, setMembers] = useState<TripMember[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [billSplits, setBillSplits] = useState<BillSplit[]>([]);
  const [stats, setStats] = useState({ total: 0, collected: 0 });
  const [showInviteModal, setShowInviteModal] = useState(false);

  const currentUserMember = members.find(m => m.userId === user?.id);
  const canInvite = !!(currentUserMember && (
    currentUserMember.role === 'MASTER' || 
    (currentTrip?.style === 'OPEN' && ['ORGANIZER', 'MEMBER'].includes(currentUserMember.role))
  ));
  const isMaster = currentUserMember?.role === 'MASTER';

  useEffect(() => {
    if (tripId) {
      fetchTrip(tripId);
      
      Promise.all([
        api.getTripMembers(tripId),
        api.getActivities(tripId),
        api.getBillSplits(tripId),
      ]).then(([membersResult, activitiesResult, billSplitsResult]) => {
        if (membersResult.data) {
          setMembers(membersResult.data);
        }
        if (activitiesResult.data) {
          setActivities(activitiesResult.data);
        }
        if (billSplitsResult.data) {
          setBillSplits(billSplitsResult.data);
          
          const total = billSplitsResult.data.reduce((sum, b) => sum + Number(b.amount), 0);
          const collected = billSplitsResult.data.reduce((sum, b) => {
            const paidMembers = b.members?.filter(m => m.status === 'PAID' || m.status === 'CONFIRMED') || [];
            return sum + paidMembers.reduce((memberSum, m) => memberSum + Number(m.dollarAmount), 0);
          }, 0);
          setStats({ total, collected });
        }
      });
    }
  }, [tripId, fetchTrip]);

  const handleMemberAdded = () => {
    api.getTripMembers(tripId).then(result => {
      if (result.data) setMembers(result.data);
    });
  };

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
      <div className="flex items-center gap-1">
        {member.role !== 'ORGANIZER' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePromoteToOrganizer(member.userId)}
          >
            <Shield className="mr-1 h-3 w-3" />
            Make Organizer
          </Button>
        )}
        {member.role === 'ORGANIZER' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePromoteToOrganizer(member.userId)}
          >
            <Shield className="mr-1 h-3 w-3" />
            Remove Organizer
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700"
          onClick={() => handleRemoveMember(member.userId)}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          Remove
        </Button>
      </div>
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
          <Button variant="outline">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        tripId={tripId}
        tripStyle={currentTrip.style}
        onMemberAdded={handleMemberAdded}
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
                  <div key={member.userId} className="flex items-center justify-between rounded-lg border border-border p-3">
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
