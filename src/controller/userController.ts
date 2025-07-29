import { Request, Response } from "express";
import repository from "@root/repository";

export class UserController {

    public LoginWithEmail = async (req: Request, res: Response) => {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await repository.user.findByEmailAndPassword(email, password);
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        return res.status(200).json({ message: "Login successful", user });
    };
}

export default new UserController();