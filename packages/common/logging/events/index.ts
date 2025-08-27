import { ILogRepository } from '../../repositories';

export enum EventType {
    ESCROW_ATTEMPT = 'escrow_attempt',
    BRIDGING_ATTEMPT = 'bridging_attempt',
    CONSOLIDATION_RECEIVED = 'consolidation_received',
    PAYMENT_RECEIVED = 'payment_received',
    ADDRESS_GENERATED = 'address_generated',
    FUNDS_MOVED_TO_CONSOLIDATION = 'funds_moved_to_consolidation',
    PAYMENT_INTENT_STATUS_CHANGED = 'payment_intent_status_changed',
    BRIDGING_WALLET_CREATED = 'bridging_wallet_created',
    API_ROUTE_CALLED = 'api_route_called',
    PAYMENT_FINALIZATION_ATTEMPT = 'payment_finalization_attempt',
    TRANSACTION_DETECTED = 'TRANSACTION_DETECTED',
}

export enum EventStatus {
    SUCCESS = 'success',
    FAILURE = 'failure',
    WARNING = 'warning',
    PENDING = 'pending',
}

export enum WalletType {
    PAYMENT_ADDRESS = 'payment_address',
    BRIDGING_WALLET = 'bridging_wallet',
    GAS_WALLET = 'gas_wallet',
    HOME_WALLET = 'home_wallet',
    CONSOLIDATION_WALLET = 'consolidation_wallet'
}

export type EventLog = {
    //what event it is
    eventType: EventType;

    //optional; associated payment identifier (address)
    paymentAddress?: string;

    //json; all other context data
    contextData: any;

    //how did it end
    status: EventStatus;

    walletType?: WalletType;
};

export class EventLogger {
    private readonly logRepository: ILogRepository;

    constructor(repository: ILogRepository) {
        this.logRepository = repository;
    }

    async writeEvent(event: EventLog): Promise<void> {
        try {
            this.logRepository.writeEvent(event);
        } catch (e: any) { }
    }
}
