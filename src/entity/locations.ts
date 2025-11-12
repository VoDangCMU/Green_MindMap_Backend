import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    JoinColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {User} from "./user";
import {SurveyScenario} from "../entity/survey_scenario";

export const LOCATIONS_TABLE_NAME = 'locations';

@Entity(LOCATIONS_TABLE_NAME)
export class Locations {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => User, {onDelete: 'CASCADE'})
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({type: 'uuid', name: 'user_id'})
    userId!: string;

    @Column({type: 'double precision'})
    latitude!: number;

    @Column({type: 'double precision'})
    longitude!: number;

    @Column({type: 'text', nullable: true})
    address?: string;

    @Column({type: 'double precision', nullable: true, name: 'length_to_previous_location'})
    lengthToPreviousLocation?: number;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;

    @OneToMany(() => SurveyScenario, surveyScenario => surveyScenario.location)
    surveyScenarios!: SurveyScenario[];
}