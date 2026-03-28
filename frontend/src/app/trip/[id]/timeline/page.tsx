'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Milestone, TimelineEvent, TripMember, BillSplit } from '@/types';
import { UnifiedTimeline } from '@/components/trip/unified-timeline';
import { RequestPaymentModal } from '@/components/trip/request-payment-modal';
import { RemindSettleModal } from '@/components/trip/remind-settle-modal';
import { MilestoneEditorModal } from '@/components/trip/milestone-editor-modal';
import { AddMilestoneModal } from '@/components/trip/add-milestone-modal';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { Plus, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function TripTimeline() {
  const params = useParams();
  const tripId = params.id as string;

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [billSplits, setBillSplits] = useState<BillSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showRequestPaymentModal, setShowRequestPaymentModal] = useState(false);
  const [showRemindSettleModal, setShowRemindSettleModal] = useState(false);
  const [showMilestoneEditorModal, setShowMilestoneEditorModal] = useState(false);
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);

  const timelineContentRef = useRef<HTMLDivElement>(null);

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

  // Scroll to next milestone on mount
  useEffect(() => {
    if (milestones.length > 0 && timelineContentRef.current) {
      const now = new Date();
      const upcomingMilestones = milestones
        .filter(m => {
          if (m.isSkipped) return false;
          const total = m.totalMembers ?? 1;
          const completed = m.completedCount ?? 0;
          return completed < total;
        })
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      if (upcomingMilestones.length > 0) {
        // Scroll to the first upcoming milestone after a short delay
        const timeoutId = setTimeout(() => {
          timelineContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [milestones]);

  const handleGenerateDefaultMilestones = async () => {
    setIsGenerating(true);
    try {
      await api.generateDefaultMilestones(tripId);
      await loadData();
    } catch (err) {
      console.error('Failed to generate default milestones:', err);
    } finally {
      setIsGenerating(false);
    }
  };

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

      {/* Generate Default Milestones - shows when no milestones and user is MASTER or ORGANIZER */}
      {milestones.length === 0 && canAddMilestone && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-700 dark:bg-amber-900/30">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                No milestones yet
              </h4>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                Generate default milestones based on your trip dates to track important deadlines and payments.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateDefaultMilestones}
                disabled={isGenerating}
                className="mt-3 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-200 dark:hover:bg-amber-900"
              >
                {isGenerating ? 'Generating…' : 'Generate Default Milestones'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div ref={timelineContentRef}>
        <UnifiedTimeline
          events={events}
          milestones={milestones}
          members={members}
          tripId={tripId}
        />
      </div>

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
