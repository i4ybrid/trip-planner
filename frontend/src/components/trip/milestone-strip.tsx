'use client';

import React, { useState } from 'react';
import { Milestone } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Check, Clock, AlertCircle, Lock } from 'lucide-react';

interface MilestoneStripProps {
  milestones: Milestone[];
  totalMembers: number;
  onMilestoneClick?: (milestone: Milestone) => void;
}

export function MilestoneStrip({ milestones, totalMembers, onMilestoneClick }: MilestoneStripProps) {
  const [hoveredMilestone, setHoveredMilestone] = useState<string | null>(null);

  if (!milestones || milestones.length === 0) {
    return null;
  }

  const activeMilestones = milestones.filter(m => !m.isSkipped);
  const completedCount = activeMilestones.filter(m => {
    const completionRatio = (m.completedCount || 0) / totalMembers;
    return completionRatio >= 1;
  }).length;
  const progressPercentage = activeMilestones.length > 0 
    ? Math.round((completedCount / activeMilestones.length) * 100) 
    : 0;

  const getMilestoneStatus = (milestone: Milestone) => {
    const completionRatio = (milestone.completedCount || 0) / totalMembers;
    const now = new Date();
    const dueDate = new Date(milestone.dueDate);

    if (milestone.isSkipped) return 'skipped';
    if (completionRatio >= 1) return 'completed';
    if (dueDate < now && completionRatio < 1) return 'overdue';
    if (completionRatio > 0) return 'in-progress';
    return 'upcoming';
  };

  const getMilestoneColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 dark:bg-green-600';
      case 'in-progress': return 'bg-yellow-500 dark:bg-yellow-600';
      case 'overdue': return 'bg-red-500 dark:bg-red-600';
      case 'skipped': return 'bg-gray-400 dark:bg-gray-600';
      default: return 'bg-gray-200 border-2 border-gray-300 dark:bg-gray-700 dark:border-gray-600';
    }
  };

  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="h-3 w-3 text-white" />;
      case 'overdue': return <AlertCircle className="h-3 w-3 text-white" />;
      case 'skipped': return null;
      default: return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Milestone Progress</span>
        <span className="font-medium">{progressPercentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div 
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Milestone dots */}
      <div className="flex items-center justify-between gap-1">
        {activeMilestones.map((milestone, index) => {
          const status = getMilestoneStatus(milestone);
          const isHovered = hoveredMilestone === milestone.id;
          
          return (
            <div 
              key={milestone.id}
              className="relative flex-1"
              onMouseEnter={() => setHoveredMilestone(milestone.id)}
              onMouseLeave={() => setHoveredMilestone(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-3 py-2 text-xs shadow-lg border">
                  <div className="font-medium">{milestone.name}</div>
                  <div className="text-muted-foreground">
                    {format(new Date(milestone.dueDate), 'MMM d, yyyy')}
                  </div>
                  <div className="mt-1">
                    {milestone.isLocked && <Lock className="inline h-3 w-3 mr-1" />}
                    {milestone.completedCount || 0}/{totalMembers} completed
                  </div>
                </div>
              )}

              {/* Milestone dot */}
              <button
                onClick={() => onMilestoneClick?.(milestone)}
                className={cn(
                  'relative flex h-6 w-full items-center justify-center rounded-full transition-all',
                  getMilestoneColor(status),
                  status === 'upcoming' && 'hover:scale-110',
                  onMilestoneClick && 'cursor-pointer'
                )}
              >
                {getMilestoneIcon(status)}
                
                {/* Half-filled indicator for in-progress */}
                {status === 'in-progress' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-full w-1/2 rounded-full bg-yellow-500 dark:bg-yellow-600" />
                  </div>
                )}
              </button>

              {/* Connector line */}
              {index < activeMilestones.length - 1 && (
                <div 
                  className={cn(
                    'absolute left-1/2 top-1/2 h-0.5 w-full -translate-y-1/2',
                    status === 'completed' ? 'bg-green-500 dark:bg-green-600' : 'bg-gray-200 dark:bg-gray-600'
                  )}
                  style={{ left: '50%' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-green-500 dark:bg-green-600" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-yellow-500 dark:bg-yellow-600" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-gray-200 border border-gray-300 dark:bg-gray-700 dark:border-gray-600" />
          <span>Upcoming</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-red-500 dark:bg-red-600" />
          <span>Overdue</span>
        </div>
      </div>
    </div>
  );
}
