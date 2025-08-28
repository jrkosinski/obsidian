import { EventStatus, EventType } from '../logging/events';

export type EscrowInput = {
    id: string; // Unique identifier for the escrow
    receiver: string; // The address of the receiver
    payer: string; // The address of the payer
    arbiters: string[]; // The addresses of the arbiters
    currency: string; //The currency addres, 0x0 for native
    quorum: number; // The number of arbiters consent required to release or refund the escrow in absence of payer consent
    arbitrationModule: string; // The IArbitrationModule contract that has the logic rules for arbitration
    amount: string; // The total amount of the escrow
    startTime: number; // The timestamp when the escrow period begins
    endTime: number; //The timestamp when the escrow period ends
};

export type Escrow = EscrowInput & {
    timestamp: number; // The timestamp when the escrow was deployed
    status: EscrowStatus; // 0 = pending, 1 = active, 2 = completed, 3=arbitration
    fullyPaid: boolean; // Indicates if the escrow is fully paid
    payerReleased: boolean;
    receiverReleased: boolean;
    released: boolean;
    amountRefunded: string; // The amount refunded so far
    amountReleased: string; // The amount released so far
    amountPaid: string; // The amount paid so far
};

export type EscrowOutput = Escrow & {
    createdAt: Date;
    relayNodes: string[];
    chainId: string;
    address: string;
    deployed: boolean;
    deployedAt?: Date; // The date when the escrow was deployed on the blockchain
};

export type EscrowApiInput = EscrowInput & {
    chainType?: ChainType;
    chainId?: string;
    escrowAddress: string;
    deploy?: boolean;
};

export type RelayNodeApiInput = {
    chainType?: ChainType;
    chainId?: string;
    escrowAddress: string;
    escrowId: string;
};

/**
 * @title ChainType enum
 */
export enum ChainType {
    EVM = 'evm',
    SOLANA = 'solana',
    BITCOIN = 'bitcoin',
    UNKNOWN = 'unknown',
}

export enum EscrowStatus {
    PENDING = 0,
    ACTIVE = 1,
    COMPLETED = 2,
    ARBITRATION = 3,
}

/**
 * @title ITransactionOutput
 * @description Output from a contract transaction execution.
 */
export interface ITransactionOutput {
    transaction_id: string;
    tx: any;
    receipt: any;
}

/**
 * Token information interface for ERC20 tokens
 */
export interface TokenInfo {
    address: string;
    symbol: string;
    name?: string;
    decimals: number;
    chainId: string;
    logoURI?: string;
}

// Log Table
export type LogRecord = {
    logId: string;
    paymentAddress: string;
    createdAt: string;
    message: string;
    level: string;
    context?: string;
    source?: string;
};

export type EventQueryParams = {
    page?: number;
    count?: number;
    sort?: string; //TODO: (LOW) could be enum?
    filter?: EventQueryFilter;
};

export type LogQueryParams = {
    page?: number;
    count?: number;
    sort?: string; //TODO: (LOW) could be enum?
    filter?: LogQueryFilter;
};

export type EventQueryFilter = {
    eventType?: EventType[];
    dateFrom?: string;
    dateTo?: string;
    paymentAddress?: string;
    source?: string[];
};

export type LogQueryFilter = {
    level?: string[];
    dateFrom?: string;
    dateTo?: string;
    paymentAddress?: string;
    source?: string[];
};

export type LogQueryResult = {
    data: LogRecord[];
    total: number;
    page: number;
    count: number;
};

export type EventQueryResult = {
    data: EventRecord[];
    total: number;
    page: number;
    count: number;
};

export type EventRecord = {
    eventId: string;
    paymentAddress: string;
    createdAt: string;
    EventType: EventType;
    status: EventStatus;
    context?: any;
};

/**
 * @title ServiceMethodOutput
 * @description
 */
export type ServiceMethodOutput<T> = {
    code?: number;
    message?: string;
    data?: T;
};
