#!/bin/bash

# Stop and remove containers and volumes (clears the database)
sudo docker compose down -v

# Start DynamoDB Local container for address-store
echo "Starting DynamoDB Local container for Address Store..."
sudo docker compose up -d dynamodb

echo "Waiting for DynamoDB to initialize..."
sleep 5

echo "Creating Address table..."
(cd dynamodb && npx ts-node create-address-table.ts)

echo "Creating BridgingWallets table..."
(cd dynamodb && npx ts-node create-bridging-table.ts)

echo "Creating Logs table..."
(cd dynamodb && npx ts-node create-log-table.ts)

echo "Creating Events table..."
(cd dynamodb && npx ts-node create-events-table.ts)

echo "Initializing wallets in database..."
(cd dynamodb && npx ts-node init-home-wallet.ts)

echo "Initializing Bitcoin HD wallet..."
(cd dynamodb && npx ts-node init-bitcoin-hd-wallet.ts)

echo "Creating HD Wallet Indices table..."
(cd dynamodb && npx ts-node create-hd-wallet-indices-table.ts)

echo "Setup complete for Address Store."
