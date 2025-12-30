-- ============================================================================
-- COMPETITIVE INTELLIGENCE - Database Setup
-- ============================================================================
-- Run this in Supabase SQL Editor to create the inventory tracking tables
-- ============================================================================

-- 1. INVENTORY SNAPSHOTS TABLE
-- Stores daily/per-scrape inventory levels for historical tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dispensary_id UUID NOT NULL REFERENCES dispensaries(id),
    product_id TEXT NOT NULL,
    location_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT,
    brand TEXT,
    size_display TEXT,
    available_quantity INTEGER,
    stock_status TEXT,
    regular_price DECIMAL(10,2),
    current_price DECIMAL(10,2),
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_snapshots_dispensary_date 
    ON inventory_snapshots(dispensary_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_snapshots_product_date 
    ON inventory_snapshots(product_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_snapshots_location_date 
    ON inventory_snapshots(location_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_snapshots_category 
    ON inventory_snapshots(dispensary_id, category, snapshot_date DESC);

-- Composite index for depletion queries
CREATE INDEX IF NOT EXISTS idx_snapshots_depletion 
    ON inventory_snapshots(dispensary_id, product_id, location_id, snapshot_date DESC);

-- Unique constraint to prevent duplicate snapshots
CREATE UNIQUE INDEX IF NOT EXISTS idx_snapshots_unique 
    ON inventory_snapshots(dispensary_id, product_id, location_id, snapshot_date);

-- 2. STOCK ALERTS TABLE
-- Tracks stock-out and low-stock alerts
-- ============================================================================

CREATE TABLE IF NOT EXISTS stock_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dispensary_id UUID NOT NULL REFERENCES dispensaries(id),
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT,
    location_id TEXT,
    location_name TEXT,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'stock_out', 'restock', 'competitor_out')),
    threshold_value INTEGER,
    current_quantity INTEGER,
    previous_quantity INTEGER,
    stores_affected INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Indexes for stock alerts
CREATE INDEX IF NOT EXISTS idx_stock_alerts_dispensary 
    ON stock_alerts(dispensary_id, is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_alerts_type 
    ON stock_alerts(alert_type, is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_alerts_unsent 
    ON stock_alerts(is_sent, is_active) WHERE is_sent = FALSE AND is_active = TRUE;

-- 3. HELPER VIEWS
-- ============================================================================

-- View: Latest inventory by dispensary
CREATE OR REPLACE VIEW v_latest_inventory AS
SELECT DISTINCT ON (dispensary_id, product_id, location_id)
    id,
    dispensary_id,
    product_id,
    location_id,
    product_name,
    category,
    brand,
    size_display,
    available_quantity,
    stock_status,
    regular_price,
    current_price,
    snapshot_date,
    created_at
FROM inventory_snapshots
ORDER BY dispensary_id, product_id, location_id, snapshot_date DESC;

-- View: Inventory aggregated by category
CREATE OR REPLACE VIEW v_inventory_by_category AS
SELECT 
    dispensary_id,
    category,
    snapshot_date,
    COUNT(DISTINCT product_id) as unique_products,
    COUNT(*) as total_variants,
    SUM(COALESCE(available_quantity, 0)) as total_quantity,
    COUNT(*) FILTER (WHERE available_quantity = 0 OR stock_status = 'out_of_stock') as out_of_stock_count,
    COUNT(*) FILTER (WHERE available_quantity > 0 AND available_quantity < 10) as low_stock_count
FROM inventory_snapshots
WHERE snapshot_date = CURRENT_DATE
GROUP BY dispensary_id, category, snapshot_date;

-- View: Stock-outs (products with 0 quantity or out_of_stock status)
CREATE OR REPLACE VIEW v_current_stock_outs AS
SELECT 
    s.dispensary_id,
    s.product_id,
    s.product_name,
    s.category,
    s.brand,
    s.size_display,
    COUNT(DISTINCT s.location_id) as stores_out,
    MAX(s.regular_price) as regular_price,
    MAX(s.snapshot_date) as last_seen_date
FROM inventory_snapshots s
WHERE s.snapshot_date = CURRENT_DATE
  AND (s.available_quantity = 0 OR s.stock_status = 'out_of_stock')
GROUP BY s.dispensary_id, s.product_id, s.product_name, s.category, s.brand, s.size_display
ORDER BY stores_out DESC;

-- 4. FUNCTIONS
-- ============================================================================

-- Function: Calculate depletion rate for a product over N days
CREATE OR REPLACE FUNCTION calculate_depletion_rate(
    p_dispensary_id UUID,
    p_product_id TEXT,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    start_quantity BIGINT,
    end_quantity BIGINT,
    quantity_change BIGINT,
    percent_change DECIMAL,
    avg_daily_depletion DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH date_range AS (
        SELECT 
            CURRENT_DATE - p_days as start_date,
            CURRENT_DATE as end_date
    ),
    start_snapshot AS (
        SELECT SUM(available_quantity) as total_qty
        FROM inventory_snapshots
        WHERE dispensary_id = p_dispensary_id
          AND product_id = p_product_id
          AND snapshot_date = (SELECT start_date FROM date_range)
    ),
    end_snapshot AS (
        SELECT SUM(available_quantity) as total_qty
        FROM inventory_snapshots
        WHERE dispensary_id = p_dispensary_id
          AND product_id = p_product_id
          AND snapshot_date = (SELECT end_date FROM date_range)
    )
    SELECT 
        COALESCE(s.total_qty, 0)::BIGINT as start_quantity,
        COALESCE(e.total_qty, 0)::BIGINT as end_quantity,
        (COALESCE(e.total_qty, 0) - COALESCE(s.total_qty, 0))::BIGINT as quantity_change,
        CASE 
            WHEN COALESCE(s.total_qty, 0) > 0 
            THEN ROUND(((COALESCE(e.total_qty, 0) - COALESCE(s.total_qty, 0))::DECIMAL / s.total_qty) * 100, 2)
            ELSE 0 
        END as percent_change,
        ROUND((COALESCE(s.total_qty, 0) - COALESCE(e.total_qty, 0))::DECIMAL / p_days, 2) as avg_daily_depletion
    FROM start_snapshot s, end_snapshot e;
END;
$$ LANGUAGE plpgsql;

-- Function: Get category depletion rates
CREATE OR REPLACE FUNCTION get_category_depletion(
    p_dispensary_id UUID,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    category TEXT,
    start_quantity BIGINT,
    end_quantity BIGINT,
    percent_change DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH start_totals AS (
        SELECT 
            s.category,
            SUM(s.available_quantity) as total_qty
        FROM inventory_snapshots s
        WHERE s.dispensary_id = p_dispensary_id
          AND s.snapshot_date = CURRENT_DATE - p_days
        GROUP BY s.category
    ),
    end_totals AS (
        SELECT 
            s.category,
            SUM(s.available_quantity) as total_qty
        FROM inventory_snapshots s
        WHERE s.dispensary_id = p_dispensary_id
          AND s.snapshot_date = CURRENT_DATE
        GROUP BY s.category
    )
    SELECT 
        COALESCE(e.category, s.category) as category,
        COALESCE(s.total_qty, 0)::BIGINT as start_quantity,
        COALESCE(e.total_qty, 0)::BIGINT as end_quantity,
        CASE 
            WHEN COALESCE(s.total_qty, 0) > 0 
            THEN ROUND(((COALESCE(e.total_qty, 0) - COALESCE(s.total_qty, 0))::DECIMAL / s.total_qty) * 100, 2)
            ELSE 0 
        END as percent_change
    FROM start_totals s
    FULL OUTER JOIN end_totals e ON s.category = e.category
    ORDER BY percent_change ASC;
END;
$$ LANGUAGE plpgsql;

-- 5. ROW LEVEL SECURITY (Optional - enable if needed)
-- ============================================================================

-- ALTER TABLE inventory_snapshots ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

-- 6. GRANTS
-- ============================================================================

GRANT SELECT, INSERT ON inventory_snapshots TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON stock_alerts TO anon, authenticated;
GRANT SELECT ON v_latest_inventory TO anon, authenticated;
GRANT SELECT ON v_inventory_by_category TO anon, authenticated;
GRANT SELECT ON v_current_stock_outs TO anon, authenticated;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
