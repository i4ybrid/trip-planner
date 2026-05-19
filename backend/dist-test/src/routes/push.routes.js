"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const push_service_1 = require("../services/push.service");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.post('/push/subscribe', async (req, res) => {
    try {
        const { subscription } = req.body;
        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            res.status(400).json({ error: 'Invalid subscription shape' });
            return;
        }
        await push_service_1.pushService.subscribe(req.user.userId, subscription);
        res.json({ ok: true });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
});
router.delete('/push/unsubscribe', async (req, res) => {
    try {
        await push_service_1.pushService.unsubscribe(req.user.userId);
        res.json({ ok: true });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
});
exports.default = router;
//# sourceMappingURL=push.routes.js.map