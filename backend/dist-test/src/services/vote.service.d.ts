export declare class VoteService {
    castVote(activityId: string, userId: string, option: 'YES' | 'NO' | 'MAYBE'): Promise<{
        id: string;
        userId: string;
        option: import("@prisma/client").$Enums.VoteOption;
        activityId: string;
    }>;
    removeVote(activityId: string, userId: string): Promise<{
        id: string;
        userId: string;
        option: import("@prisma/client").$Enums.VoteOption;
        activityId: string;
    }>;
    getVotes(activityId: string): Promise<({
        user: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        userId: string;
        option: import("@prisma/client").$Enums.VoteOption;
        activityId: string;
    })[]>;
    getUserVote(activityId: string, userId: string): Promise<{
        id: string;
        userId: string;
        option: import("@prisma/client").$Enums.VoteOption;
        activityId: string;
    } | null>;
}
export declare const voteService: VoteService;
//# sourceMappingURL=vote.service.d.ts.map