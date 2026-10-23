export * from './mockUsers';
export * from './mockRestaurants';
export * from './mockOrders';

export const MOCK_VOUCHERS = [
  { code: 'WELCOME20', discount_type: 'percent', value: 20, min_order: 15, discount_amount: 0 },
  { code: 'SAVE5',     discount_type: 'flat',    value: 5,  min_order: 20, discount_amount: 5 },
];

export const DEMO_CREDENTIALS = {
  note: 'In mock mode OTP is always: 123456',
  accounts: [
    { phone: '+15550000001', role: 'customer',         name: 'Alice Johnson' },
    { phone: '+15550000002', role: 'customer',         name: 'Bob Smith' },
    { phone: '+15550000010', role: 'restaurant_owner', name: 'Frank Miller' },
    { phone: '+15550000011', role: 'restaurant_owner', name: 'Grace Lee' },
    { phone: '+15550000020', role: 'rider',            name: 'Ivan Martinez' },
  ],
};
