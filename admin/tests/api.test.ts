import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatINR, getWhatsAppLink, formatAddressBlock } from '../src/lib/format';
import { getToken, setToken, clearToken, api, ApiError } from '../src/lib/api';

describe('Format Utilities', () => {
  it('formats currency correctly in INR', () => {
    expect(formatINR(1499)).toMatch(/₹\s?1,499/);
    expect(formatINR(0)).toMatch(/₹\s?0/);
    expect(formatINR(null)).toBe('₹0');
    expect(formatINR(undefined)).toBe('₹0');
  });

  it('generates whatsapp links correctly with normalized 91 prefix', () => {
    const link1 = getWhatsAppLink('9876543210');
    expect(link1).toBe('https://wa.me/919876543210');

    const link2 = getWhatsAppLink('+91 98765 43210');
    expect(link2).toBe('https://wa.me/919876543210');

    const linkWithText = getWhatsAppLink('9876543210', 'Hi! Your order is confirmed.');
    expect(linkWithText).toBe('https://wa.me/919876543210?text=Hi!%20Your%20order%20is%20confirmed.');
  });

  it('formats clean multi-line address block', () => {
    const customer = { name: 'Aarav Sharma', phone: '9876543210' };
    const address = {
      line1: 'Flat 402, Lotus Heights',
      line2: 'MG Road',
      landmark: 'Near Metro Pillar 50',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
    };

    const block = formatAddressBlock(customer, address);
    expect(block).toContain('Aarav Sharma');
    expect(block).toContain('Phone: 9876543210');
    expect(block).toContain('Flat 402, Lotus Heights');
    expect(block).toContain('MG Road');
    expect(block).toContain('Landmark: Near Metro Pillar 50');
    expect(block).toContain('Bengaluru, Karnataka - 560001');
  });
});

describe('Token and API Client', () => {
  beforeEach(() => {
    clearToken();
    vi.restoreAllMocks();
  });

  it('stores and retrieves token from memory/sessionStorage', () => {
    expect(getToken()).toBeNull();
    setToken('test-admin-jwt-token');
    expect(getToken()).toBe('test-admin-jwt-token');
    clearToken();
    expect(getToken()).toBeNull();
  });

  it('handles 401 unauthorized errors', async () => {
    setToken('expired-token');

    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ error: 'Invalid or expired token' }),
    });

    await expect(api.get('/api/admin/orders')).rejects.toThrow(ApiError);
    expect(getToken()).toBeNull(); // Automatically cleared on 401
  });

  it('injects Authorization header when token is present', async () => {
    setToken('valid-token-xyz');

    let capturedHeaders: Headers | undefined;
    globalThis.fetch = vi.fn().mockImplementation((url, options) => {
      capturedHeaders = options.headers;
      return Promise.resolve({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: [] }),
      });
    });

    const res = await api.get<{ data: any[] }>('/api/admin/orders');
    expect(res.data).toEqual([]);
    expect(capturedHeaders?.get('Authorization')).toBe('Bearer valid-token-xyz');
  });
});
