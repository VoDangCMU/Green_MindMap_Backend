import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {ScenarioAssignment} from "../entity/scenario_assignments";
import {SimulatedSurvey} from "../entity/simulated_survey";
import {QuestionSets} from "../entity/question_sets";
import {User} from "../entity/user";

export const SURVEY_SCENARIOS_TABLE_NAME = 'survey_scenarios';

@Entity(SURVEY_SCENARIOS_TABLE_NAME)
export class SurveyScenario {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type: "int", name: "min_age"})
    minAge!: number;

    @Column({type: "int", name: "max_age"})
    maxAge!: number;

    @OneToOne(() => SimulatedSurvey, (simulatedSurvey) => simulatedSurvey.scenario, {
        cascade: true,
    })
    simulatedSurvey!: SimulatedSurvey;

    @ManyToOne(() => User, {onDelete: "CASCADE", onUpdate: "CASCADE"})
    user!: User;

    @Column({type: "simple-json", nullable: true, default: []})
    location!: string[];

    @ManyToOne(() => QuestionSets, {onDelete: "CASCADE", onUpdate: "CASCADE"})
    questionSet!: QuestionSets;

    @Column({type: "int", default: 100})
    percentage!: number;

    @Column({type: "text", nullable: true})
    gender!: string;

    @Column({type: "text", default: "draft"})
    status!: string

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @OneToMany(() => ScenarioAssignment, (assignment) => assignment.scenario)
    assignments!: ScenarioAssignment[];

}