import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Calories} from "./calories";
import {Scans} from "./scans";

export const FOOD_ITEMS_TABLE_NAME = 'food_items';

@Entity(FOOD_ITEMS_TABLE_NAME)
export class FoodItems {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Calories, calories => calories.foodItems)
    calories!: Calories;

    @Column({type: 'text'})
    name!: string;

    @Column({type: 'text'})
    barcode!: string;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;

    @OneToMany(() => Scans, scans => scans.foodItems)
    scans!: Scans[];

}