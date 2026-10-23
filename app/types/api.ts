// Shared API types — mirror backend Pydantic schemas

export type UserRole = 'customer' | 'restaurant_owner' | 'rider';

export interface User {
  id: string;
  phone: string;
  name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: string;
  role: UserRole;
}

export interface Address {
  id: string;
  label: string;
  full_address: string;
  lat: number;
  lng: number;
  is_default: boolean;
  created_at: string;
}

export interface VariationOption {
  name: string;
  price_delta: number;
}

export interface ItemVariation {
  id: string;
  label: string;
  is_required: boolean;
  is_multi_select: boolean;
  options: VariationOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  photo_url: string | null;
  is_available: boolean;
  variations: ItemVariation[];
}

export interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
  items: MenuItem[];
}

export interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  cuisine_types: string[];
  cover_url: string | null;
  logo_url: string | null;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  review_count: number;
  delivery_fee: number;
  min_order: number;
  delivery_radius_km: number;
  estimated_delivery_minutes: number;
  is_active: boolean;
  opening_hours: Record<string, { open: string; close: string }>;
  created_at: string;
  categories?: MenuCategory[];
}

export interface SelectedOption {
  variation_id: string;
  option_name: string;
  price_delta: number;
}

export interface CartItem {
  id: string;
  item_id: string;
  quantity: number;
  selected_options: SelectedOption[];
  special_note: string | null;
  item_name: string;
  unit_price: number;
  line_total: number;
}

export interface Cart {
  restaurant_id: string | null;
  restaurant_name: string;
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  tax: number;
  total: number;
}

export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  options_snapshot: SelectedOption[];
  special_note: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  restaurant_id: string;
  rider_id: string | null;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  delivery_note: string | null;
  rejection_reason: string | null;
  delivery_address_snapshot: { full_address: string; lat: number; lng: number } | null;
  estimated_delivery_minutes: number | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface VoucherValidation {
  code: string;
  discount_type: string;
  value: number;
  discount_amount: number;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface RiderProfile {
  id: string;
  user_id: string;
  vehicle_type: string;
  is_online: boolean;
  is_available: boolean;
  total_deliveries: number;
  total_earnings: number;
  rating: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
