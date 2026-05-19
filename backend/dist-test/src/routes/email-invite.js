"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.post('/invites/email', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email, message } = req.body;
        if (!email) {
            res.status(400).json({ error: 'email is required' });
            return;
        }
        res.json({
            data: {
                success: true,
                stubMessage: 'Email invite stub - not implemented',
                email,
                userId,
                customMessage: message || null,
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=email-invite.js.map