import { Request, Response, RequestHandler } from "express";
import bcrypt from "bcrypt";
import AppDataSource from "../infrastructure/database";
import { User } from "../entity/user";
import { Token } from "../entity/token";
import { Locations } from "../entity/locations";
import { JWTHelper } from "../utils/jwtHelper";
import { GoogleLoginHelper } from "../utils/googleLoginHelper";
import { BitmapHelper } from "../utils/bitmapHelper";
import { getLogger } from "../infrastructure/logger";
import { UsernameHelper } from "../utils/usernameHelper";
class UserController {
    public RegisterWithEmail: RequestHandler = async (req: Request, res: Response) => {
        const logger = getLogger();
        const startTime = Date.now();
        const { email, password, confirm_password, full_name, date_of_birth, location } = req.body;

        logger.info("User registration attempt", {
            email: email?.substring(0, 3) + "***",
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        if (!email || !password || !full_name || !date_of_birth || !location) {
            logger.warn("Registration failed - missing required fields", {
                email: email ? "provided" : "missing",
                password: password ? "provided" : "missing",
                fullName: full_name ? "provided" : "missing",
                dateOfBirth: date_of_birth ? "provided" : "missing",
                location: location ? "provided" : "missing"
            });
            res.status(400).json({
                message: "Email, password, full name, date of birth, and location are required"
            });
            return;
        }

        try {
            const userRepository = AppDataSource.getRepository(User);

            // Check if user already exists
            const existingUser = await userRepository.findOne({
                where: { email }
            });

            if (existingUser) {
                logger.warn("Registration failed - email already exists", {
                    email: email?.substring(0, 3) + "***"
                });
                res.status(400).json({ message: "Email already exists" });
                return;
            }

            const username = await UsernameHelper.generateUniqueUsername(full_name);

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Parse date of birth
            const parsedDateOfBirth = new Date(date_of_birth);
            if (isNaN(parsedDateOfBirth.getTime())) {
                logger.warn("Registration failed - invalid date of birth", {
                    email: email?.substring(0, 3) + "***",
                    dateOfBirth: date_of_birth
                });
                res.status(400).json({ message: "Invalid date of birth format" });
                return;
            }

            const newUser = userRepository.create({
                email,
                password: hashedPassword,
                fullName: full_name,
                username,
                dateOfBirth: parsedDateOfBirth,
                location: location,
                role: 'user'
            });

            const savedUser = await userRepository.save(newUser);

            const payload = {
                userId: savedUser.id,
                role: savedUser.role
            };

            const tokenPair = JWTHelper.createTokenPair(payload);

            res.cookie('access_token', tokenPair.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 // 1 day
            });
            res.cookie('refresh_token', tokenPair.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
            });

            const duration = Date.now() - startTime;
            logger.info("User registration successful", {
                userId: savedUser.id,
                email: email?.substring(0, 3) + "***",
                duration
            });

            res.status(200).json({
                message: "Register successful",
                user: {
                    id: savedUser.id,
                    username: savedUser.username,
                    email: savedUser.email,
                    fullName: savedUser.fullName,
                    dateOfBirth: savedUser.dateOfBirth,
                    location: savedUser.location,
                    role: savedUser.role
                },
                access_token: tokenPair.accessToken,
                refresh_token: tokenPair.refreshToken
            });
            return;
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error("Register error", error as Error, {
                email: email?.substring(0, 3) + "***",
                duration
            });
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public LoginWithEmail: RequestHandler = async (req: Request, res: Response) => {
        const logger = getLogger();
        const startTime = Date.now();
        const { email, password } = req.body;

        logger.info("User login attempt", {
            email: email?.substring(0, 3) + "***",
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        if (!email || !password) {
            logger.warn("Login failed - missing credentials", {
                email: email ? "provided" : "missing",
                password: password ? "provided" : "missing"
            });
            return res.status(400).json({ message: "Email and password are required" });
        }

        try {
            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOne({
                where: { email },
                select: ['id', 'email', 'username', 'password', 'role', 'fullName', 'location', 'dateOfBirth']
            });

            const duration = Date.now() - startTime;

            // ✅ Check user existence and password presence first
            if (!user || !user.password) {
                logger.warn("Login failed - invalid credentials", {
                    email: email?.substring(0, 3) + "***",
                    duration
                });
                return res.status(400).json({ message: "Invalid email or password" });
            }

            // ✅ Compare password safely
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                logger.warn("Login failed - invalid credentials", {
                    email: email?.substring(0, 3) + "***",
                    duration
                });
                return res.status(400).json({ message: "Invalid email or password" });
            }

            // Calculate age from dateOfBirth
            let age = null;
            if (user.dateOfBirth) {
                const today = new Date();
                const birthDate = new Date(user.dateOfBirth);
                age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
            }

            const payload = {
                userId: user.id,
                role: user.role
            };

            const tokenPair = JWTHelper.createTokenPair(payload);

            res.cookie('access_token', tokenPair.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24
            });
            res.cookie('refresh_token', tokenPair.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 7
            });

            logger.info("User login successful", {
                userId: user.id,
                email: email?.substring(0, 3) + "***",
                duration
            });

            return res.status(200).json({
                message: "Login successful",
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    location: user.location,
                    age: age
                },
                access_token: tokenPair.accessToken,
                refresh_token: tokenPair.refreshToken
            });

        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error("Login error", error as Error, {
                email: email?.substring(0, 3) + "***",
                duration
            });
            return res.status(500).json({ message: "Internal server error" });
        }
    };

