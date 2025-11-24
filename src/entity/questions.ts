import {
    Column,
    CreateDateColumn,
    Entity, ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Template} from "./templates";
import {ThreadHall} from "./thread_halls";
import {UserAnswers} from "./user_answers";
import {QuestionOptions} from "./question_options";
import {SurveyScenario} from "../entity/survey_scenario";
import {Models} from "./models";

export const QUESTIONS_TABLE_NAME = 'questions';

@Entity()
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

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;

    @ManyToOne(() => ThreadHall, {onDelete: 'CASCADE'})
    threadHall!: ThreadHall;

    @ManyToMany(() => SurveyScenario, (s) => s.questions)
    scenarios!: SurveyScenario[];

    @OneToMany(() => UserAnswers, userAnswers => userAnswers.question)
    userAnswers?: UserAnswers[];

    @OneToMany(() => QuestionOptions, questionOptions => questionOptions.question)
    questionOptions?: QuestionOptions[];

}