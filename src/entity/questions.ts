import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Template} from "@root/entity/templates";
import {ThreadHall} from "@root/entity/thread_halls";
import {UserAnswers} from "@root/entity/user_answers";

export const QUESTIONS_TABLE_NAME = 'questions';

@Entity()
export class Questions {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Template, {onDelete: 'CASCADE'})
    template!: Template;

    @ManyToOne(() => ThreadHall, {onDelete: 'CASCADE'})
    threadHall!: ThreadHall;

    @Column({type: 'text'})
    question!: string;

    @Column({type: "bigint"})
    trait!: number;

    @Column({type: "text"})
    placeholders!: string;

    @Column({type: "text"})
    expected_answer!: string;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;

    @OneToMany(() => UserAnswers, userAnswers => userAnswers.question)
    userAnswers!: UserAnswers[];
}