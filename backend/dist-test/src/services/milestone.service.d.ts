import { MilestoneType, MilestoneActionType } from '@prisma/client';
export declare class MilestoneService {
    private prisma;
    /**
     * Generate default milestones using TODAY as the baseline.
     * This is a manual backup for trips that skipped auto-generation.
     *
     * Algorithm:
     *   T_total = days from today to trip.startDate
     *   Commitment Request    = today + 50% of T_total
     *   Commitment Deadline   = today + 65% of T_total
     *   Final Payment Due      = today + 90% of T_total
     *   Settlement Due         = trip.endDate + 1 day
     *   Settlement Complete    = trip.endDate + 7 days
     */
    generateDefaultMilestonesFromToday(tripId: string, startDate: Date, endDate: Date): Promise<any[]>;
    /**
     * Generate idea-phase milestones: COMMITMENT_REQUEST and COMMITMENT_DEADLINE.
     * These are created when a trip is first made (IDEA → PLANNING transition).
     *
     * Algorithm:
     *   T_remaining_ms = startDate.getTime() - Date.now()
     *   COMMITMENT_REQUEST  = now + T_remaining_ms × 0.30
     *   COMMITMENT_DEADLINE = now + T_remaining_ms × 0.50
     *
     * Only creates if not already exists for this trip.
     */
    generateIdeaMilestones(tripId: string, startDate: Date): Promise<any[]>;
    /**
     * Generate FINAL_PAYMENT_DUE milestone.
     * Called when trip moves to PLANNING or CONFIRMED status.
     *
     * Algorithm:
     *   FINAL_PAYMENT_DUE = now + T_remaining_ms × 0.75
     *   where T_remaining_ms = startDate.getTime() - Date.now()
     *
     * Idempotent: only creates if one doesn't already exist for this trip.
     */
    generateFinalPaymentMilestone(tripId: string, startDate: Date): Promise<any | null>;
    /**
     * Generate settlement milestones: SETTLEMENT_DUE and SETTLEMENT_COMPLETE.
     * Called when trip moves to HAPPENING status.
     *
     * Algorithm:
     *   SETTLEMENT_DUE     = endDate + 1 day
     *   SETTLEMENT_COMPLETE = endDate + 7 days
     *
     * Creates both milestones if they don't already exist for this trip.
     */
    generateSettlementMilestones(tripId: string, endDate: Date): Promise<any[]>;
    /**
     * Recalculate milestone dates when trip start date changes
     * Only updates milestones that are not locked or skipped
     */
    recalculateMilestones(tripId: string, newStartDate: Date): Promise<void>;
    /**
     * Get all milestones with completion status for each member
     */
    getMilestonesWithProgress(tripId: string): Promise<any[]>;
    /**
     * Trigger on-demand action.
     * NOTE: SETTLEMENT_REMINDER and PAYMENT_REQUEST action types are no longer supported.
     * Settlement reminders are now sent via the Payments tab using reminderService.
     */
    triggerOnDemandAction(_tripId: string, actionType: MilestoneActionType, _sentById: string, _recipientIds: string[], _message?: string): Promise<void>;
    /**
     * Create a milestone of any type (COMMITMENT_REQUEST, COMMITMENT_DEADLINE,
     * FINAL_PAYMENT_DUE, SETTLEMENT_DUE, SETTLEMENT_COMPLETE, or CUSTOM).
     */
    createMilestone(tripId: string, data: {
        name: string;
        type: MilestoneType;
        dueDate: Date;
        isHard?: boolean;
        priority?: number;
    }): Promise<any>;
    /**
     * Create a custom milestone
     */
    createCustomMilestone(tripId: string, data: {
        name: string;
        type: string;
        dueDate: Date;
        isHard?: boolean;
        priority?: number;
    }): Promise<any>;
    /**
     * Delete a milestone and its timeline events
     */
    deleteMilestone(milestoneId: string): Promise<void>;
    /**
     * Update milestone (date, lock, skip, hard/soft)
     */
    updateMilestone(milestoneId: string, data: {
        dueDate?: Date;
        isLocked?: boolean;
        isSkipped?: boolean;
        isHard?: boolean;
        name?: string;
    }): Promise<any>;
    /**
     * Update milestone completion for a specific user
     */
    updateMilestoneCompletion(milestoneId: string, userId: string, status: string, note?: string): Promise<any>;
    /**
     * Get milestone completion progress per member
     */
    getMilestoneProgress(tripId: string): Promise<any>;
}
export declare const milestoneService: MilestoneService;
//# sourceMappingURL=milestone.service.d.ts.map