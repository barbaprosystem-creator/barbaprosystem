-- Add Market Price columns to price_catalog
ALTER TABLE price_catalog
ADD COLUMN market_price numeric(10,2) DEFAULT NULL,
ADD COLUMN market_price_updated_at timestamptz DEFAULT NULL;
