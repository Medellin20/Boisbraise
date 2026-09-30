export interface ContactMessage {
  id: string; name: string; email: string; phone: string | null; subject: string; message: string;
  status: 'new' | 'in_progress' | 'closed'; created_at: string;
}
export interface AdminLog {
  id: string; action: string; entity_type: string | null; entity_id: string | null;
  details: Record<string, unknown>; actor: string; created_at: string;
}
export interface WoodProductRecord {
  id: string; slug: string; name: string; short_description: string; description: string;
  price_per_m3: number; moisture_percent: number | null; calorific_value_kwh: number | null;
  delivery_available: boolean; in_stock: boolean; stock_m3: number | null; is_published: boolean;
  sort_order: number; created_at: string; updated_at: string;
}
export interface WoodProductLengthRecord { id: string; product_id: string; length_cm: number; price_per_m3: number | null; sort_order: number; }
export interface WoodProductImageRecord { id: string; product_id: string; storage_path: string; url: string; alt_text: string | null; is_primary: boolean; sort_order: number; created_at: string; }
export interface WoodStoreSettingsRecord { id: number; payment_method: 'rib' | 'link'; payment_url: string; bank_name: string; bank_account_holder: string; bank_iban: string; bank_bic: string; updated_at: string; }
export interface Database {
  public: { Tables: {
    contact_messages: { Row: ContactMessage; Insert: Partial<ContactMessage>; Update: Partial<ContactMessage> };
    admin_logs: { Row: AdminLog; Insert: Partial<AdminLog>; Update: Partial<AdminLog> };
    wood_products: { Row: WoodProductRecord; Insert: Partial<WoodProductRecord>; Update: Partial<WoodProductRecord> };
    wood_product_lengths: { Row: WoodProductLengthRecord; Insert: Partial<WoodProductLengthRecord>; Update: Partial<WoodProductLengthRecord> };
    wood_product_images: { Row: WoodProductImageRecord; Insert: Partial<WoodProductImageRecord>; Update: Partial<WoodProductImageRecord> };
    wood_store_settings: { Row: WoodStoreSettingsRecord; Insert: Partial<WoodStoreSettingsRecord>; Update: Partial<WoodStoreSettingsRecord> };
  } };
}
