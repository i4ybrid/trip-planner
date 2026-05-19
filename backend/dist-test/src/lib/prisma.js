"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.resetPrisma = exports.setPrisma = exports.getPrisma = void 0;
const prisma_client_1 = require("./prisma-client");
Object.defineProperty(exports, "getPrisma", { enumerable: true, get: function () { return prisma_client_1.getPrisma; } });
Object.defineProperty(exports, "setPrisma", { enumerable: true, get: function () { return prisma_client_1.setPrisma; } });
Object.defineProperty(exports, "resetPrisma", { enumerable: true, get: function () { return prisma_client_1.resetPrisma; } });
// Default export — calls getPrisma() at access time so setPrisma() takes effect
const prismaClient = (0, prisma_client_1.getPrisma)();
exports.prisma = prismaClient;
exports.default = prismaClient;
//# sourceMappingURL=prisma.js.map