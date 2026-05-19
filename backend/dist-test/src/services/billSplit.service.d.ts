export declare class BillSplitService {
    private prisma;
    createBillSplit(data: {
        tripId: string;
        title: string;
        description?: string;
        amount?: number;
        currency?: string;
        splitType: 'EQUAL' | 'SHARES' | 'PERCENTAGE' | 'MANUAL';
        costType?: 'PER_PERSON' | 'FIXED';
        paidBy: string;
        createdBy: string;
        activityId?: string;
        dueDate?: Date;
        members?: {
            userId: string;
            dollarAmount?: number;
            shares?: number;
            percentage?: number;
        }[];
    }): Promise<{
        members: ({
            user: {
                id: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            type: import("@prisma/client").$Enums.SplitType;
            status: import("@prisma/client").$Enums.PaymentStatus;
            dollarAmount: import("@prisma/client/runtime/library").Decimal;
            shares: number | null;
            percentage: import("@prisma/client/runtime/library").Decimal | null;
            billSplitId: string;
            paidAt: Date | null;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod | null;
            transactionId: string | null;
        })[];
        payer: {
            id: string;
            name: string;
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
    }>;
    getBillSplit(id: string): Promise<({
        trip: {
            id: string;
            name: string;
        };
        activity: {
            id: string;
            title: string;
        } | null;
        members: ({
            user: {
                id: string;
                name: string;
                avatarUrl: string | null;
                venmo: string | null;
                paypal: string | null;
                zelle: string | null;
                cashapp: string | null;
            };
        } & {
            id: string;
            userId: string;
            type: import("@prisma/client").$Enums.SplitType;
            status: import("@prisma/client").$Enums.PaymentStatus;
            dollarAmount: import("@prisma/client/runtime/library").Decimal;
            shares: number | null;
            percentage: import("@prisma/client/runtime/library").Decimal | null;
            billSplitId: string;
            paidAt: Date | null;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod | null;
            transactionId: string | null;
        })[];
        payer: {
            id: string;
            name: string;
            venmo: string | null;
            paypal: string | null;
            zelle: string | null;
            cashapp: string | null;
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
    getTripBillSplits(tripId: string): Promise<({
        members: ({
            user: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            userId: string;
            type: import("@prisma/client").$Enums.SplitType;
            status: import("@prisma/client").$Enums.PaymentStatus;
            dollarAmount: import("@prisma/client/runtime/library").Decimal;
            shares: number | null;
            percentage: import("@prisma/client/runtime/library").Decimal | null;
            billSplitId: string;
            paidAt: Date | null;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod | null;
            transactionId: string | null;
        })[];
        payer: {
            id: string;
            name: string;
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
    })[]>;
    updateBillSplit(id: string, data: {
        title?: string;
        description?: string;
        amount?: number;
        currency?: string;
        splitType?: 'EQUAL' | 'SHARES' | 'PERCENTAGE' | 'MANUAL';
        costType?: 'PER_PERSON' | 'FIXED';
        status?: 'PENDING' | 'PARTIAL' | 'PAID' | 'CONFIRMED' | 'CANCELLED';
        dueDate?: Date;
        paidBy?: string;
        members?: {
            userId: string;
            dollarAmount?: number;
            shares?: number;
            percentage?: number;
        }[];
    }): Promise<{
        members: ({
            user: {
                id: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            type: import("@prisma/client").$Enums.SplitType;
            status: import("@prisma/client").$Enums.PaymentStatus;
            dollarAmount: import("@prisma/client/runtime/library").Decimal;
            shares: number | null;
            percentage: import("@prisma/client/runtime/library").Decimal | null;
            billSplitId: string;
            paidAt: Date | null;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod | null;
            transactionId: string | null;
        })[];
        payer: {
            id: string;
            name: string;
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
    }>;
    deleteBillSplit(id: string): Promise<{
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
    }>;
    markMemberAsPaid(billSplitId: string, userId: string, paymentMethod: 'VENMO' | 'PAYPAL' | 'ZELLE' | 'CASHAPP' | 'CASH' | 'OTHER', transactionId?: string): Promise<{
        id: string;
        userId: string;
        type: import("@prisma/client").$Enums.SplitType;
        status: import("@prisma/client").$Enums.PaymentStatus;
        dollarAmount: import("@prisma/client/runtime/library").Decimal;
        shares: number | null;
        percentage: import("@prisma/client/runtime/library").Decimal | null;
        billSplitId: string;
        paidAt: Date | null;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod | null;
        transactionId: string | null;
    }>;
    removeMemberFromBillSplit(billSplitId: string, userId: string): Promise<{
        id: string;
        userId: string;
        type: import("@prisma/client").$Enums.SplitType;
        status: import("@prisma/client").$Enums.PaymentStatus;
        dollarAmount: import("@prisma/client/runtime/library").Decimal;
        shares: number | null;
        percentage: import("@prisma/client/runtime/library").Decimal | null;
        billSplitId: string;
        paidAt: Date | null;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod | null;
        transactionId: string | null;
    }>;
    confirmPayment(billSplitId: string): Promise<{
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
        members: {
            id: string;
            userId: string;
            type: import("@prisma/client").$Enums.SplitType;
            status: import("@prisma/client").$Enums.PaymentStatus;
            dollarAmount: import("@prisma/client/runtime/library").Decimal;
            shares: number | null;
            percentage: import("@prisma/client/runtime/library").Decimal | null;
            billSplitId: string;
            paidAt: Date | null;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod | null;
            transactionId: string | null;
        }[];
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
    }>;
}
export declare const billSplitService: BillSplitService;
//# sourceMappingURL=billSplit.service.d.ts.map