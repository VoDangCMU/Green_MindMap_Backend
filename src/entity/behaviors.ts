import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {ThreadHall} from "@root/entity/thread_halls";

export const BEHAVIORS_TABLE_NAME = 'behaviors';

@Entity(BEHAVIORS_TABLE_NAME)
export class Behavior {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => ThreadHall, { onDelete: 'CASCADE' })
    threadHall!: ThreadHall;

    @Column({type: 'text'})
    name!: string;

    @Column({type: 'text'})
    type!: string;

    @Column({type: 'text', array: true})
    keywords!: string[];

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;
}
