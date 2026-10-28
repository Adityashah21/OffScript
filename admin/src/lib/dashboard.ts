import type { Order } from '../types/models';

/**
 * Check if an ISO date string falls on today in IST (Asia/Kolkata)
 */
export function isTodayIST(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;

  const todayIST = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const orderIST = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);

  return todayIST === orderIST;
}

/**
 * Total orders placed today in IST
 */
export function computeOrdersToday(orders: Order[]): number {
  return orders.filter((o) => isTodayIST(o.createdAt)).length;
}

/**
 * Sum of total COD amount for orders currently in 'pending' status
 */
export function computePendingCodValue(orders: Order[]): number {
  return orders
    .filter((o) => o.status === 'pending')
    .reduce((sum, o) => sum + (o.total || 0), 0);
}

/**
 * Find orders in 'pending' status older than 24 hours, sorted oldest first
 */
export function getOrdersNeedingAttention(orders: Order[]): Order[] {
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  return orders
    .filter((o) => {
      if (o.status !== 'pending') return false;
      const orderTime = new Date(o.createdAt).getTime();
      return now - orderTime >= TWENTY_FOUR_HOURS_MS;
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export interface DayDataPoint {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "15 Oct"
  ordersCount: number;
  codAmount: number;
}

/**
 * Generate 14-day timeline buckets ending today in IST
 */
export function compute14DayTrend(orders: Order[]): DayDataPoint[] {
  const points: DayDataPoint[] = [];
  const now = new Date();

  // Create map of orders by date string in IST
  const ordersByDateIST: Record<string, { count: number; amount: number }> = {};

  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    if (isNaN(d.getTime())) return;

    // Convert to YYYY-MM-DD in Asia/Kolkata
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d); // en-CA gives YYYY-MM-DD

    if (!ordersByDateIST[parts]) {
      ordersByDateIST[parts] = { count: 0, amount: 0 };
    }
    ordersByDateIST[parts].count += 1;
    // Count revenue for non-cancelled orders
    if (o.status !== 'cancelled' && o.status !== 'rto') {
      ordersByDateIST[parts].amount += o.total || 0;
    }
  });

  // Generate last 14 consecutive days
  for (let i = 13; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(day);

    const label = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
    }).format(day);

    const bucket = ordersByDateIST[dateKey] || { count: 0, amount: 0 };
    points.push({
      date: dateKey,
      label,
      ordersCount: bucket.count,
      codAmount: bucket.amount,
    });
  }

  return points;
}
