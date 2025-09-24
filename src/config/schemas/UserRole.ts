import z  from "zod";
import USER_ROLE from "../schemas/CONST/USER_ROLE";

const USER_ROLE_TYPE = z.enum(USER_ROLE);

export default USER_ROLE_TYPE;