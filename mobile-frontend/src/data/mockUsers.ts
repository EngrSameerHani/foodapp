import type { User } from '@/types';

/** Demo accounts. In mock mode OTP is always 123456. */
export const MOCK_USERS: User[] = [
  {
    id: 'user-cust-001',
    phone: '+15550000001',
    name: 'Alice Johnson',
    avatar_url: null,
    role: 'customer',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-cust-002',
    phone: '+15550000002',
    name: 'Bob Smith',
    avatar_url: null,
    role: 'customer',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-owner-001',
    phone: '+15550000010',
    name: 'Frank Miller',
    avatar_url: null,
    role: 'restaurant_owner',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-owner-002',
    phone: '+15550000011',
    name: 'Grace Lee',
    avatar_url: null,
    role: 'restaurant_owner',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-owner-003',
    phone: '+15550000012',
    name: 'Henry Wilson',
    avatar_url: null,
    role: 'restaurant_owner',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-rider-001',
    phone: '+15550000020',
    name: 'Ivan Martinez',
    avatar_url: null,
    role: 'rider',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-rider-002',
    phone: '+15550000021',
    name: 'Julia Thompson',
    avatar_url: null,
    role: 'rider',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
];

export const findMockUser = (phone: string): User | undefined =>
  MOCK_USERS.find((u) => u.phone === phone);
