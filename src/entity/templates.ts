import {Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {Questions} from "@root/entity/questions";

export const TEMPLATES_TABLE_NAME = 'templates';

@Entity(TEMPLATES_TABLE_NAME)
export class Template {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type: 'text'})
    text!: string;

    @Column({type: 'text', array: true})
    placeholder!: string[];

    @Column({type: 'text'})
    answer_type!: string;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;

    @OneToMany(() => Questions, questions => questions.template)
    questions!: Questions[];
}