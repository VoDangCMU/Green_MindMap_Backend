import {z} from "zod";

const NUMBER = z.union([z.number(), z.string().regex(/^\d+$/)]).transform(Number);

export default NUMBER