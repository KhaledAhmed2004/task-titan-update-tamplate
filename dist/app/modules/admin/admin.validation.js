"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminValidation = void 0;
const zod_1 = require("zod");
const getDashboardStatsSchema = zod_1.z.object({
    query: zod_1.z.object({}).optional(),
});
exports.AdminValidation = {
    getDashboardStatsSchema,
};
