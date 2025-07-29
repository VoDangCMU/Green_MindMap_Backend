import { Router} from "express";
import controller from "@root/controller";

const tokenRouter = Router();

tokenRouter.get("/token/access-token", controller.token.GetNewToken);

export default tokenRouter;