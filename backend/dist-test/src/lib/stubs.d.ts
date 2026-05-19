import { PrismaClient } from '@prisma/client';
/**
 * PrismaStub - In-memory mock of PrismaClient for unit testing
 */
export declare class PrismaStub {
    private users;
    private trips;
    private activities;
    private votes;
    private members;
    private messages;
    private billSplits;
    private billSplitMembers;
    private invites;
    private notifications;
    private friends;
    private friendRequests;
    private mediaItems;
    private timelineEvents;
    private dmConversations;
    private settings;
    private milestones;
    private milestoneCompletions;
    private milestoneActions;
    private messageReadReceipts;
    private notificationPreferences;
    private tripTimelineUIStates;
    /** Apply Prisma include/select to an activity record */
    private _applyActivityInclude;
    /** Apply Prisma include/select to a message record */
    private _applyMessageInclude;
    getImplementation(): PrismaClient;
    mockReset(): void;
}
/**
 * SocketStub - Mock of Socket.IO server
 */
export declare class SocketStub {
    private rooms;
    emit: import("vitest").Mock<any, any>;
    to: import("vitest").Mock<any, any>;
    in: import("vitest").Mock<any, any>;
    getImplementation(): any;
    mockReset(): void;
}
/**
 * Factory function to create all stubs
 */
export declare function createStubs(): {
    prisma: PrismaStub;
    socket: SocketStub;
};
//# sourceMappingURL=stubs.d.ts.map