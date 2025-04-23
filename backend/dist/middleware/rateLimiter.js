"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = __importDefault(require("../config/config"));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.default.rateLimiting.windowMs,
    max: config_1.default.rateLimiting.max,
    message: {
        error: 'Demasiadas solicitudes, por favor intente más tarde'
    }
});
exports.default = limiter;
//# sourceMappingURL=rateLimiter.js.map