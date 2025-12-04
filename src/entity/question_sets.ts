import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {User} from "./user";
import {QuestionSetItems} from "./question_set_items";
export const QUESTION_SETS_TABLE_NAME = 'question_sets';
@Entity()
export class QuestionSets {
    @PrimaryGeneratedColumn("uuid")
    id!: string;
    @Column({type: 'varchar', length: 255})
    name!: string;
    @Column({type: 'text', nullable: true})
    description?: string;
    @ManyToOne(() => User, {nullable: false})
    owner!: User;
    @Column({type: 'text'})
    ownerId!: string;
    @OneToMany(() => QuestionSetItems, item => item.questionSet, {cascade: true})
    items?: QuestionSetItems[];
    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;
    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;
}
