import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn} from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({type: 'varchar', length: 255, unique: true})
    email!: string;

    @Column({
        type: 'varchar', length: 20, nullable: true, unique: true})
    phoneNumber?: string;

    @Column({type: 'varchar', length: 255})
    password!: string;

    @Column({type: 'varchar', length: 100, nullable: true})
    fullName?: string;

    @Column({type: 'varchar', length: 50, nullable: true})
    role?: string;

    @Column({type: 'timestamp'})
    dateOfBirth?: Date;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;
}
