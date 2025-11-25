import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { User } from './user';

@Entity('behavior_feedbacks')
export class BehaviorFeedback {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({ type: 'uuid', name: 'user_id' })
    userId!: string;

    @Column({ type: 'varchar', length: 50 })
    metric!: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    vt!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    bt!: number;

    @Column({ type: 'decimal', precision: 10, scale: 4 })
    r!: number;

    @Column({ type: 'decimal', precision: 10, scale: 4 })
    n!: number;

    @Column({ type: 'decimal', precision: 10, scale: 4 })
    contrib!: number;

    @Column({ type: 'jsonb' })
    mechanismFeedback!: {
        awareness: string;
        motivation: string;
        capability: string;
        opportunity: string;
    };

    @Column({ type: 'text', nullable: true })
    reason?: string;

    @Column({ type: 'jsonb' })
    oceanScore!: {
        O: number;
        C: number;
        E: number;
        A: number;
        N: number;
    };

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}

