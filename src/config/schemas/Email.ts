import {z} from "zod";

const EMAIL = z.string().email();

export default EMAIL;