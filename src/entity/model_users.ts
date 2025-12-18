import {
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Models} from "./models";
import {User} from "./user";

export const MODEL_USERS_TABLE_NAME = 'model_users';

@Entity(MODEL_USERS_TABLE_NAME)
export class ModelUser {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Models, {nullable: false, onDelete: 'CASCADE'})
    @JoinColumn({name: 'model_id'})
    model!: Models;

    @ManyToOne(() => User, {nullable: false, onDelete: 'CASCADE'})
    @JoinColumn({name: 'user_id'})
    user!: User;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;
}

