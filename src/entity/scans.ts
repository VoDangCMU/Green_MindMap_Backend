import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {FoodItems} from "@root/entity/food_items";
import {User} from "@root/entity/user";
import {Invoices} from "@root/entity/invoices";


export const SCANS_TABLE_NAME = 'scans';

@Entity(SCANS_TABLE_NAME)
export class Scans {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => FoodItems, foodItems => foodItems.scans)
    foodItems!: FoodItems;

    @ManyToOne(() => User, user => user.scans)
    user!: User;

    @Column({type: 'timestamp'})
    scan_time!: Date;

    @OneToMany(() => Invoices, invoices => invoices.scans)
    invoices!: Invoices[];

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;
}