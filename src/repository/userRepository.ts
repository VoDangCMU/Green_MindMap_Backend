import { Repository } from "typeorm";
import { AppDataSource } from "../infrastructure/database";
import { User } from "../entity/user";

export class UserRepository {
    private repository: Repository<User>;

    constructor() {
        this.repository = AppDataSource.getRepository(User);
    }

    public async findAll(): Promise<User[]> {
        return await this.repository.find();
    }

    public async findById(id: string): Promise<User | null> {
        return await this.repository.findOne({ where: { id } });
    }

    public async findByEmail(email: string): Promise<User | null> {
        return await this.repository.findOne({ where: { email } });
    }

    public async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
        return await this.repository.findOne({ where: { phoneNumber } });
    }

    public async create(userData: Partial<User>): Promise<User> {
        const user = this.repository.create(userData);
        return await this.repository.save(user);
    }

    public async update(id: string, userData: Partial<User>): Promise<User | null> {
        await this.repository.update(id, userData);
        return await this.findById(id);
    }

    public async delete(id: string): Promise<boolean> {
        const result = await this.repository.delete(id);
        return result.affected! > 0;
    }

    public async exists(id: string): Promise<boolean> {
        const count = await this.repository.count({ where: { id } });
        return count > 0;
    }

    public async existsByEmail(email: string): Promise<boolean> {
        const count = await this.repository.count({ where: { email } });
        return count > 0;
    }

    public async findByEmailAndPassword(email: string, password: string): Promise<User | null> {
        return await this.repository.findOne({
            where: { email, password },
        });
    }

    public async findByPhoneAndPassword(email: string, phoneNumber: string): Promise<User | null> {
        return await this.repository.findOne({
            where: { email, phoneNumber },
        });
    }
}

export default new UserRepository();
