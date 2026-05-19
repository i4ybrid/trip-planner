/**
 * Upload a receipt file for a BillSplit.
 * Saves to local uploads dir with UUID filename, updates BillSplit.receiptUrl.
 */
export declare function uploadReceipt(billSplitId: string, file: {
    mimetype: string;
    buffer: Buffer;
}): Promise<{
    receiptUrl: string;
    filename: string;
}>;
/**
 * Read a receipt file from disk (for serving via API).
 */
export declare function getReceiptBuffer(receiptUrl: string): Promise<{
    buffer: Buffer;
    mimeType: string;
}>;
/**
 * Get BillSplit with trip for ownership verification.
 */
export declare function getBillSplitById(billSplitId: string): Promise<({
    trip: {
        description: string | null;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TripStatus;
        destination: string | null;
        startDate: Date | null;
        endDate: Date | null;
        coverImage: string | null;
        style: import("@prisma/client").$Enums.TripStyle;
        tripMasterId: string;
        budget: import("@prisma/client/runtime/library").Decimal | null;
        heroImageId: string | null;
        autoMilestonesGenerated: boolean;
    };
} & {
    description: string | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: import("@prisma/client").$Enums.PaymentStatus;
    title: string;
    currency: string;
    amount: import("@prisma/client/runtime/library").Decimal;
    costType: import("@prisma/client").$Enums.CostType;
    splitType: import("@prisma/client").$Enums.SplitType;
    paidBy: string;
    activityId: string | null;
    dueDate: Date | null;
    tripId: string;
    createdBy: string;
    receiptUrl: string | null;
}) | null>;
export declare const paymentService: {
    uploadReceipt: typeof uploadReceipt;
    getReceiptBuffer: typeof getReceiptBuffer;
    getBillSplitById: typeof getBillSplitById;
};
//# sourceMappingURL=payment.service.d.ts.map