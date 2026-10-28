import type { Order, OrderStatus } from '../types/models';
import { formatDateTimeIST } from './format';

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'rto'],
  delivered: [],
  cancelled: [],
  rto: [],
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  rto: 'RTO',
};

export function getNextAllowedStatuses(currentStatus: OrderStatus): OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[currentStatus] || [];
}

export function canTransitionTo(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
  return getNextAllowedStatuses(currentStatus).includes(targetStatus);
}

/**
 * Escape a string for CSV format
 */
function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '""';
  const stringValue = String(value).replace(/"/g, '""');
  return `"${stringValue}"`;
}

/**
 * Convert an array of orders to CSV string
 */
export function generateOrdersCSV(orders: Order[]): string {
  const headers = [
    'Order Ref',
    'Date (IST)',
    'Status',
    'Customer Name',
    'Customer Phone',
    'Customer Email',
    'Delivery Address',
    'City',
    'State',
    'Pincode',
    'Products',
    'Subtotal (INR)',
    'Shipping Fee (INR)',
    'Total COD Amount (INR)',
    'Customer Notes',
    'UTM Source',
    'UTM Campaign',
  ];

  const rows = orders.map((order) => {
    const productsSummary = order.items
      .map(
        (item) =>
          `${item.title} (${item.brand}) x${item.quantity}${
            item.selectedSize ? ` Size: ${item.selectedSize}` : ''
          }${item.selectedColor ? ` Color: ${item.selectedColor}` : ''}`
      )
      .join('; ');

    const fullAddress = [
      order.deliveryAddress.line1,
      order.deliveryAddress.line2,
      order.deliveryAddress.landmark ? `Near ${order.deliveryAddress.landmark}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    return [
      escapeCSV(order.ref),
      escapeCSV(formatDateTimeIST(order.createdAt)),
      escapeCSV(ORDER_STATUS_LABELS[order.status] || order.status),
      escapeCSV(order.customer.name),
      escapeCSV(order.customer.phone),
      escapeCSV(order.customer.email || ''),
      escapeCSV(fullAddress),
      escapeCSV(order.deliveryAddress.city),
      escapeCSV(order.deliveryAddress.state),
      escapeCSV(order.deliveryAddress.pincode),
      escapeCSV(productsSummary),
      escapeCSV(order.subtotal),
      escapeCSV(order.shippingFee),
      escapeCSV(order.total),
      escapeCSV(order.notes || ''),
      escapeCSV(order.utm?.source || ''),
      escapeCSV(order.utm?.campaign || ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Triggers browser download for generated CSV
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
