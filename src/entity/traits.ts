import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {ThreadHall} from "@root/entity/thread_halls";


export const TRAITS_TABLE_NAME = 'traits'

@Entity(TRAITS_TABLE_NAME)
export class Traits {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type: 'text'})
    name!: string;

    @Column({type: 'text'})
    description!: string;

    @Column({type: 'text'})
    label!: string;

    @OneToMany(() => ThreadHall, threadHall => threadHall.traits)
    threadHalls!: ThreadHall[];
}