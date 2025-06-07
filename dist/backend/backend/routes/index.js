"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAPIRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("./auth");
const users_1 = require("./users");
const ai_1 = require("./ai");
const discovery_1 = require("./discovery");
const blockchain_1 = require("./blockchain");
const createAPIRoutes = () => {
    const router = (0, express_1.Router)();
    // Mount route modules
    router.use('/auth', auth_1.authRoutes);
    router.use('/users', users_1.userRoutes);
    router.use('/ai', ai_1.aiRoutes);
    router.use('/discovery', discovery_1.discoveryRoutes);
    router.use('/blockchain', blockchain_1.blockchainRoutes);
    return router;
};
exports.createAPIRoutes = createAPIRoutes;
exports.default = exports.createAPIRoutes;
//# sourceMappingURL=index.js.map