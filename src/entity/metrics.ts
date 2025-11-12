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

export const METRICS_TABLE_NAME = 'metrics'

@Entity(METRICS_TABLE_NAME)
export class Metrics {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type: "uuid"})
    userId!: string;

    @Column({type: "varchar", length: 100})
    metric!: string;

    @Column({type: "double precision"})
    vt!: number;

    @Column({type: "double precision"})
    bt!: number;

    @Column({type: "double precision"})
    r!: number;

    @Column({type: "double precision"})
    n!: number;

    @Column({type: "double precision", nullable: true})
    contrib?: number;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: "userId" })
    user!: User;
}
