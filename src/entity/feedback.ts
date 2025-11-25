import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { Models } from './models';

@Entity('feedbacks')
export class Feedback {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => Models)
    @JoinColumn({ name: 'model_id' })
    model!: Models;

    @Column({ type: 'uuid', name: 'model_id' })
    modelId!: string;

    @Column({ type: 'varchar', length: 100 })
    user_id!: string;

    @Column({ type: 'varchar', length: 10 })
    trait_checked!: string;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    expected!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    actual!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    deviation!: number;

    @Column({ type: 'boolean' })
    match!: boolean;

    @Column({ type: 'varchar', length: 50 })
    level!: string;

    @Column({ type: 'jsonb' })
    feedback!: string[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}
