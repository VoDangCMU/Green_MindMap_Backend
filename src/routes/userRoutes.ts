import { Router } from "express";
import userController from "../controller/userController";
import {jwtAuthMiddleware} from "../middlewares/jwtMiddleware";

const router = Router();

router.post("/auth/login/email", userController.LoginWithEmail);
router.post("/auth/register/email", userController.RegisterWithEmail);

router.post("/auth/login/google", userController.LoginWithGoogle);

router.get("/profile", jwtAuthMiddleware, userController.GetProfile);
router.post('/auth/logout',jwtAuthMiddleware, userController.Logout);
export default router;
