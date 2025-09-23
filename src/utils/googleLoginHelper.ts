import axios from 'axios';
import { JWTHelper } from '@root/utils/jwtHelper';
import { getLogger } from '@root/infrastructure/logger';
import AppDataSource from '@root/infrastructure/database';
import { User } from '@root/entity/user';
import { Token } from '@root/entity/token';
import { UsernameHelper } from '@root/utils/usernameHelper';

export interface GoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
}

export interface LoginResult {
    user: any;
    accessToken: string;
    refreshToken: string;
}

export class GoogleLoginHelper {
    private static readonly GOOGLE_API_URL = 'https://www.googleapis.com/oauth2/v1/userinfo';
    private static logger = getLogger();

    public static async verifyGoogleToken(accessToken: string): Promise<GoogleUserInfo> {
        try {
            const response = await axios.get(this.GOOGLE_API_URL, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            if (response.status !== 200) {
                throw new Error('Invalid Google access token');
            }

            return response.data as GoogleUserInfo;
        } catch (error) {
            this.logger.error('Google token verification failed', error as Error);
            throw new Error('Failed to verify Google token');
        }
    }

    /**
     * Tạo hoặc cập nhật user từ thông tin Google
     */
    public static async createOrUpdateUser(googleUserInfo: GoogleUserInfo): Promise<User> {
        try {
            const userRepository = AppDataSource.getRepository(User);

            // Tìm user theo email
            let user = await userRepository.findOne({
                where: { email: googleUserInfo.email }
            });

            if (user) {
                // Cập nhật thông tin user nếu đã tồn tại
                user.fullName = googleUserInfo.name;
                user.updatedAt = new Date();
                user = await userRepository.save(user);

                this.logger.info('User updated from Google login', {
                    userId: user.id,
                    email: user.email
                });
            } else {
                // Generate unique username from Google name
                const username = await UsernameHelper.generateUniqueUsername(googleUserInfo.name);

                // Tạo user mới nếu chưa tồn tại
                user = userRepository.create({
                    email: googleUserInfo.email,
                    username: username,
                    fullName: googleUserInfo.name,
                    password: '', // Google login không cần password
                    role: 'user', // Default role
                    dateOfBirth: new Date(), // Default value
                });

                user = await userRepository.save(user);

                this.logger.info('New user created from Google login', {
                    userId: user.id,
                    username: user.username,
                    email: user.email
                });
            }

            return user;
        } catch (error) {
            this.logger.error('Failed to create or update user from Google', error as Error);
            throw new Error('Failed to process user data');
        }
    }

    /**
     * Xử lý toàn bộ flow đăng nhập Google
     */
    public static async handleGoogleLogin(googleAccessToken: string, deviceId?: string): Promise<LoginResult> {
        try {
            // 1. Xác thực Google token và lấy thông tin user
            const googleUserInfo = await this.verifyGoogleToken(googleAccessToken);

            // 2. Tạo hoặc cập nhật user trong database
            const user = await this.createOrUpdateUser(googleUserInfo);

            // 3. Tạo JWT tokens
            const payload = {
                userId: user.id,
                role: user.role
            };

            const tokenPair = JWTHelper.createTokenPair(payload);

            // 4. Lưu refresh token vào database sử dụng TypeORM repository
            const tokenRepository = AppDataSource.getRepository(Token);

            // Tạo expiration date - 7 days from now (more explicit approach)
            const now = new Date();
            const expiredAt = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days in milliseconds

            // Log the expiration date to debug
            this.logger.info('Creating refresh token', {
                userId: user.id,
                expiredAt: expiredAt.toISOString(),
                expiredAtTime: expiredAt.getTime()
            });

            const refreshTokenEntity = new Token();
            refreshTokenEntity.token = tokenPair.refreshToken;
            refreshTokenEntity.deviceID = deviceId || undefined;
            refreshTokenEntity.expiredAt = expiredAt;
            refreshTokenEntity.userId = user.id;

            await tokenRepository.save(refreshTokenEntity);

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role
                },
                accessToken: tokenPair.accessToken,
                refreshToken: tokenPair.refreshToken
            };
        } catch (error) {
            this.logger.error('Google login process failed', error as Error);
            throw error;
        }
    }
}
