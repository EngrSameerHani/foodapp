import type { Restaurant, MenuCategory } from '../types';

// ─── Menus ───────────────────────────────────────────────────────────────────

export const MENU_ZAWADI_BURGERS: MenuCategory[] = [
  {
    id: 'cat-zb-1', name: 'Burgers', sort_order: 0,
    items: [
      {
        id: 'item-zb-001', name: 'Classic Smash', description: 'Double patty, American cheese, pickles, special sauce',
        price: 12.99, photo_url: null, is_available: true,
        variations: [
          { id: 'var-zb-001', label: 'Size', is_required: true, is_multi_select: false,
            options: [{ name: 'Single', price_delta: 0 }, { name: 'Double', price_delta: 3.0 }] },
        ],
      },
      {
        id: 'item-zb-002', name: 'BBQ Bacon Smash', description: 'Crispy bacon, BBQ sauce, cheddar, caramelised onions',
        price: 14.99, photo_url: null, is_available: true, variations: [],
      },
      {
        id: 'item-zb-003', name: 'Mushroom Swiss', description: 'Sautéed mushrooms, Swiss cheese, garlic aioli',
        price: 13.99, photo_url: null, is_available: true, variations: [],
      },
      {
        id: 'item-zb-004', name: 'Veggie Smash', description: 'Plant-based patty, avocado, tomato, lettuce',
        price: 13.49, photo_url: null, is_available: false, variations: [],
      },
    ],
  },
  {
    id: 'cat-zb-2', name: 'Sides', sort_order: 1,
    items: [
      { id: 'item-zb-005', name: 'Crispy Fries', description: 'Golden fries with sea salt', price: 4.49, photo_url: null, is_available: true, variations: [] },
      { id: 'item-zb-006', name: 'Onion Rings', description: 'Beer-battered onion rings', price: 4.99, photo_url: null, is_available: true, variations: [] },
      { id: 'item-zb-007', name: 'Coleslaw', description: 'Creamy homemade coleslaw', price: 2.99, photo_url: null, is_available: true, variations: [] },
    ],
  },
  {
    id: 'cat-zb-3', name: 'Drinks', sort_order: 2,
    items: [
      { id: 'item-zb-008', name: 'Craft Soda', description: 'Ginger beer or cola', price: 2.99, photo_url: null, is_available: true, variations: [] },
      { id: 'item-zb-009', name: 'Milkshake', description: 'Chocolate, vanilla, or strawberry', price: 5.99, photo_url: null, is_available: true, variations: [] },
    ],
  },
];

export const MENU_NAIROBI_KITCHEN: MenuCategory[] = [
  {
    id: 'cat-nk-1', name: 'Rice Dishes', sort_order: 0,
    items: [
      { id: 'item-nk-001', name: 'Pilau', description: 'Spiced rice with beef and whole spices', price: 13.99, photo_url: null, is_available: true, variations: [] },
      { id: 'item-nk-002', name: 'Biryani', description: 'Fragrant basmati with slow-cooked chicken', price: 15.99, photo_url: null, is_available: true, variations: [] },
    ],
  },
  {
    id: 'cat-nk-2', name: 'Grills', sort_order: 1,
    items: [
      { id: 'item-nk-003', name: 'Nyama Choma', description: 'Fire-grilled goat or beef ribs', price: 18.99, photo_url: null, is_available: true,
        variations: [{ id: 'var-nk-001', label: 'Meat', is_required: true, is_multi_select: false,
          options: [{ name: 'Goat', price_delta: 0 }, { name: 'Beef', price_delta: 0 }] }] },
      { id: 'item-nk-004', name: 'Kuku Choma', description: 'Whole grilled chicken, with kachumbari', price: 16.99, photo_url: null, is_available: true, variations: [] },
    ],
  },
  {
    id: 'cat-nk-3', name: 'Stews & Sides', sort_order: 2,
    items: [
      { id: 'item-nk-005', name: 'Githeri', description: 'Mixed beans and maize in tomato sauce', price: 9.99, photo_url: null, is_available: true, variations: [] },
      { id: 'item-nk-006', name: 'Ugali', description: 'Stiff maize porridge', price: 2.99, photo_url: null, is_available: true, variations: [] },
      { id: 'item-nk-007', name: 'Sukuma Wiki', description: 'Sautéed collard greens', price: 3.49, photo_url: null, is_available: true, variations: [] },
    ],
  },
];

