import type { DeliveryAddress, Customer } from '../types/models';

/**
 * Format currency into Indian Rupees (₹)
 * Example: 1499 -> "₹1,499"
 */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format ISO date string into IST readable date-time
 * Example: "2026-10-29T12:30:00Z" -> "29 Oct 2026, 6:00 PM IST"
 */
export function formatDateTimeIST(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Format ISO date string into short IST date
 * Example: "2026-10-29T12:30:00Z" -> "29 Oct 2026"
 */
export function formatDateIST(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Format relative time (e.g. "5m ago", "2h ago", "3d ago")
 */
export function formatTimeAgo(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';

  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDateIST(d);
}

/**
 * Clean phone number and generate WhatsApp link
 */
export function getWhatsAppLink(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  const baseUrl = `https://wa.me/${normalized}`;
  return text ? `${baseUrl}?text=${encodeURIComponent(text)}` : baseUrl;
}

/**
 * Format multi-line address block for copying or shipping labels
 */
export function formatAddressBlock(customer: Customer, address: DeliveryAddress): string {
  const lines = [
    customer.name,
    `Phone: ${customer.phone}`,
    address.line1,
  ];

  if (address.line2) lines.push(address.line2);
  if (address.landmark) lines.push(`Landmark: ${address.landmark}`);
  lines.push(`${address.city}, ${address.state} - ${address.pincode}`);

  return lines.join('\n');
}
