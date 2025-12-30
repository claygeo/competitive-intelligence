/**
 * TypeScript interfaces for Competitive Intelligence Dashboard
 */

// Inventory snapshot record
export interface InventorySnapshot {
  id: string;
  dispensary_id: string;
  product_id: string;
  location_id: string;
  product_name: string;
  category: string | null;
  brand: string | null;
  size_display: string | null;
  available_quantity: number | null;
  stock_status: string | null;
  regular_price: number | null;
  current_price: number | null;
  snapshot_date: string;
  created_at: string;
}

// Stock alert record
export interface StockAlert {
  id: string;
  dispensary_id: string;
  product_id: string;
  product_name: string;
  category: string | null;
  location_id: string | null;
  location_name: string | null;
  alert_type: 'low_stock' | 'stock_out' | 'restock' | 'competitor_out';
  threshold_value: number | null;
  current_quantity: number | null;
  previous_quantity: number | null;
  stores_affected: number;
  is_active: boolean;
  is_sent: boolean;
  sent_at: string | null;
  created_at: string;
  resolved_at: string | null;
}

// Competitor product from main database
export interface CompetitorProduct {
  id: string;
  dispensary_id: string;
  product_id: string;
  product_name: string;
  category: string | null;
  sub_category: string | null;
  brand: string | null;
  strain_name: string | null;
  strain_type: string | null;
  size_display: string | null;
  size_value: number | null;
  size_unit: string | null;
  regular_price: number;
  current_price: number;
  is_on_sale: boolean;
  promo_text: string | null;
  image_url: string | null;
  product_url: string | null;
  locations_available: number | null;
  total_locations_checked: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Competitor product location with inventory
export interface ProductLocation {
  id: string;
  dispensary_id: string;
  product_id: string;
  location_id: string;
  location_name: string;
  current_price: number;
  regular_price: number;
  is_on_sale: boolean;
  in_stock: boolean;
  available_quantity: number | null;
  stock_status: string | null;
  promo_text: string | null;
  updated_at: string;
}

// Category inventory summary
export interface CategoryInventory {
  category: string;
  total_quantity: number;
  unique_products: number;
  out_of_stock_count: number;
  low_stock_count: number;
}

// Dispensary inventory summary
export interface DispensaryInventory {
  dispensary_id: string;
  dispensary_name: string;
  total_quantity: number;
  total_products: number;
  out_of_stock_count: number;
  low_stock_count: number;
  categories: CategoryInventory[];
  last_updated: string;
}

// Stock-out item for display
export interface StockOutItem {
  dispensary_id: string;
  product_id: string;
  product_name: string;
  category: string | null;
  brand: string | null;
  size_display: string | null;
  stores_out: number;
  total_stores: number;
  current_quantity: number;
  regular_price: number | null;
  last_seen_date: string | null;
}

// Low stock item (Trulieve specific - showing <10)
export interface LowStockItem {
  dispensary_id: string;
  product_id: string;
  product_name: string;
  category: string | null;
  brand: string | null;
  size_display: string | null;
  available_quantity: number;
  stores_affected: number;
  location_names: string[];
}

// Depletion data for a category
export interface CategoryDepletion {
  category: string;
  start_quantity: number;
  end_quantity: number;
  quantity_change: number;
  percent_change: number;
  trend: 'up' | 'down' | 'stable';
}

// Depletion summary for a dispensary
export interface DepletionSummary {
  dispensary_id: string;
  dispensary_name: string;
  period_days: number;
  categories: CategoryDepletion[];
  overall_change: number;
}

// Opportunity - competitor is out, we have stock
export interface Opportunity {
  product_name: string;
  category: string | null;
  competitor_id: string;
  competitor_name: string;
  competitor_stores_out: number;
  curaleaf_quantity: number;
  curaleaf_stores_with_stock: number;
  potential_value: string;
}

// API response types
export interface InventoryResponse {
  success: boolean;
  data: DispensaryInventory[];
  timestamp: string;
}

export interface StockOutResponse {
  success: boolean;
  stockOuts: StockOutItem[];
  lowStock: LowStockItem[];
  timestamp: string;
}

export interface DepletionResponse {
  success: boolean;
  data: DepletionSummary[];
  period_days: number;
  timestamp: string;
}

export interface SnapshotResponse {
  success: boolean;
  message: string;
  records_created: number;
  dispensary: string;
  timestamp: string;
}

// Dashboard state
export interface DashboardState {
  muvInventory: DispensaryInventory | null;
  trulieveInventory: DispensaryInventory | null;
  stockOuts: StockOutItem[];
  lowStock: LowStockItem[];
  depletion: DepletionSummary[];
  opportunities: Opportunity[];
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;
}
