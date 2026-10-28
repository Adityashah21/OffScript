import { describe, it, expect } from 'vitest';
import {
  ORDER_STATUS_TRANSITIONS,
  getNextAllowedStatuses,
  canTransitionTo,
  generateOrdersCSV,
} from '../src/lib/orders';
import type { Order } from '../src/types/models';

describe('Order Status Transitions', () => {
  it('correctly returns next allowed transitions for pending', () => {
    expect(getNextAllowedStatuses('pending')).toEqual(['confirmed', 'cancelled']);
    expect(canTransitionTo('pending', 'confirmed')).toBe(true);
    expect(canTransitionTo('pending', 'cancelled')).toBe(true);
    expect(canTransitionTo('pending', 'shipped')).toBe(false);
    expect(canTransitionTo('pending', 'delivered')).toBe(false);
  });

  it('correctly returns next allowed transitions for confirmed', () => {
    expect(getNextAllowedStatuses('confirmed')).toEqual(['shipped', 'cancelled']);
    expect(canTransitionTo('confirmed', 'shipped')).toBe(true);
    expect(canTransitionTo('confirmed', 'cancelled')).toBe(true);
    expect(canTransitionTo('confirmed', 'delivered')).toBe(false);
  });

  it('correctly returns next allowed transitions for shipped', () => {
    expect(getNextAllowedStatuses('shipped')).toEqual(['delivered', 'rto']);
    expect(canTransitionTo('shipped', 'delivered')).toBe(true);
    expect(canTransitionTo('shipped', 'rto')).toBe(true);
    expect(canTransitionTo('shipped', 'cancelled')).toBe(false);
  });

  it('correctly identifies terminal statuses', () => {
    expect(getNextAllowedStatuses('delivered')).toEqual([]);
    expect(getNextAllowedStatuses('cancelled')).toEqual([]);
    expect(getNextAllowedStatuses('rto')).toEqual([]);
    expect(canTransitionTo('delivered', 'pending')).toBe(false);
    expect(canTransitionTo('cancelled', 'confirmed')).toBe(false);
    expect(canTransitionTo('rto', 'shipped')).toBe(false);
  });
});

describe('Orders CSV Generator', () => {
  const sampleOrder: Order = {
    _id: 'order_12345',
    ref: 'OS-2026-0001',
    customer: {
      name: 'Priya Sharma',
      phone: '9876543210',
      email: 'priya@example.com',
    },
    deliveryAddress: {
      line1: 'House 12, Rose Villa',
      line2: '100ft Road, Indiranagar',
      landmark: 'Near Metro Station',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
    },
    items: [
      {
        productId: 'prod_1',
        title: 'Minimalist Linen Shirt',
        brand: 'OFFSCRIPT Studio',
        price: 2499,
        quantity: 2,
        selectedSize: 'M',
        selectedColor: 'Sage Green',
      },
    ],
    subtotal: 4998,
    shippingFee: 0,
    total: 4998,
    paymentMethod: 'cod',
    status: 'pending',
    statusHistory: [
      {
        status: 'pending',
        changedAt: '2026-10-29T10:00:00.000Z',
        note: 'Order placed by customer via Cash on Delivery',
      },
    ],
    notes: 'Please ring the doorbell twice',
    utm: {
      source: 'instagram',
      campaign: 'autumn_drop',
    },
    createdAt: '2026-10-29T10:00:00.000Z',
    updatedAt: '2026-10-29T10:00:00.000Z',
  };

  it('generates valid RFC-compliant CSV with escaped fields', () => {
    const csv = generateOrdersCSV([sampleOrder]);
    const lines = csv.split('\r\n');

    expect(lines.length).toBe(2); // Header + 1 row
    expect(lines[0]).toContain('Order Ref,Date (IST),Status,Customer Name');
    expect(lines[1]).toContain('"OS-2026-0001"');
    expect(lines[1]).toContain('"Priya Sharma"');
    expect(lines[1]).toContain('"9876543210"');
    expect(lines[1]).toContain('"Bengaluru"');
    expect(lines[1]).toContain('"560038"');
    expect(lines[1]).toContain('"Minimalist Linen Shirt (OFFSCRIPT Studio) x2 Size: M Color: Sage Green"');
    expect(lines[1]).toContain('"4998"');
    expect(lines[1]).toContain('"Please ring the doorbell twice"');
    expect(lines[1]).toContain('"instagram"');
  });

  it('handles empty orders list gracefully', () => {
    const csv = generateOrdersCSV([]);
    expect(csv).toContain('Order Ref,Date (IST),Status');
    expect(csv.split('\r\n').length).toBe(1); // Only header
  });
});
