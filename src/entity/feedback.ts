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
import { Segment } from './segments';

@Entity('feedbacks')
export class Feedback {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => Models, { nullable: true })
    @JoinColumn({ name: 'model_id' })
    model?: Models;

    @Column({ type: 'uuid', name: 'model_id', nullable: true })
    modelId?: string;

    @ManyToOne(() => Segment, { nullable: true })
    @JoinColumn({ name: 'segment_id' })
    segment?: Segment;

    @Column({ type: 'uuid', name: 'segment_id', nullable: true })
    segmentId?: string;

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
