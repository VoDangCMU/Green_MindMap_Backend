import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne} from 'typeorm';
import {Locations} from "./locations";
import {BigFive} from "./big_five";
import {Scans} from "./scans";
import {Invoices} from "./invoices";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({type: 'varchar', length: 255, unique: true})
    username!: string;

    @Column({type: 'varchar', length: 255, unique: true})
    email!: string;

    @Column({type: 'varchar', length: 20, nullable: true, unique: true})
    phoneNumber!: string;

    @Column({type: 'varchar', length: 255})
    password!: string;

    @Column({type: 'varchar', length: 100, nullable: true})
    fullName!: string;

    @Column({type: 'varchar', length: 50, nullable: true})
    role!: string;

    @Column({type: 'timestamp'})
    dateOfBirth!: Date;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;

    @OneToMany(() => Locations, locations => locations.user)
    locations!: Locations[];

    @OneToOne(() => BigFive, bigFive => bigFive.user)
    bigFive!: BigFive;

    @OneToMany(() => Scans, scans => scans.user)
    scans!: Scans[];

    @OneToMany(() => Invoices, invoices => invoices.user)
    invoices!: Invoices[];
}
