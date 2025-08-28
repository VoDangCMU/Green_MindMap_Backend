import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne, OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {User} from "./user";

export const BIG_FIVE_TABLE_NAME = 'big_five'

@Entity(BIG_FIVE_TABLE_NAME)
export class BigFive {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type: "double precision"})
    openness!: string;

    @Column({type: "double precision"})
    conscientiousness!: number;

    @Column({type: "double precision"})
    extraversion!: number;

    @Column({type: "double precision"})
    agreeableness!: number;

    @Column({type: "double precision"})
    neuroticism!: number;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;

    @OneToOne(() => User, user => user.bigFive)
    user!: User;
}