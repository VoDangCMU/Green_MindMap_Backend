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
        totalDaily!: number;

        @Column({ type: "double precision" })
        baseAvg!: number;

        @Column({ type: "double precision" })
        weight!: number;

        @Column({ type: "double precision" })
        sigma_r!: number;

        @Column({ type: "double precision" })
        alpha!: number;

        @Column({type: "text"})
        direction!: string;

        @ManyToOne(() => BigFive)
        @JoinColumn({ name: "bigFiveBeforeId" })
        bigFiveBefore!: BigFive;

        @Column({ type: 'varchar', nullable: true })
        metric?: string;

        @Column({ type: 'double precision', nullable: true })
        vt?: number;

        @Column({ type: 'double precision', nullable: true })
        bt?: number;

        @Column({ type: 'double precision', nullable: true })
        r?: number;

        @Column({ type: 'double precision', nullable: true })
        n?: number;

        @Column({ type: 'double precision', nullable: true })
        contrib?: number;

        @ManyToOne(() => BigFive)
        @JoinColumn({ name: "bigFiveAfterId" })
        bigFiveAfter!: BigFive;

        @CreateDateColumn({ type: 'timestamp' })
        createdAt!: Date;

        @UpdateDateColumn({ type: 'timestamp' })
        updatedAt!: Date;
    }