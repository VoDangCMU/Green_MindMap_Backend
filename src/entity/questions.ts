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
import {ThreadHall} from "./thread_halls";
import {UserAnswers} from "./user_answers";
import {QuestionOptions} from "./question_options";

export const QUESTIONS_TABLE_NAME = 'questions';

@Entity()
export class Questions {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Template, {onDelete: 'CASCADE'})
    template!: Template;

    @Column({type: 'text'})
    question!: string;

    // Additional fields for complex template processing
    @Column({type: 'text', nullable: true})
    templateId?: string; // External template ID from request

    @Column({type: 'text', nullable: true})
    behaviorInput?: string;

    @Column({type: 'text', nullable: true})
    behaviorNormalized?: string;

    @Column({type: 'decimal', precision: 5, scale: 2, nullable: true})
    normalizeScore?: number;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;

    @ManyToOne(() => ThreadHall, {onDelete: 'CASCADE'})
    threadHall!: ThreadHall;

    @OneToMany(() => UserAnswers, userAnswers => userAnswers.question)
    userAnswers?: UserAnswers[];

    @OneToMany(() => QuestionOptions, questionOptions => questionOptions.question)
    questionOptions?: QuestionOptions[];
}