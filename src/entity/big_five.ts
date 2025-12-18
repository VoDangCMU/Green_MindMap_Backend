import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {User} from "./user";

export const BIG_FIVE_TABLE_NAME = 'big_five'

export enum BigFiveType {
    USER = 'user',
    MODEL = 'model',
    SEGMENT = 'segment'
}

@Entity(BIG_FIVE_TABLE_NAME)
export class BigFive {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type: "double precision", default: 0.5})
    openness!: number;

    @Column({type: "double precision", default: 0.5})
    conscientiousness!: number;

    @Column({type: "double precision", default: 0.5})
    extraversion!: number;

    @Column({type: "double precision", default: 0.5})
    agreeableness!: number;

    @Column({type: "double precision", default: 0.5})
    neuroticism!: number;

    @Column({type: "varchar", length: 50, default: BigFiveType.USER})
    type!: string;

    @Column({type: "uuid", nullable: true})
    referenceId?: string;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;

    @OneToOne(() => User, (user: User) => user.bigFive, {nullable: true})
    @JoinColumn({ name: "userId" })
    user?: User;
}