import {Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {FoodItems} from "@root/entity/food_items";

export const CALORIES_TABLE_NAME = 'calories';

@Entity(CALORIES_TABLE_NAME)
export class Calories {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @OneToMany(() => FoodItems, foodItems => foodItems.calories)
    foodItems!: FoodItems[];

    @Column({type: 'double precision'})
    energy_kcal!: number;

    @Column({type: 'double precision'})
    protein_g!: number;

    @Column({type: "double precision"})
    fat_g!: number;

    @Column({type: "double precision"})
    carbs_g!: number;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;
}