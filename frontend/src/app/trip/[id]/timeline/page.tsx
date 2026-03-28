'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Milestone, TimelineEvent, TripMember, BillSplit } from '@/types';
import { UnifiedTimeline } from '@/components/trip/unified-timeline';
import { RequestPaymentModal } from '@/components/trip/request-payment-modal';
import { RemindSettleModal } from '@/components/trip/remind-settle-modal';
import { MilestoneEditorModal } from '@/components/trip/milestone-editor-modal';
import { AddMilestoneModal } from '@/components/trip/add-milestone-modal';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function TripTimeline() {
  const params = useParams();
  const tripId = params.id as string;

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [billSplits, setBillSplits] = useState<BillSplit[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showRequestPaymentModal, setShowRequestPaymentModal] = useState(false);
  const [showRemindSettleModal, setShowRemindSettleModal] = useState(false);
  const [showMilestoneEditorModal, setShowMilestoneEditorModal] = useState(false);
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);

  const { data: session } = useSession();
  const currentUserId = session?.user?.id || '';
  const currentUserMember = members.find(m => m.userId === currentUserId);
  const currentUserRole = currentUserMember?.role || '';
  const canAddMilestone = currentUserRole === 'MASTER' || currentUserRole === 'ORGANIZER';

  const loadData = useCallback(async () => {
    const [eventsResult, milestonesResult, membersResult, billSplitsResult] =
      await Promise.all([
        api.getTripTimeline(tripId),
        api.getMilestones(tripId),
        api.getTripMembers(tripId),
        api.getBillSplits(tripId),
      ]);

    if (eventsResult.data) setEvents(eventsResult.data);
    if (milestonesResult.data) setMilestones(milestonesResult.data);
    if (membersResult.data) setMembers(membersResult.data);
    if (billSplitsResult.data) setBillSplits(billSplitsResult.data);
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRequestPayment = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setShowRequestPaymentModal(true);
  };

  const handleRemindSettle = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setShowRemindSettleModal(true);
  };

  const handleEditMilestone = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setShowMilestoneEditorModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Timeline</h2>
        {canAddMilestone && (
          <Button size="sm" onClick={() => setShowAddMilestoneModal(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add Milestone
          </Button>
        )}
      </div>

      <UnifiedTimeline
        events={events}
        milestones={milestones}
        members={members}
        tripId={tripId}
        onRequestPayment={handleRequestPayment}
        onRemindSettle={handleRemindSettle}
        onEditMilestone={handleEditMilestone}
        onRefresh={loadData}
      />

      {/* Request Payment Modal */}
      <RequestPaymentModal
        isOpen={showRequestPaymentModal}
        onClose={() => setShowRequestPaymentModal(false)}
        tripId={tripId}
        milestone={selectedMilestone}
        members={members}
        onSuccess={loadData}
      />

      {/* Remind Settle Modal */}
      <RemindSettleModal
        isOpen={showRemindSettleModal}
        onClose={() => setShowRemindSettleModal(false)}
        tripId={tripId}
        milestone={selectedMilestone}
        members={members}
        billSplits={billSplits}
        onSuccess={loadData}
      />

      {/* Milestone Editor Modal */}
      <MilestoneEditorModal
        isOpen={showMilestoneEditorModal}
        onClose={() => setShowMilestoneEditorModal(false)}
        milestone={selectedMilestone}
        onSuccess={loadData}
      />

      {/* Add Milestone Modal */}
      <AddMilestoneModal
        isOpen={showAddMilestoneModal}
        onClose={() => setShowAddMilestoneModal(false)}
        tripId={tripId}
        onSuccess={loadData}
      />
    </div>
  );
}
