import 'reflect-metadata';
import { DataSource, Repository } from 'typeorm';
import { EscrowArbiter, EscrowRecord, RelayNode } from '../entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource: DataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: 'postgres', //process.env.DB_USERNAME,
    password: 'postgres', // process.env.DB_PASSWORD,
    database: 'obsidian', // process.env.DB_DATABASE,
    synchronize: false,
    logging: false,
    entities: [EscrowRecord, RelayNode, EscrowArbiter],
    migrations: ['src/migration/*.ts'],
    subscribers: [],
});

export class Database {
    public get isInitialized(): boolean {
        return AppDataSource.isInitialized;
    }

    public initialize() {
        AppDataSource.initialize();
    }

    public get escrowRepository(): Repository<EscrowRecord> {
        return AppDataSource.getRepository(EscrowRecord);
    }

    public get relayNodeRepository(): Repository<RelayNode> {
        return AppDataSource.getRepository(RelayNode);
    }

    public get arbiterRepository(): Repository<EscrowArbiter> {
        return AppDataSource.getRepository(EscrowArbiter);
    }
}

export const database = new Database();
