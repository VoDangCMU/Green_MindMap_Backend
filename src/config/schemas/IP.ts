import {z} from "zod";

const IP = z.string().ip();

export default IP;