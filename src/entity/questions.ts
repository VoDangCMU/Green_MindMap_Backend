import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Template} from "./templates";
import {UserAnswers} from "./user_answers";
import {QuestionOptions} from "./question_options";
import {Models} from "./models";
import {User} from "./user";

export const QUESTIONS_TABLE_NAME = 'questions';

@Entity(QUESTIONS_TABLE_NAME)
export class Questions {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Template, {onDelete: 'CASCADE'})
    template!: Template;

    @Column({type: 'text'})
    question!: string;

    @Column({type: 'text', nullable: true})
    templateId?: string;

    @Column({type: 'text', nullable: true})
    behaviorInput?: string;

    @Column({type: 'text', nullable: true})
    behaviorNormalized?: string;

    @Column({type: 'decimal', precision: 5, scale: 2, nullable: true})
    normalizeScore?: number;

    @Column({type: 'varchar', nullable: true})
    trait?: string;

    @ManyToOne(() => Models, {nullable: true})
    model?: Models;

    @ManyToOne(() => User, {nullable: true})
    owner?: User;

    @Column({type: 'text', nullable: true})
    ownerId?: string;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;


    @OneToMany(() => UserAnswers, userAnswers => userAnswers.question)
    userAnswers?: UserAnswers[];

    @OneToMany(() => QuestionOptions, questionOptions => questionOptions.question)
    questionOptions?: QuestionOptions[];

}