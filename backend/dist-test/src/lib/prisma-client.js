"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrisma = getPrisma;
exports.setPrisma = setPrisma;
exports.resetPrisma = resetPrisma;
const client_1 = require("@prisma/client");
let prismaInstance = null;
function getPrisma() {
    if (!prismaInstance) {
        prismaInstance = new client_1.PrismaClient();
    }
    return prismaInstance;
}
function setPrisma(client) {
    prismaInstance = client;
}
function resetPrisma() {
    prismaInstance = null;
}
//# sourceMappingURL=prisma-client.js.map