    public LoginWithGoogle: RequestHandler = async (req: Request, res: Response) => {
        const logger = getLogger();
        const startTime = Date.now();
        const { token, device_id } = req.body;

        logger.info("User Google login attempt", {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            deviceId: device_id || 'unknown'
        });

        if (!token) {
            logger.warn("Google login failed - missing token");
            res.status(400).json({ message: "Google token is required" });
            return;
        }

        try {
            const result = await GoogleLoginHelper.handleGoogleLogin(token, device_id);
            const duration = Date.now() - startTime;

            // Set tokens in cookies
            res.cookie('access_token', result.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 // 1 day
            });
            res.cookie('refresh_token', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
            });

            logger.info("Google login successful", {
                userId: result.user.id,
                email: result.user.email?.substring(0, 3) + "***",
                duration
            });

            res.status(200).json({
                message: "Google login successful",
                user: result.user,
                access_token: result.accessToken,
                refresh_token: result.refreshToken
            });
            return;

        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error("Google login error", error as Error, {
                duration
            });

            if ((error as Error).message.includes('verify Google token')) {
                res.status(401).json({ message: "Invalid Google token" });
            } else if ((error as Error).message.includes('process user data')) {
                res.status(500).json({ message: "Failed to process user data" });
            } else {
                res.status(500).json({ message: "Internal server error" });
            }
            return;
        }
    }

    public GetProfile: RequestHandler = async (req: Request, res: Response) => {
        const logger = getLogger();
        const startTime = Date.now();

        if (!req.user || !req.user.userId) {
            logger.warn("GetProfile failed - missing user in request");
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        try {
            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOne({
                where: { id: req.user.userId }
            });

            const duration = Date.now() - startTime;

            if (!user) {
                logger.warn("GetProfile failed - user not found", {
                    userId: req.user.userId,
                    duration
                });
                res.status(404).json({ message: "User not found" });
                return;
            }

            // Calculate age from dateOfBirth
            let age = null;
            if (user.dateOfBirth) {
                const today = new Date();
                const birthDate = new Date(user.dateOfBirth);
                age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
            }

            logger.info("GetProfile successful", {
                userId: user.id,
                duration
            });

            res.status(200).json({
                id: user.id,
                username: user.username,
                email: user.email,
                phone_number: user.phoneNumber,
                full_name: user.fullName,
                gender: user.gender,
                role: user.role,
                date_of_birth: user.dateOfBirth,
                age: age,
                location: user.location,
                created_at: user.createdAt,
                updated_at: user.updatedAt
            });
            return;

        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error("GetProfile error", error as Error, {
                userId: req.user.userId,
                duration
            });
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public Logout: RequestHandler = async (req: Request, res: Response) => {
        const logger = getLogger();
        const startTime = Date.now();

        if (!req.user || !req.user.userId) {
            logger.warn("Logout failed - missing user in request");
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        try {
            // Lấy token từ cookie hoặc header
            let token = req.cookies?.access_token;
            if (!token) {
                const authHeader = req.headers.authorization;
                if (authHeader && authHeader.startsWith("Bearer ")) {
                    token = authHeader.split(" ")[1];
                }
            }

            if (token) {
                // Xóa token khỏi database
                const tokenRepository = AppDataSource.getRepository(Token);
                await tokenRepository.delete({ token });

                // Thêm token vào blacklist với TTL 7 ngày
                await BitmapHelper.blacklistToken(token, 7 * 24 * 60 * 60 * 1000);

                logger.info("Token removed from database and blacklisted", {
                    userId: req.user.userId,
                    tokenLength: token.length
                });
            }

            // Clear cookies
            res.clearCookie('access_token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            res.clearCookie('refresh_token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            const duration = Date.now() - startTime;
            logger.info("User logout successful", {
                userId: req.user.userId,
                duration
            });

            res.status(200).json({ message: "Logout successful" });
            return;

        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error("Logout error", error as Error, {
                userId: req.user.userId,
                duration
            });
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }
}

export default new UserController();