export const MENU_SAKURA_RAMEN: MenuCategory[] = [
  {
    id: 'cat-sr-1', name: 'Ramen', sort_order: 0,
    items: [
      { id: 'item-sr-001', name: 'Tonkotsu Ramen', description: 'Rich pork bone broth, chashu, egg, nori', price: 17.99, photo_url: null, is_available: true,
        variations: [{ id: 'var-sr-001', label: 'Broth', is_required: false, is_multi_select: false,
          options: [{ name: 'Regular', price_delta: 0 }, { name: 'Extra Rich', price_delta: 1.5 }] }] },
      { id: 'item-sr-002', name: 'Spicy Miso Ramen', description: 'Red miso base with chilli oil and corn', price: 16.99, photo_url: null, is_available: true, variations: [] },
      { id: 'item-sr-003', name: 'Shoyu Ramen', description: 'Light soy broth, chicken, bamboo shoots', price: 15.99, photo_url: null, is_available: true, variations: [] },
    ],
  },
  {
    id: 'cat-sr-2', name: 'Starters', sort_order: 1,
    items: [
      { id: 'item-sr-004', name: 'Gyoza (6 pcs)', description: 'Pan-fried pork and cabbage dumplings', price: 8.99, photo_url: null, is_available: true, variations: [] },
      { id: 'item-sr-005', name: 'Takoyaki (8 pcs)', description: 'Octopus balls with bonito and mayo', price: 9.99, photo_url: null, is_available: true, variations: [] },
    ],
  },
  {
    id: 'cat-sr-3', name: 'Drinks', sort_order: 2,
    items: [
      { id: 'item-sr-006', name: 'Matcha Latte', description: 'Premium Japanese matcha, hot or iced', price: 5.49, photo_url: null, is_available: true, variations: [] },
      { id: 'item-sr-007', name: 'Ramune Soda', description: 'Japanese marble soda', price: 3.99, photo_url: null, is_available: true, variations: [] },
    ],
  },
];

// ─── Restaurants ─────────────────────────────────────────────────────────────

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-001',
    name: 'Zawadi Burgers',
    description: 'Gourmet smash burgers made with 100% Kenyan beef',
    cuisine_types: ['Burgers', 'American', 'Fast Food'],
    cover_url: null,
    logo_url: null,
    address: '501 Castro St, San Francisco, CA',
    lat: 37.7609,
    lng: -122.435,
    rating: 4.7,
    review_count: 243,
    delivery_fee: 2.99,
    min_order: 12.0,
    delivery_radius_km: 10,
    estimated_delivery_minutes: 25,
    is_active: true,
    opening_hours: {
      mon: { open: '10:00', close: '22:00' },
      tue: { open: '10:00', close: '22:00' },
      wed: { open: '10:00', close: '22:00' },
      thu: { open: '10:00', close: '22:00' },
      fri: { open: '10:00', close: '23:00' },
      sat: { open: '11:00', close: '23:00' },
      sun: { open: '11:00', close: '21:00' },
    },
    created_at: '2026-01-01T00:00:00Z',
    categories: MENU_ZAWADI_BURGERS,
  },
  {
    id: 'rest-002',
    name: 'Nairobi Kitchen',
    description: 'Authentic Kenyan and East African cuisine',
    cuisine_types: ['Kenyan', 'African', 'Halal'],
    cover_url: null,
    logo_url: null,
    address: '1200 Mission St, San Francisco, CA',
    lat: 37.7749,
    lng: -122.4188,
    rating: 4.5,
    review_count: 189,
    delivery_fee: 1.99,
    min_order: 15.0,
    delivery_radius_km: 8,
    estimated_delivery_minutes: 35,
    is_active: true,
    opening_hours: {
      mon: { open: '11:00', close: '21:00' },
      tue: { open: '11:00', close: '21:00' },
      wed: { open: '11:00', close: '21:00' },
      thu: { open: '11:00', close: '21:00' },
      fri: { open: '11:00', close: '22:00' },
      sat: { open: '10:00', close: '22:00' },
      sun: { open: '10:00', close: '20:00' },
    },
    created_at: '2026-01-01T00:00:00Z',
    categories: MENU_NAIROBI_KITCHEN,
  },
  {
    id: 'rest-003',
    name: 'Sakura Ramen',
    description: 'Handcrafted Japanese ramen and street food',
    cuisine_types: ['Japanese', 'Ramen', 'Asian'],
    cover_url: null,
    logo_url: null,
    address: '300 Fillmore St, San Francisco, CA',
    lat: 37.7751,
    lng: -122.4309,
    rating: 4.6,
    review_count: 312,
    delivery_fee: 3.49,
    min_order: 18.0,
    delivery_radius_km: 12,
    estimated_delivery_minutes: 40,
    is_active: true,
    opening_hours: {
      mon: { open: '12:00', close: '22:00' },
      tue: { open: '12:00', close: '22:00' },
      wed: { open: '12:00', close: '22:00' },
      thu: { open: '12:00', close: '22:00' },
      fri: { open: '12:00', close: '23:00' },
      sat: { open: '11:00', close: '23:00' },
      sun: { open: '11:00', close: '21:00' },
    },
    created_at: '2026-01-01T00:00:00Z',
    categories: MENU_SAKURA_RAMEN,
  },
];

export const getMockRestaurant = (id: string) =>
  MOCK_RESTAURANTS.find((r) => r.id === id);
