import {z} from "zod";

const Boolean = z.union([z.string(), z.boolean()]).optional().default(false)

export default Boolean;