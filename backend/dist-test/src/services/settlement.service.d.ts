import { BillSplit, BillSplitMember } from '@prisma/client';
export interface SettlementMemberStatus {
    userId: string;
    isSettled: boolean;
}
export interface SettlementStatus {
    members: SettlementMemberStatus[];
    allSettled: boolean;
}
type BillSplitWithMembers = BillSplit & {
    members: BillSplitMember[];
};
/**
 * Check if a specific member is "settled" — meaning:
 * - For every BillSplit in the trip, this member's entry has status PAID or CONFIRMED
 * - AND every BillSplit itself has status CONFIRMED (payer confirmed receipt)
 */
export declare function checkMemberIsSettled(userId: string, billSplits: BillSplitWithMembers[]): boolean;
/**
 * Auto-complete settlement milestones based on current payment state:
 * - SETTLEMENT_DUE: auto-completes for each member who is fully settled
 * - SETTLEMENT_COMPLETE: auto-completes for ALL members when everyone is settled
 */
export declare function checkAndUpdateSettlementMilestones(tripId: string): Promise<void>;
/**
 * Get per-member settlement status for a trip (used by GET /api/trips/:id/settlement-status)
 */
export declare function getSettlementStatus(tripId: string): Promise<SettlementStatus>;
export {};
//# sourceMappingURL=settlement.service.d.ts.map