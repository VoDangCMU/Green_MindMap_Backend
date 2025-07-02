"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const NUMBER = zod_1.z.union([zod_1.z.number(), zod_1.z.string().regex(/^\d+$/)]).transform(Number);
exports.default = NUMBER;
