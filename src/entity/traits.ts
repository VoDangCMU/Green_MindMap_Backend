import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";


export const TRAITS_TABLE_NAME = 'traits'

@Entity(TRAITS_TABLE_NAME)
export class Traits {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type: 'text'})
    name!: string;

    @Column({type: 'text'})
    description?: string;

    @Column({type: 'text'})
    label?: string;
}