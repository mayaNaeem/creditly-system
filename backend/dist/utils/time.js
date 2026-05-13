"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utcPlusMs = exports.utcNow = void 0;
const utcNow = () => new Date();
exports.utcNow = utcNow;
const utcPlusMs = (base, deltaMs) => new Date(base.getTime() + deltaMs);
exports.utcPlusMs = utcPlusMs;
