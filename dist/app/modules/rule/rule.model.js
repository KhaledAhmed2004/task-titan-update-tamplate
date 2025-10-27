"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rule = void 0;
const mongoose_1 = require("mongoose");
const ruleSchema = new mongoose_1.Schema({
    content: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['privacy', 'terms', 'about'],
        select: 0,
    },
});
exports.Rule = (0, mongoose_1.model)('Rule', ruleSchema);
