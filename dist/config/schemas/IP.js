"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const IP = zod_1.z.string().ip();
exports.default = IP;
