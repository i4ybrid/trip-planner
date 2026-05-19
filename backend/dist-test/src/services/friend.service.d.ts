export declare class FriendService {
    getFriends(userId: string): Promise<({
        friend: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        friendId: string;
    })[]>;
    getRelationship(userId: string, otherUserId: string): Promise<string>;
    sendFriendRequest(senderId: string, receiverId: string): Promise<{
        sender: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.FriendRequestStatus;
        receiverId: string;
        senderId: string;
        respondedAt: Date | null;
    }>;
    getFriendRequests(userId: string): Promise<{
        sent: ({
            receiver: {
                id: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import("@prisma/client").$Enums.FriendRequestStatus;
            receiverId: string;
            senderId: string;
            respondedAt: Date | null;
        })[];
        received: ({
            sender: {
                id: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import("@prisma/client").$Enums.FriendRequestStatus;
            receiverId: string;
            senderId: string;
            respondedAt: Date | null;
        })[];
    }>;
    acceptFriendRequest(requestId: string): Promise<({
        sender: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        receiver: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.FriendRequestStatus;
        receiverId: string;
        senderId: string;
        respondedAt: Date | null;
    }) | null>;
    declineFriendRequest(requestId: string): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.FriendRequestStatus;
        receiverId: string;
        senderId: string;
        respondedAt: Date | null;
    }>;
    cancelFriendRequest(requestId: string): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.FriendRequestStatus;
        receiverId: string;
        senderId: string;
        respondedAt: Date | null;
    }>;
    removeFriend(userId: string, friendId: string): Promise<{
        success: boolean;
    }>;
}
export declare const friendService: FriendService;
//# sourceMappingURL=friend.service.d.ts.map