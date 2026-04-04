'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { UnifiedTimeline } from '@/components/trip/unified-timeline';
import TripHistoryPage from '@/app/trip/[id]/history/page';
import { AddMilestoneModal } from '@/components/trip/add-milestone-modal';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/services/api';
import { TripMember } from '@/types';

type ViewMode = 'timeline' | 'history';

export default function TripTimeline() {
  const params = useParams();
  const tripId = params.id as string;
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [members, setMembers] = useState<TripMember[]>([]);
  const { user } = useAuth();

  const currentUserMember = members.find(m => m.userId === user?.id);
  const canManageMilestones = currentUserMember?.role === 'MASTER' || currentUserMember?.role === 'ORGANIZER';

  useEffect(() => {
    api.getTripMembers(tripId).then(result => {
      if (result.data) setMembers(result.data);
    }).catch(console.error);
  }, [tripId]);

  return (
    <div className="space-y-4">
      {/* Header + toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Timeline</h2>
        <div className="flex items-center gap-3">
          {canManageMilestones && (
            <button
              onClick={() => setMilestoneModalOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Milestone
            </button>
          )}
          <div className="flex items-center rounded-full border border-border bg-muted p-0.5">
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'timeline'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'history'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              History
            </button>
          </div>
        </div>
      </div>

      {/* View */}
      {viewMode === 'timeline' ? (
        <UnifiedTimeline tripId={tripId} members={members} />
      ) : (
        <TripHistoryPage />
      )}

      <AddMilestoneModal
        isOpen={milestoneModalOpen}
        onClose={() => setMilestoneModalOpen(false)}
        tripId={tripId}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
