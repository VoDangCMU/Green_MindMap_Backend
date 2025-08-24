import {
    Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {User} from "@root/entity/user";
import {Questions} from "@root/entity/questions";


export const USER_ANSWERS_TABLE_NAME = 'user_answers';

@Entity(USER_ANSWERS_TABLE_NAME)
export class UserAnswers {
    @PrimaryColumn('uuid', { name: 'user_id' })
    userId!: string;

    @PrimaryColumn('uuid', { name: 'question_id' })
    questionId!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
    user!: User;

    @ManyToOne(() => Questions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'question_id', referencedColumnName: 'id' })
    question!: Questions;

    @Column({ type: 'text' })
    answer!: string;

    @Column({ type: 'timestamp' })
    timestamp!: Date;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;
}