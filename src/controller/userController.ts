import { Request, Response, RequestHandler } from "express";
import repository from "@root/repository";

export class UserController {
    public LoginWithEmail: RequestHandler = async (req: Request, res: Response) => {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required" });
            return;
        }

        const user = await repository.user.findByEmailAndPassword(email, password);
        if (!user) {
            res.status(400).json({ message: "Invalid email or password" });
            return;
        }

        res.status(200).json({ message: "Login successful", user });
    };
}

export default new UserController();