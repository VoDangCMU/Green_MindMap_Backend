import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {BigFive} from "../entity/big_five";
import {User} from "../entity/user";

export const NIGHT_OUT_FREQ_TABLE_NAME = 'night_out_freq';

@Entity(NIGHT_OUT_FREQ_TABLE_NAME)
export class NightOutFreq {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type:"int", default: 0})
    night_out_count!: number;

    @Column({type:"int"})
    base_night_out!: number;

    @Column({type: "decimal", default: 0.2})
    weight!: number;

    @Column({type: "varchar", default: "up"})
    direction!: string;

    @Column({type: "decimal", default: 1.0})
    sigma_r!: number;

    @Column({type: "decimal", default: 0.5})
    alpha!: number;

    @Column({type: "varchar"})
    home_location!: string;

    @Column({ type: "varchar", nullable: true })
    metric?: string;

    @Column({ type: "decimal", nullable: true })
    vt?: number;

    @Column({ type: "decimal", nullable: true })
    bt?: number;

    @Column({ type: "decimal", nullable: true })
    r?: number;

    @Column({ type: "decimal", nullable: true })
    n?: number;

    @Column({ type: "decimal", nullable: true })
    contrib?: number;

    @ManyToOne(() => BigFive)
    @JoinColumn({ name: "big_five_before_id" })
    bigFiveBefore!: BigFive;

    @ManyToOne(() => BigFive)
    @JoinColumn({ name: "big_five_after_id" })
    bigFiveAfter!: BigFive;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;
}