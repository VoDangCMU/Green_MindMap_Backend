import { Router} from "express";
import controller from "@root/controller";

const userRouter = Router();

userRouter.post("/user/login/email-pass", controller.user.LoginWithEmail);

export default userRouter;