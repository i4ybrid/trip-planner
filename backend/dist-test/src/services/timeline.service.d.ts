export interface EmitTimelineEventInput {
    tripId: string;
    eventType: string;
    actorId?: string;
    targetId?: string;
    metadata?: Record<string, any>;
    description?: string;
    effectiveDate?: Date;
}
export declare class TimelineService {
    private get prisma();
    emitTimelineEvent(input: EmitTimelineEventInput): Promise<void>;
    /**
     * Upsert TripTimelineUIState, setting needsRefresh = RefreshState.TRUE.
     * Called after any write operation so the timeline UI knows to refresh.
     */
    upsertNeedsRefresh(tripId: string): Promise<void>;
    /**
     * Write a MILESTONE TimelineEvent for the given milestone, then call upsertNeedsRefresh.
     */
    writeMilestoneToTimeline(milestone: {
        id: string;
        tripId: string;
        type: string;
        name: string;
        dueDate: Date;
        isLocked?: boolean;
        isHard?: boolean;
        isSkipped?: boolean;
        isManualOverride?: boolean;
        priority?: number;
    }, tripMasterId?: string | null): Promise<void>;
    /**
     * Write ACTIVITY_START and optionally ACTIVITY_END TimelineEvents for an activity.
     */
    writeActivityEvents(activity: {
        id: string;
        tripId: string;
        title: string;
        category: string;
        startTime: Date | null;
        endTime?: Date | null;
        createdAt: Date;
    }): Promise<void>;
    /**
     * Delete all TimelineEvents for an activity (ACTIVITY_START and ACTIVITY_END).
     */
    deleteActivityTimelineEvents(activityId: string): Promise<void>;
    /**
     * Delete all TimelineEvents for a milestone.
     */
    deleteMilestoneTimelineEvents(milestoneId: string): Promise<void>;
    /**
     * Update a MILESTONE TimelineEvent in-place (title, icon, and/or effectiveDate).
     */
    updateMilestoneTimelineEvent(milestoneId: string, updates: {
        title?: string;
        icon?: string;
        effectiveDate?: Date;
    }): Promise<void>;
    /**
     * Update an ACTIVITY_START or ACTIVITY_END TimelineEvent in-place.
     */
    updateActivityTimelineEvent(activityId: string, kind: 'ACTIVITY_START' | 'ACTIVITY_END', updates: {
        title?: string;
        effectiveDate?: Date;
        icon?: string;
    }): Promise<void>;
    /**
     * Recalculate the UISubset: past = most recent 10 events before now,
     * future = all events from now onward, merged and sorted DESC.
     */
    recalculateUISubset(tripId: string): Promise<void>;
}
export declare const timelineService: TimelineService;
//# sourceMappingURL=timeline.service.d.ts.map