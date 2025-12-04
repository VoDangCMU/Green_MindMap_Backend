import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {QuestionSets} from "./question_sets";
import {Questions} from "./questions";
export const QUESTION_SET_ITEMS_TABLE_NAME = 'question_set_items';
@Entity()
export class QuestionSetItems {
    @PrimaryGeneratedColumn("uuid")
    id!: string;
    @ManyToOne(() => QuestionSets, set => set.items, {onDelete: 'CASCADE'})
    questionSet!: QuestionSets;
    @Column({type: 'text'})
    questionSetId!: string;
    @ManyToOne(() => Questions, {onDelete: 'CASCADE'})
    question!: Questions;
    @Column({type: 'text'})
    questionId!: string;
    @Column({type: 'int', default: 0})
    order!: number;
    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;
    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;
}
