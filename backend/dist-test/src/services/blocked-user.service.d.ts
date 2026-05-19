export declare class BlockedUserService {
    getBlockedUsers(userId: string): Promise<({
        blocked: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        blockedId: string;
    })[]>;
    blockUser(userId: string, blockedId: string): Promise<{
        blocked: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        blockedId: string;
    }>;
    unblockUser(userId: string, blockedId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        blockedId: string;
    }>;
    isBlocked(userId: string, blockedId: string): Promise<boolean>;
    isBlockedEitherDirection(userId1: string, userId2: string): Promise<boolean>;
    private cleanupOnBlock;
}
export declare const blockedUserService: BlockedUserService;
//# sourceMappingURL=blocked-user.service.d.ts.map