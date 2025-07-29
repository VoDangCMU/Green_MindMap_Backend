import { Repository } from "typeorm";
import { AppDataSource } from "../infrastructure/database";
import { Token } from "../entity/token";

export class TokenRepository {
    private repository: Repository<Token>;

    constructor() {
        this.repository = AppDataSource.getRepository(Token);
    }

    public async findAll(): Promise<Token[]> {
        return await this.repository.find();
    }

    public async findById(id: string): Promise<Token | null> {
        return await this.repository.findOne({ where: { id } });
    }

    public async findByToken(token: string): Promise<Token | null> {
        return await this.repository.findOne({ where: { token } });
    }

    public async create(tokenData: Partial<Token>): Promise<Token> {
        const token = this.repository.create(tokenData);
        return await this.repository.save(token);
    }

    public async update(id: string, tokenData: Partial<Token>): Promise<Token | null> {
        await this.repository.update(id, tokenData);
        return await this.findById(id);
    }

    public async delete(id: string): Promise<boolean> {
        const result = await this.repository.delete(id);
        return result.affected! > 0;
    }
}