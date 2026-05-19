export declare class ReminderService {
    private prisma;
    sendBulkSettlementReminders(tripId: string, _senderId: string): Promise<{
        notified: string[];
        skipped: string[];
    }>;
    sendSettlementReminder(tripId: string, _senderId: string, targetUserId: string): Promise<void>;
}
export declare const reminderService: ReminderService;
//# sourceMappingURL=reminder.service.d.ts.map