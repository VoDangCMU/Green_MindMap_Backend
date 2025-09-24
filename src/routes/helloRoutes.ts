import { Router } from "express";
import controller from "@root/controller";

const router = Router();

router.get("/hello", controller.hello.sayHello);

export default router;