export declare class InviteCodeService {
    getInviteCodes(userId: string): Promise<{
        id: string;
        createdAt: Date;
        expiresAt: Date;
        usedAt: Date | null;
        code: string;
        createdBy: string;
        usedBy: string | null;
    }[]>;
    generateInviteCode(userId: string, daysUntilExpiry?: number): Promise<{
        id: string;
        createdAt: Date;
        expiresAt: Date;
        usedAt: Date | null;
        code: string;
        createdBy: string;
        usedBy: string | null;
    }>;
    useInviteCode(code: string, userId: string): Promise<{
        friendId: string;
        friendshipCreated: boolean;
    }>;
    revokeInviteCode(inviteCodeId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        expiresAt: Date;
        usedAt: Date | null;
        code: string;
        createdBy: string;
        usedBy: string | null;
    }>;
    validateInviteCode(code: string): Promise<{
        valid: boolean;
        reason: string;
        inviteCode?: undefined;
    } | {
        valid: boolean;
        inviteCode: {
            creator: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            expiresAt: Date;
            usedAt: Date | null;
            code: string;
            createdBy: string;
            usedBy: string | null;
        };
        reason?: undefined;
    }>;
}
export declare const inviteCodeService: InviteCodeService;
//# sourceMappingURL=invite-code.service.d.ts.map