"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const blocked_user_service_1 = require("@/services/blocked-user.service");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get('/blocked', async (req, res) => {
    try {
        const userId = req.user.userId;
        const blocked = await blocked_user_service_1.blockedUserService.getBlockedUsers(userId);
        res.json({ data: blocked });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/blocked', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { blockedId } = req.body;
        if (!blockedId) {
            res.status(400).json({ error: 'blockedId is required' });
            return;
        }
        const result = await blocked_user_service_1.blockedUserService.blockUser(userId, blockedId);
        res.status(201).json({ data: result });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.delete('/blocked/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const blockedId = req.params.id;
        await blocked_user_service_1.blockedUserService.unblockUser(userId, blockedId);
        res.json({ message: 'User unblocked successfully' });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=blocked.js.map