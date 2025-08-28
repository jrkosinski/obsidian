import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany,
    Index,
    PrimaryColumn,
} from 'typeorm';

export enum ArbiterType {
    NONE = 'none',
    THIRD_PARTY = 'third_party',
    MANAGED = 'managed',
}

@Entity('escrow')
export class EscrowRecord {
    @PrimaryGeneratedColumn('uuid')
    id?: string;

    @Column()
    address!: string;

    @Column({ name: 'chain_id' })
    chainId!: string;

    @Column()
    payer!: string;

    @Column()
    receiver!: string;

    @Column()
    currency!: string;

    @Column({ type: 'bigint' })
    amount!: BigInt;

    @Column({ name: 'arbitration_module' })
    arbitrationModule: string;

    @Column({ name: 'arbiters_required' })
    quorum: number; // The number of arbiters consent required to release or refund the escrow in absence of payer consent

    @Column({ name: 'created_at', type: 'timestamptz', nullable: false })
    createdAt?: Date;

    @Column({ name: 'deployed_at', type: 'timestamptz', nullable: true })
    deployedAt?: Date;

    @Column({ name: 'start_date', type: 'timestamptz', nullable: true })
    startDate?: Date;

    @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
    endDate?: Date;

    @OneToMany(() => RelayNode, (relayNode) => relayNode.escrow, {
        onDelete: 'CASCADE',
    })
    relayNodes?: RelayNode[];

    @OneToMany(() => EscrowArbiter, (arbiter) => arbiter.escrow, {
        onDelete: 'CASCADE',
    })
    arbiters?: EscrowArbiter[];
}

@Entity('relay_node')
export class RelayNode {
    @PrimaryColumn()
    address!: string;

    @Index()
    @Column({ name: 'escrow_id' })
    escrowId!: string;

    @ManyToOne(() => EscrowRecord, (escrow) => escrow.relayNodes)
    @JoinColumn({ name: 'escrow_id' })
    escrow?: EscrowRecord;

    @Column({ name: 'created_at', type: 'timestamptz', nullable: false })
    createdAt?: Date;
}

@Entity('escrow_arbiters')
export class EscrowArbiter {
    @PrimaryColumn()
    address!: string;

    @PrimaryColumn({ name: 'escrow_id' })
    escrowId!: string;

    @ManyToOne(() => EscrowRecord, (escrow) => escrow.arbiters)
    @JoinColumn({ name: 'escrow_id' })
    escrow?: EscrowRecord;
}
