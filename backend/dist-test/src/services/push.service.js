"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushService = void 0;
const web_push_1 = __importDefault(require("web-push"));
const prisma_client_1 = require("@/lib/prisma-client");
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT;
web_push_1.default.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
exports.pushService = {
    async subscribe(userId, subscription) {
        const prisma = (0, prisma_client_1.getPrisma)();
        await prisma.pushSubscription.upsert({
            where: { userId },
            create: {
                userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            },
            update: {
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            },
        });
    },
    async unsubscribe(userId) {
        const prisma = (0, prisma_client_1.getPrisma)();
        await prisma.pushSubscription.deleteMany({ where: { userId } });
    },
    async sendPush(userId, notification) {
        const prisma = (0, prisma_client_1.getPrisma)();
        const sub = await prisma.pushSubscription.findUnique({ where: { userId } });
        if (!sub)
            return;
        try {
            await web_push_1.default.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(notification));
        }
        catch (err) {
            const error = err;
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                // Subscription expired or unreachable, clean it up
                await prisma.pushSubscription.delete({ where: { userId } });
            }
        }
    },
};
//# sourceMappingURL=push.service.js.map