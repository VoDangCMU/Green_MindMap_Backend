import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Models} from "./models";

export const SEGMENTS_TABLE_NAME = 'segments';

@Entity(SEGMENTS_TABLE_NAME)
export class Segment {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type: 'varchar', length: 255})
    name!: string;

    @Column({type: 'text', nullable: true})
    description?: string;

    @Column({type: 'varchar', length: 50, nullable: true})
    ageRange?: string;

    @Column({type: 'varchar', length: 20, nullable: true})
    gender?: string;

    @Column({type: 'text', nullable: true})
    location?: string;

    @Column({type: 'boolean', default: false})
    urban!: boolean;

    @ManyToOne(() => Models, {nullable: false, onDelete: 'CASCADE'})
    @JoinColumn({name: 'modelId', referencedColumnName: 'id'})
    model!: Models;

    @Column({type: 'uuid'})
    modelId!: string;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;
}
