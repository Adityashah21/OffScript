export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'rto';

export interface Customer {
  name: string;
  phone: string;
  email?: string;
  fullName?: string;
  mobile?: string;
}

export interface DeliveryAddress {
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  brand: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  imageUrl?: string;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  changedAt: string;
  note?: string;
  changedBy?: string;
}

export interface OrderUtm {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
}

export interface Order {
  _id: string;
  id?: string;
  ref: string;
  customer: Customer;
  deliveryAddress: DeliveryAddress;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: 'cod';
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  notes?: string;
  utm?: OrderUtm;
  landingPage?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory =
  | 'Tops'
  | 'Shirts'
  | 'Bottoms'
  | 'Dresses'
  | 'Footwear'
  | 'Accessories';

export type ProductGender = 'women' | 'men' | 'unisex';
export type PurchaseMode = 'affiliate' | 'authorized_cod';

export interface ProductDetails {
  material?: string;
  fit?: string;
}

export interface Product {
  _id?: string;
  id?: string;
  slug: string;
  name: string;
  title?: string; // fallback alias
  description: string;
  category: ProductCategory;
  subcategory: string;
  gender: ProductGender;
  retailer: string;
  brand: string;
  price: number;
  originalPrice?: number;
  currency?: 'INR';
  images: string[];
  availableSizes: string[];
  availableColors: string[];
  colors?: string[]; // fallback alias
  tags: string[];
  collectionIds: string[];
  affiliateUrl: string | null;
  purchaseMode: PurchaseMode;
  codEnabled: boolean;
  shippingCharge: number;
  codShippingCharge?: number; // fallback alias
  inStock: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isEditorsPick: boolean;
  material?: string;
  fit?: string;
  details?: ProductDetails;
  lastUpdatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CollectionRule {
  field: 'category' | 'brand' | 'gender' | 'tags' | 'price';
  operator: 'eq' | 'ne' | 'in' | 'nin' | 'gte' | 'lte';
  value: string | number | string[];
}

export interface Collection {
  _id?: string;
  id?: string;
  slug: string;
  title: string;
  name?: string;
  description?: string;
  heroImage?: string;
  rules: CollectionRule[];
  pinnedProductIds?: string[];
  isCurated: boolean;
  sortOrder?: number;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Edit {
  _id?: string;
  id?: string;
  slug: string;
  title: string;
  subtitle?: string;
  coverImage?: string;
  bodyMarkdown?: string;
  productIds: string[];
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactMessage {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'new';
  createdAt: string;
}

export interface NewsletterSubscriber {
  _id?: string;
  id?: string;
  email: string;
  createdAt: string;
}

export interface AffiliateClickStat {
  productSlug?: string;
  productId?: string;
  title?: string;
  brand?: string;
  category?: string;
  retailer?: string;
  clicks: number;
}
