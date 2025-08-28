-- Create enum type for arbiter_type
-- DO $$ BEGIN
--     CREATE TYPE arbiter_type_enum AS ENUM ('none', 'third_party', 'managed');
-- EXCEPTION
--     WHEN duplicate_object THEN null;
-- END $$;

-- Create escrow table
CREATE TABLE IF NOT EXISTS escrow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id TEXT NOT NULL,
    address TEXT NOT NULL,
    payer TEXT NOT NULL,
    receiver TEXT NOT NULL,
    currency TEXT NOT NULL,
    arbitration_module TEXT NOT NULL,
    arbiters_required SMALLINT,
    amount BIGINT NOT NULL DEFAULT 0,
    start_date TIMESTAMPTZ NULL,
    end_date TIMESTAMPTZ NULL,
    created_at TIMESTAMP DEFAULT NOW()
    deployed_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS relay_node (
    address TEXT NOT NULL,
    escrow_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT "PK_relay_node_address" PRIMARY KEY ("address") 
);

CREATE TABLE IF NOT EXISTS escrow_arbiters (
    address TEXT NOT NULL,
    escrow_id UUID,
    PRIMARY KEY (address, escrow_id)
);

ALTER TABLE "relay_node" ADD CONSTRAINT "FK_relay_node_escrow" 
FOREIGN KEY ("escrow_id") REFERENCES "escrow"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "escrow_arbiters" ADD CONSTRAINT "FK_arbiter_escrow" 
FOREIGN KEY ("escrow_id") REFERENCES "escrow"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE INDEX escrow_arbiters_index
ON escrow_arbiters(escrow_id);