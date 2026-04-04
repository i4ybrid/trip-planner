'use client';

import React, { useState } from 'react';
import { Milestone, TripMember } from '@/types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar, Check, Clock, AlertCircle, Settings, Users, Sparkles } from 'lucide-react';
import { api } from '@/services/api';

interface MilestoneListPanelProps {
  milestones: Milestone[];
  members: TripMember[];
  currentUserId: string;
  currentUserRole: string;
  tripId?: string;
  onRefresh?: () => void;
  onEditMilestone: (milestone: Milestone) => void;
  onMarkComplete: (milestone: Milestone, userId: string, status: 'COMPLETED' | 'SKIPPED') => void;
}

export function MilestoneListPanel({
  milestones,
  members,
  currentUserId,
  currentUserRole,
  tripId,
  onRefresh,
  onEditMilestone,
  onMarkComplete,
}: MilestoneListPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  // Look up role from members array to handle initial render before role was loaded from API
  const myMember = members.find(m => m.userId === currentUserId);
  const canManage = myMember?.role === 'MASTER' || myMember?.role === 'ORGANIZER';
  const confirmedMembers = members.filter(m => m.status === 'CONFIRMED');

  const handleGenerateDefaults = async () => {
    if (!tripId) return;
    setIsGenerating(true);
    try {
      await api.generateDefaultMilestones(tripId);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to generate default milestones:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const getMilestoneStatus = (milestone: Milestone) => {
    const completionRatio = (milestone.completedCount || 0) / (milestone.totalMembers || 1);
    const now = new Date();
    const dueDate = new Date(milestone.dueDate);

    if (milestone.isSkipped) return 'skipped';
    if (completionRatio >= 1) return 'completed';
    if (dueDate < now && completionRatio < 1) return 'overdue';
    if (completionRatio > 0) return 'in-progress';
    return 'upcoming';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="h-4 w-4 text-green-500 dark:text-green-400" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />;
      default: return <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />;
    }
  };

  const getMilestoneTypeIcon = (type: string) => {
    switch (type) {
      case 'COMMITMENT_REQUEST':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'COMMITMENT_DEADLINE':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'FINAL_PAYMENT_DUE':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <Settings className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const activeMilestones = milestones.filter(m => !m.isSkipped);

  if (activeMilestones.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center">
        <Calendar className="mx-auto h-8 w-8 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium">No Milestones</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Milestones will appear here once the trip moves to planning.
        </p>

      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeMilestones.map((milestone) => {
        const status = getMilestoneStatus(milestone);

        return (
          <div
            key={milestone.id}
            className={cn(
              'rounded-lg border p-4 transition-colors',
              status === 'overdue' && 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900',
              status === 'completed' && 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900',
              status === 'in-progress' && 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900',
              status === 'upcoming' && 'border-gray-200 bg-white dark:border-gray-700 dark:bg-[hsl(var(--card))]'
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getStatusIcon(status)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{milestone.name}</h4>
                    {getMilestoneTypeIcon(milestone.type)}
                    {milestone.type === 'CUSTOM' && (
                      <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                        Custom
                      </span>
                    )}
                    {milestone.isLocked && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        Locked
                      </span>
                    )}
                    {milestone.isHard && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-600 dark:bg-red-900 dark:text-red-200">
                        Hard
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Due: {format(new Date(milestone.dueDate), 'MMMM d, yyyy')}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">
                      {milestone.completedCount || 0}/{milestone.totalMembers || 0} members completed
                    </div>
                    {status === 'overdue' && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-600 dark:bg-red-900 dark:text-red-200">
                        Overdue
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mark complete button for current user */}
                {status !== 'completed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkComplete(milestone, currentUserId, 'COMPLETED')}
                    className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                  >
                    Mark Complete
                  </Button>
                )}

                {/* Edit button for organizers */}
                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditMilestone(milestone)}
                    className="px-2"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
