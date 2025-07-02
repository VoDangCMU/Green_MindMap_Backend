import {z} from "zod";

const DATE_TIME = z.union([z.date(), z.string()]).transform(Date);

export default DATE_TIME;