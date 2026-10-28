import { describe, it, expect } from 'vitest';
import {
  isTodayIST,
  computeOrdersToday,
  computePendingCodValue,
  getOrdersNeedingAttention,
  compute14DayTrend,
} from '../src/lib/dashboard';
import type { Order } from '../src/types/models';

describe('Dashboard Metric Calculations', () => {
  const now = new Date();
  const todayISO = now.toISOString();
  const twoDaysAgoISO = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const fiveDaysAgoISO = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();

  const mockOrders: Order[] = [
    {
      _id: 'o1',
      ref: 'OS-001',
      customer: { name: 'Customer 1', phone: '1111111111' },
      deliveryAddress: { line1: 'Street 1', city: 'Mumbai', state: 'MH', pincode: '400001' },
      items: [{ productId: 'p1', title: 'Item 1', brand: 'Brand A', price: 1000, quantity: 1 }],
      subtotal: 1000,
      shippingFee: 0,
      total: 1000,
      paymentMethod: 'cod',
      status: 'pending',
      statusHistory: [],
      createdAt: todayISO,
      updatedAt: todayISO,
    },
    {
      _id: 'o2',
      ref: 'OS-002',
      customer: { name: 'Customer 2', phone: '2222222222' },
      deliveryAddress: { line1: 'Street 2', city: 'Delhi', state: 'DL', pincode: '110001' },
      items: [{ productId: 'p2', title: 'Item 2', brand: 'Brand B', price: 2500, quantity: 1 }],
      subtotal: 2500,
      shippingFee: 0,
      total: 2500,
      paymentMethod: 'cod',
      status: 'pending',
      statusHistory: [],
      createdAt: twoDaysAgoISO, // > 24 hours ago, pending
      updatedAt: twoDaysAgoISO,
    },
    {
      _id: 'o3',
      ref: 'OS-003',
      customer: { name: 'Customer 3', phone: '3333333333' },
      deliveryAddress: { line1: 'Street 3', city: 'Bengaluru', state: 'KA', pincode: '560001' },
      items: [{ productId: 'p3', title: 'Item 3', brand: 'Brand C', price: 3000, quantity: 1 }],
      subtotal: 3000,
      shippingFee: 0,
      total: 3000,
      paymentMethod: 'cod',
      status: 'confirmed', // > 24 hours ago, but already confirmed!
      statusHistory: [],
      createdAt: twoDaysAgoISO,
      updatedAt: twoDaysAgoISO,
    },
    {
      _id: 'o4',
      ref: 'OS-004',
      customer: { name: 'Customer 4', phone: '4444444444' },
      deliveryAddress: { line1: 'Street 4', city: 'Pune', state: 'MH', pincode: '411001' },
      items: [{ productId: 'p4', title: 'Item 4', brand: 'Brand D', price: 4000, quantity: 1 }],
      subtotal: 4000,
      shippingFee: 0,
      total: 4000,
      paymentMethod: 'cod',
      status: 'pending',
      statusHistory: [],
      createdAt: fiveDaysAgoISO, // > 24 hours ago, pending (older than o2)
      updatedAt: fiveDaysAgoISO,
    },
  ];

  it('checks if an ISO timestamp is today in IST', () => {
    expect(isTodayIST(todayISO)).toBe(true);
    expect(isTodayIST(twoDaysAgoISO)).toBe(false);
  });

  it('computes orders today count', () => {
    expect(computeOrdersToday(mockOrders)).toBe(1);
  });

  it('computes pending COD value sum accurately', () => {
    // o1 (1000) + o2 (2500) + o4 (4000) = 7500. o3 is confirmed so excluded.
    expect(computePendingCodValue(mockOrders)).toBe(7500);
  });

  it('identifies orders needing attention older than 24h and sorts oldest first', () => {
    const overdue = getOrdersNeedingAttention(mockOrders);
    expect(overdue.length).toBe(2);
    // o4 is 5 days ago, o2 is 2 days ago -> o4 should be first
    expect(overdue[0]._id).toBe('o4');
    expect(overdue[1]._id).toBe('o2');
  });

  it('generates 14-day trend with exactly 14 day data points', () => {
    const trend = compute14DayTrend(mockOrders);
    expect(trend.length).toBe(14);
    // Total orders counted across all 14 days equals 4
    const totalCounted = trend.reduce((sum, p) => sum + p.ordersCount, 0);
    expect(totalCounted).toBe(4);
  });
});
