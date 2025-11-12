import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {User} from "./user";

export const HEALTHY_FOOD_RATIO_TABLE_NAME = 'healthy_food_ratio'

@Entity(HEALTHY_FOOD_RATIO_TABLE_NAME)
export class HealthyFoodRatio {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type: "uuid"})
    userId!: string;

    @Column({type: "integer"})
    plantMeals!: number;

    @Column({type: "integer"})
    totalMeals!: number;

    @Column({type: "integer", default: 4})
    baseLikert!: number;

    @Column({type: "double precision", default: 0.25})
    weight!: number;

    @Column({type: "varchar", length: 10, default: "up"})
    direction!: string;

    @Column({type: "double precision", default: 1.0})
    sigmaR!: number;

    @Column({type: "double precision", default: 0.5})
    alpha!: number;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: "userId" })
    user!: User;
}

