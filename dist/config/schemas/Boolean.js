"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const Boolean = zod_1.z.union([zod_1.z.string(), zod_1.z.boolean()]).optional().default(false);
exports.default = Boolean;
