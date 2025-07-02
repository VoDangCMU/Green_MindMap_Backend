"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const DATE_TIME = zod_1.z.union([zod_1.z.date(), zod_1.z.string()]).transform(Date);
exports.default = DATE_TIME;
