"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const invite_code_service_1 = require("@/services/invite-code.service");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get('/invite-codes', async (req, res) => {
    try {
        const userId = req.user.userId;
        const codes = await invite_code_service_1.inviteCodeService.getInviteCodes(userId);
        res.json({ data: codes });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/invite-codes', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { daysUntilExpiry } = req.body;
        const code = await invite_code_service_1.inviteCodeService.generateInviteCode(userId, daysUntilExpiry ? parseInt(daysUntilExpiry) : 7);
        res.status(201).json({ data: code });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post('/invite-codes/:code/use', async (req, res) => {
    try {
        const userId = req.user.userId;
        const code = req.params.code;
        const result = await invite_code_service_1.inviteCodeService.useInviteCode(code, userId);
        res.json({ data: result });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.delete('/invite-codes/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const codeId = req.params.id;
        await invite_code_service_1.inviteCodeService.revokeInviteCode(codeId, userId);
        res.json({ message: 'Invite code revoked successfully' });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=invite-codes.js.map