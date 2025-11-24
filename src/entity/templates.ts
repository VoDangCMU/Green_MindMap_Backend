import {Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryColumn, UpdateDateColumn, ManyToOne} from "typeorm";
import {Questions} from "./questions";
import {TemplateAnswer} from "./template_answers";
import {Models} from "./models";

export const TEMPLATES_TABLE_NAME = 'templates';

@Entity(TEMPLATES_TABLE_NAME)
export class Template {
    @PrimaryColumn({type:"varchar"})
    id!: string;

    @Column({type:"varchar"})
    name!: string;

    @Column({type: "text", nullable: true})
    description?: string;

    @Column({type: "varchar"})
    intent!: string;

    @Column({type: "text"})
    prompt!: string;

    @Column({type: "json", nullable: true})
    used_placeholders?: string[];

    @Column({type: "varchar", nullable: true})
    question_type?: string;

    @Column({type: "text", nullable: true})
    filled_prompt?: string;

    @Column({type: "varchar", nullable: true})
    trait?: string;


    @ManyToOne(() => Models, {nullable: true})
    model?: Models;

    @OneToOne(() => TemplateAnswer, (answer) => answer.template, { cascade: true, onDelete: "CASCADE" })
    answer!: TemplateAnswer;

    @OneToMany(() => Questions, questions => questions.template, {onDelete: "CASCADE"})
    questions!: Questions[];

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;
}