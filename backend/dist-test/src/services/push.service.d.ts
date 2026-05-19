export declare const pushService: {
    subscribe(userId: string, subscription: {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    }): Promise<void>;
    unsubscribe(userId: string): Promise<void>;
    sendPush(userId: string, notification: {
        title: string;
        body: string;
        data?: Record<string, unknown>;
    }): Promise<void>;
};
//# sourceMappingURL=push.service.d.ts.map