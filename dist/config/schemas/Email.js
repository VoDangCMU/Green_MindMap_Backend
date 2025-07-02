"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const EMAIL = zod_1.z.string().email();
exports.default = EMAIL;
