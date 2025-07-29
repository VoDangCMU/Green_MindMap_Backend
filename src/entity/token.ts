import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn} from 'typeorm';
import { User } from './user';

@Entity('tokens')
export class Token {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({type: 'varchar', length: 255, unique: true})
    token!: string;

    @Column({
        type: 'varchar', length: 50, nullable: true, unique: true})
    deviceID?: string;

    @Column({type: 'timestamp'})
    expiredAt!: Date;

    @Column({type: 'uuid'})
    userId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user!: User;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;
}
