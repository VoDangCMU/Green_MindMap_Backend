import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {User} from "./user";
import {Scans} from "./scans";

export const INVOICES_TABLE_NAME = 'invoices';

@Entity(INVOICES_TABLE_NAME)
export class Invoices {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => User, user => user.invoices)
    user!: User;

    @ManyToOne(() => Scans, scans => scans.invoices)
    scans!: Scans;

    @Column({type: 'time with time zone'})
    issued_at!: Date;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;
}