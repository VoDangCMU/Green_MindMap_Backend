import {
        Column,
        CreateDateColumn,
        Entity,
        JoinColumn,
        ManyToOne,
        PrimaryGeneratedColumn, UpdateDateColumn
    } from "typeorm";
    import { User } from "./user";
    import { BigFive } from "./big_five";

    const AVG_DAILY_SPEND_TABLE_NAME = 'avg_daily_spend';

    @Entity(AVG_DAILY_SPEND_TABLE_NAME)
    export class AvgDailySpend {
        @PrimaryGeneratedColumn("uuid")
        id!: string;

        @ManyToOne(() => User)
        @JoinColumn({ name: "userId" })
        user!: User;


        @Column({ type: "double precision" })
        total_spend!: number;

        @Column({ type: "date" })
        day_spend!: Date;
    }