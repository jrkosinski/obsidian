import { database } from '../datasource';
import { EscrowArbiter, EscrowRecord, RelayNode } from '../entity';
import { Repository } from 'typeorm';

export interface IEscrowDataService {
    createEscrow(
        input: EscrowRecord,
        arbiter?: string[]
    ): Promise<EscrowRecord>;
    updateEscrow(input: Partial<EscrowRecord>): Promise<EscrowRecord>;
    getEscrowById(id: string): Promise<EscrowRecord | null>;
    getEscrows(): Promise<EscrowRecord[]>;
    getRepository(): Repository<EscrowRecord>;
}

export interface IRelayNodeDataService {
    createRelayNode(input: RelayNode): Promise<RelayNode>;
    getRepository(): Repository<RelayNode>;
}

export interface IEscrowArbiterDataService {
    createEscrowArbiter(input: EscrowArbiter): Promise<EscrowArbiter>;
    getRepository(): Repository<EscrowArbiter>;
}

class DataServiceBase {
    constructor() {
        if (!database.isInitialized) {
            database.initialize();
        }
    }
}

export class EscrowDataService
    extends DataServiceBase
    implements IEscrowDataService
{
    constructor() {
        super();
    }

    async createEscrow(
        input: EscrowRecord,
        arbiters?: string[]
    ): Promise<EscrowRecord> {
        //save the base record
        const output = await database.escrowRepository.save(input);

        //handle arbiters
        if (arbiters?.length) {
            const arbiterService = new EscrowArbiterDataService();
            await Promise.all(
                arbiters.map((a) => {
                    return arbiterService.createEscrowArbiter({
                        address: a,
                        escrowId: output.id ?? '',
                    });
                })
            );
        }

        return output;
    }

    async updateEscrow(input: Partial<EscrowRecord>): Promise<EscrowRecord> {
        return database.escrowRepository.save(input);
    }

    async getEscrowById(id: string): Promise<EscrowRecord | null> {
        return await database.escrowRepository.findOne({
            where: { id },
            relations: ['relayNodes', 'arbiters'],
        });
    }

    async getEscrows(): Promise<EscrowRecord[]> {
        return database.escrowRepository.find();
    }

    getRepository(): Repository<EscrowRecord> {
        return database.escrowRepository;
    }
}

export class RelayNodeDataService
    extends DataServiceBase
    implements IRelayNodeDataService
{
    constructor() {
        super();
    }

    async createRelayNode(input: RelayNode): Promise<RelayNode> {
        return database.relayNodeRepository.save(input);
    }

    getRepository(): Repository<RelayNode> {
        return database.relayNodeRepository;
    }
}

export class EscrowArbiterDataService
    extends DataServiceBase
    implements IEscrowArbiterDataService
{
    constructor() {
        super();
    }

    async createEscrowArbiter(input: EscrowArbiter): Promise<EscrowArbiter> {
        return database.arbiterRepository.save(input);
    }

    getRepository(): Repository<EscrowArbiter> {
        return database.arbiterRepository;
    }
}
