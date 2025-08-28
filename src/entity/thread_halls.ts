import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Behavior} from "./behaviors";
import {Questions} from "./questions";
import {Traits} from "./traits";

export const THREAD_HALLS_TABLE_NAME = 'thread_halls';

@Entity(THREAD_HALLS_TABLE_NAME)
export class ThreadHall {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Traits, traits => traits.threadHalls)
    traits!: Traits;

    @Column({type: 'text'})
    name!: string;

    @Column({type: 'text'})
    description!: string;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;

    @OneToMany(() => Questions, questions => questions.threadHall)
    questions!: Questions[];

    @OneToMany(() => Behavior, behavior => behavior.threadHall)
    behaviors!: Behavior[];
}
