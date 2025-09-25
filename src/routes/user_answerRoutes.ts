import {Router} from "express";
import user_answerController from "@root/controller/user_answerController";

const router = Router();

router.post("/user_answer/create", user_answerController.createUserAnswer);
router.get("/user_answer/getById", user_answerController.getUserAnswerById);
router.put("/user_answer/update/:id", user_answerController.updateUserAnswerById);
router.delete("/user_answer/delete/:id", user_answerController.deleteUserAnswerById);

export default router;
