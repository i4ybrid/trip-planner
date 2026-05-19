export declare class MessageService {
    private prisma;
    createTripMessage(tripId: string, senderId: string, content: string, messageType?: string, mentions?: string[], replyToId?: string): Promise<{
        sender: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        replyTo: {
            id: string;
            content: string;
            sender: {
                id: string;
                name: string;
            };
        } | null;
    } & {
        id: string;
        createdAt: Date;
        content: string;
        messageType: import("@prisma/client").$Enums.MessageType;
        mentions: string[];
        replyToId: string | null;
        reactions: import("@prisma/client/runtime/library").JsonValue | null;
        tripId: string | null;
        conversationId: string | null;
        senderId: string;
        editedAt: Date | null;
        deletedAt: Date | null;
    }>;
    createDmMessage(conversationId: string, senderId: string, content: string, messageType?: string, mentions?: string[], replyToId?: string): Promise<{
        sender: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        messageType: import("@prisma/client").$Enums.MessageType;
        mentions: string[];
        replyToId: string | null;
        reactions: import("@prisma/client/runtime/library").JsonValue | null;
        tripId: string | null;
        conversationId: string | null;
        senderId: string;
        editedAt: Date | null;
        deletedAt: Date | null;
    }>;
    getTripMessages(tripId: string, limit?: number, before?: Date): Promise<({
        sender: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        replies: ({
            sender: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            content: string;
            messageType: import("@prisma/client").$Enums.MessageType;
            mentions: string[];
            replyToId: string | null;
            reactions: import("@prisma/client/runtime/library").JsonValue | null;
            tripId: string | null;
            conversationId: string | null;
            senderId: string;
            editedAt: Date | null;
            deletedAt: Date | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        content: string;
        messageType: import("@prisma/client").$Enums.MessageType;
        mentions: string[];
        replyToId: string | null;
        reactions: import("@prisma/client/runtime/library").JsonValue | null;
        tripId: string | null;
        conversationId: string | null;
        senderId: string;
        editedAt: Date | null;
        deletedAt: Date | null;
    })[]>;
    getDmMessages(conversationId: string, limit?: number, before?: Date): Promise<({
        sender: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        messageType: import("@prisma/client").$Enums.MessageType;
        mentions: string[];
        replyToId: string | null;
        reactions: import("@prisma/client/runtime/library").JsonValue | null;
        tripId: string | null;
        conversationId: string | null;
        senderId: string;
        editedAt: Date | null;
        deletedAt: Date | null;
    })[]>;
    updateMessage(messageId: string, data: {
        content?: string;
        mentions?: string[];
        reactions?: Record<string, string[]>;
    }): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        messageType: import("@prisma/client").$Enums.MessageType;
        mentions: string[];
        replyToId: string | null;
        reactions: import("@prisma/client/runtime/library").JsonValue | null;
        tripId: string | null;
        conversationId: string | null;
        senderId: string;
        editedAt: Date | null;
        deletedAt: Date | null;
    }>;
    deleteMessage(messageId: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        messageType: import("@prisma/client").$Enums.MessageType;
        mentions: string[];
        replyToId: string | null;
        reactions: import("@prisma/client/runtime/library").JsonValue | null;
        tripId: string | null;
        conversationId: string | null;
        senderId: string;
        editedAt: Date | null;
        deletedAt: Date | null;
    }>;
    addReaction(messageId: string, userId: string, emoji: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        messageType: import("@prisma/client").$Enums.MessageType;
        mentions: string[];
        replyToId: string | null;
        reactions: import("@prisma/client/runtime/library").JsonValue | null;
        tripId: string | null;
        conversationId: string | null;
        senderId: string;
        editedAt: Date | null;
        deletedAt: Date | null;
    }>;
    removeReaction(messageId: string, userId: string, emoji: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        messageType: import("@prisma/client").$Enums.MessageType;
        mentions: string[];
        replyToId: string | null;
        reactions: import("@prisma/client/runtime/library").JsonValue | null;
        tripId: string | null;
        conversationId: string | null;
        senderId: string;
        editedAt: Date | null;
        deletedAt: Date | null;
    }>;
    markAsRead(messageId: string, userId: string): Promise<{
        id: string;
        userId: string;
        messageId: string;
        readAt: Date;
    }>;
}
export declare const messageService: MessageService;
//# sourceMappingURL=message.service.d.ts.map