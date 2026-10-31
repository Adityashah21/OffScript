import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  User,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  Copy,
  Search,
  Phone,
  Mail,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Heart,
  Check,
  Building,
} from "lucide-react";
import { customerProfile, updateCustomerProfile, wishlist, type CustomerProfile } from "@/lib/store";
import { inr, formatDate } from "@/lib/format";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    ...seo("My Profile & Orders · OFFSCRIPT", "Track your cash-on-delivery orders, view dispatch status, and manage your delivery address."),
  }),
  component: ProfilePage,
});

export interface OrderTrackItem {
  ref: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "rto";
  createdAt: string;
  updatedAt: string;
  product: {
    productId: string;
    slug: string;
    name: string;
    image: string;
    unitPrice: number;
    shippingCharge?: number;
  };
  size?: string;
  color: string;
  quantity: number;
  itemTotal: number;
  shipping: number;
  grandTotal: number;
  paymentMode: string;
  customer: {
    fullName: string;
    mobile: string;
    email?: string;
    address: {
      house: string;
      street: string;
      landmark?: string;
      city: string;
      state: string;
      pin: string;
    };
  };
  statusHistory: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
}

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal"
];

function getApiUrl(): string {
  if (typeof window !== "undefined") {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    if (window.location.hostname === "localhost") return "http://localhost:5001";
  }
  return "https://offscript-p9rk.onrender.com";
}

export function ProfilePage() {
  const profile = customerProfile.use();
  const savedWishlist = wishlist.use();

  const [activeTab, setActiveTab] = useState<"orders" | "address" | "lookup">("orders");
  const [orders, setOrders] = useState<OrderTrackItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Address edit state
  const [editAddress, setEditAddress] = useState<CustomerProfile>({ ...profile });
  const [addressSavedNotice, setAddressSavedNotice] = useState(false);

  // Lookup state
  const [lookupQuery, setLookupQuery] = useState(profile.mobile || "");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupSuccess, setLookupSuccess] = useState<string | null>(null);

  // Initial orders fetch if phone or orderRefs present
  useEffect(() => {
    setEditAddress({ ...profile });

    const phoneToFetch = profile.mobile?.trim();
    const refsToFetch = profile.orderRefs || [];

    if (phoneToFetch || refsToFetch.length > 0) {
      fetchOrders(phoneToFetch || undefined, refsToFetch[0]);
    }
  }, [profile.mobile]);

  const fetchOrders = async (mobile?: string, ref?: string) => {
    if (!mobile && !ref) return;
    setLoadingOrders(true);

    try {
      const API_URL = getApiUrl();
      const res = await fetch(`${API_URL}/api/orders/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: mobile || undefined, ref: ref || undefined }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.orders)) {
          setOrders(data.orders);

          // If customer details were returned from DB and local profile is bare, sync them
          if (data.customer && (!profile.fullName || !profile.house)) {
            updateCustomerProfile({
              fullName: data.customer.fullName || profile.fullName,
              mobile: data.customer.mobile || profile.mobile,
              email: data.customer.email || profile.email,
              house: data.customer.address?.house || profile.house,
              street: data.customer.address?.street || profile.street,
              landmark: data.customer.address?.landmark || profile.landmark,
              city: data.customer.address?.city || profile.city,
              state: data.customer.address?.state || profile.state,
              pin: data.customer.address?.pin || profile.pin,
            });
          }
        }
      }
    } catch (err) {
      console.warn("Could not load live order history:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookupSuccess(null);

    const query = lookupQuery.trim();
    if (!query) {
      setLookupError("Please enter your 10-digit mobile number or order reference.");
      return;
    }

    setLookupLoading(true);
    try {
      const API_URL = getApiUrl();
      const isRef = query.toUpperCase().startsWith("OS-");

      const res = await fetch(`${API_URL}/api/orders/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isRef ? { ref: query } : { mobile: query }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error?.message || data.message || "Failed to find orders.");
      }

      if (!data.orders || data.orders.length === 0) {
        setLookupError(
          isRef
            ? `No order found with reference "${query}". Please check the spelling.`
            : `No orders found for mobile "${query}". Place an order request to see it here.`
        );
      } else {
        setOrders(data.orders);
        setLookupSuccess(`Found ${data.orders.length} order${data.orders.length > 1 ? "s" : ""}! Profile updated.`);

        if (data.customer) {
          updateCustomerProfile({
            fullName: data.customer.fullName,
            mobile: data.customer.mobile,
            email: data.customer.email || "",
            house: data.customer.address?.house || "",
            street: data.customer.address?.street || "",
            landmark: data.customer.address?.landmark || "",
            city: data.customer.address?.city || "",
            state: data.customer.address?.state || "",
            pin: data.customer.address?.pin || "",
            orderRefs: data.orders.map((o: any) => o.ref),
          });
        }
        setActiveTab("orders");
      }
    } catch (err: any) {
      setLookupError(err.message || "Could not retrieve order details. Please check your connection.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    updateCustomerProfile(editAddress);
    setAddressSavedNotice(true);
    setTimeout(() => setAddressSavedNotice(false), 3000);
  };

  const copyRef = (ref: string) => {
    navigator.clipboard?.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const hasIdentity = Boolean(profile.fullName || profile.mobile);

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10 md:px-10">
      {/* Header Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link to="/" className="eyebrow link-underline">
          ← Back to discovery
        </Link>
        <span className="eyebrow text-muted-foreground">Customer Profile</span>
      </div>

      {/* Profile Welcome Hero */}
      <div className="mt-8 border-b pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow text-accent">Personal Account</span>
            <h1 className="display-lg mt-2">
              {profile.fullName ? profile.fullName : "My Profile & Orders"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {profile.mobile
                ? `Associated with +91 ${profile.mobile.slice(-10)}`
                : "Your orders and saved delivery details on this device."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("lookup")}
              className="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium hover:border-foreground transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span>{hasIdentity ? "Switch Phone / Sync" : "Sync Phone Number"}</span>
            </button>

            {orders.length > 0 && (
              <button
                onClick={() => fetchOrders(profile.mobile, profile.orderRefs?.[0])}
                disabled={loadingOrders}
                className="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium hover:border-foreground transition-colors"
                title="Refresh order statuses"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loadingOrders && "animate-spin")} />
                <span>Refresh</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab("orders")}
            className={cn(
              "eyebrow pb-3 text-sm transition-colors border-b-2 -mb-px flex items-center gap-2",
              activeTab === "orders"
                ? "border-foreground text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Package className="h-4 w-4" />
            <span>Orders & Tracking</span>
            {orders.length > 0 && (
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-bold text-accent">
                {orders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("address")}
            className={cn(
              "eyebrow pb-3 text-sm transition-colors border-b-2 -mb-px flex items-center gap-2",
              activeTab === "address"
                ? "border-foreground text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <MapPin className="h-4 w-4" />
            <span>Delivery Address</span>
          </button>

          <button
            onClick={() => setActiveTab("lookup")}
            className={cn(
              "eyebrow pb-3 text-sm transition-colors border-b-2 -mb-px flex items-center gap-2",
              activeTab === "lookup"
                ? "border-foreground text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Search className="h-4 w-4" />
            <span>Find by Number</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Orders & Tracking */}
      {activeTab === "orders" && (
        <div className="mt-8 space-y-8">
          {loadingOrders && orders.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
              <p className="mt-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Checking order status...
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="border border-dashed p-10 text-center md:p-16">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/40 stroke-1" />
              <h3 className="display-sm mt-4">No order requests yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                When you request a piece with cash on delivery, your order details and live dispatch progress will appear right here.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link to="/collections/$slug" params={{ slug: "discover" }} className="btn-ink">
                  Explore Latest Drops →
                </Link>
                <button
                  onClick={() => setActiveTab("lookup")}
                  className="btn-outline"
                >
                  Look up previous order
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((ord) => (
                <OrderCard
                  key={ord.ref}
                  order={ord}
                  onCopy={() => copyRef(ord.ref)}
                  isCopied={copiedRef === ord.ref}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Saved Delivery Address */}
      {activeTab === "address" && (
        <div className="mt-8 max-w-2xl">
          <div className="mb-6">
            <h2 className="display-sm">Default Delivery Address</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These details will automatically pre-fill whenever you request a piece with Cash on Delivery.
            </p>
          </div>

          {addressSavedNotice && (
            <div className="mb-6 flex items-center gap-2 border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200">
              <Check className="h-4 w-4 shrink-0" />
              <span>Your profile details have been saved successfully.</span>
            </div>
          )}

          <form onSubmit={handleSaveAddress} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="eyebrow mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={editAddress.fullName}
                  onChange={(e) => setEditAddress({ ...editAddress, fullName: e.target.value })}
                  placeholder="e.g. Aditya Shah"
                  className="field"
                  required
                />
              </div>

              <div>
                <label className="eyebrow mb-1 block">Mobile Number (10 digits)</label>
                <input
                  type="tel"
                  value={editAddress.mobile}
                  onChange={(e) => setEditAddress({ ...editAddress, mobile: e.target.value })}
                  placeholder="9876543210"
                  className="field"
                  required
                />
              </div>

              <div>
                <label className="eyebrow mb-1 block">
                  Email <span className="text-muted-foreground normal-case font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  value={editAddress.email}
                  onChange={(e) => setEditAddress({ ...editAddress, email: e.target.value })}
                  placeholder="name@example.com"
                  className="field"
                />
              </div>

              <div>
                <label className="eyebrow mb-1 block">House / Flat No.</label>
                <input
                  type="text"
                  value={editAddress.house}
                  onChange={(e) => setEditAddress({ ...editAddress, house: e.target.value })}
                  placeholder="Flat 402, Skyline Heights"
                  className="field"
                  required
                />
              </div>

              <div>
                <label className="eyebrow mb-1 block">Street / Locality</label>
                <input
                  type="text"
                  value={editAddress.street}
                  onChange={(e) => setEditAddress({ ...editAddress, street: e.target.value })}
                  placeholder="MG Road, Bandra West"
                  className="field"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="eyebrow mb-1 block">
                  Landmark <span className="text-muted-foreground normal-case font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={editAddress.landmark}
                  onChange={(e) => setEditAddress({ ...editAddress, landmark: e.target.value })}
                  placeholder="Near Metro Station"
                  className="field"
                />
              </div>

              <div>
                <label className="eyebrow mb-1 block">City</label>
                <input
                  type="text"
                  value={editAddress.city}
                  onChange={(e) => setEditAddress({ ...editAddress, city: e.target.value })}
                  placeholder="Mumbai"
                  className="field"
                  required
                />
              </div>

              <div>
                <label className="eyebrow mb-1 block">State</label>
                <select
                  value={editAddress.state}
                  onChange={(e) => setEditAddress({ ...editAddress, state: e.target.value })}
                  className="field"
                  required
                >
                  <option value="">Select State</option>
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="eyebrow mb-1 block">PIN Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={editAddress.pin}
                  onChange={(e) => setEditAddress({ ...editAddress, pin: e.target.value })}
                  placeholder="400050"
                  className="field"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-ink mt-2">
              Save Default Address
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Look up by Number / Order Ref */}
      {activeTab === "lookup" && (
        <div className="mt-8 max-w-xl">
          <div className="mb-6">
            <h2 className="display-sm">Find Orders from Any Device</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the 10-digit mobile number or order reference (e.g. <code>OS-20261031-XXXXXX</code>) you used when ordering.
            </p>
          </div>

          <form onSubmit={handleLookupSubmit} className="space-y-4">
            <div>
              <label htmlFor="lookup-input" className="eyebrow mb-2 block">
                Mobile Number or Order Reference
              </label>
              <div className="flex gap-2">
                <input
                  id="lookup-input"
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="e.g. 9876543210 or OS-2026..."
                  className="field flex-1"
                  required
                />
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="btn-ink shrink-0 px-5"
                >
                  {lookupLoading ? "Searching..." : "Find Orders"}
                </button>
              </div>
            </div>

            {lookupError && (
              <div className="flex items-center gap-2 border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}

            {lookupSuccess && (
              <div className="flex items-center gap-2 border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-200">
                <Check className="h-4 w-4 shrink-0" />
                <span>{lookupSuccess}</span>
              </div>
            )}
          </form>

          <div className="mt-8 border-t pt-6 text-xs text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">How does OFFSCRIPT order tracking work?</p>
            <p>
              When you place a Cash On Delivery request, no account password is required. You can always pull up your order history using the mobile number you provided.
            </p>
          </div>
        </div>
      )}

      {/* Wishlist Shortcut Section */}
      {savedWishlist.length > 0 && (
        <aside className="mt-16 border-t pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-accent fill-accent" />
              <h3 className="eyebrow text-foreground">
                Saved in Wishlist ({savedWishlist.length})
              </h3>
            </div>
            <Link to="/wishlist" className="eyebrow link-underline text-accent">
              View Wishlist →
            </Link>
          </div>
        </aside>
      )}
    </div>
  );
}

function OrderCard({
  order,
  onCopy,
  isCopied,
}: {
  order: OrderTrackItem;
  onCopy: () => void;
  isCopied: boolean;
}) {
  const steps = [
    { key: "pending", label: "Request Received", desc: "Verifying delivery details" },
    { key: "confirmed", label: "Order Confirmed", desc: "Packed & awaiting dispatch" },
    { key: "shipped", label: "In Transit", desc: "Out for courier delivery" },
    { key: "delivered", label: "Delivered", desc: "Paid on delivery" },
  ];

  const statusOrder = ["pending", "confirmed", "shipped", "delivered"];
  const currentStepIndex = statusOrder.indexOf(order.status);
  const isCancelled = order.status === "cancelled" || order.status === "rto";

  return (
    <article className="border border-border bg-card shadow-sm transition-all hover:border-foreground/40">
      {/* Top Banner with Ref & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold tracking-tight text-foreground">
            {order.ref}
          </span>
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            title="Copy Order Reference"
          >
            {isCopied ? (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <Check className="h-3 w-3" /> Copied
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Copy className="h-3 w-3" /> Copy Ref
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">
            {formatDate(order.createdAt)}
          </span>
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="p-5 md:p-6 space-y-6">
        {/* Visual Progress Steps Tracker */}
        {!isCancelled && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {steps.map((st, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={st.key} className="space-y-1">
                    <div
                      className={cn(
                        "h-1.5 w-full rounded-full transition-all",
                        isPassed ? "bg-accent" : "bg-muted"
                      )}
                    />
                    <p
                      className={cn(
                        "text-[11px] font-semibold tracking-tight truncate",
                        isCurrent
                          ? "text-accent"
                          : isPassed
                          ? "text-foreground"
                          : "text-muted-foreground/60"
                      )}
                    >
                      {st.label}
                    </p>
                    <p className="hidden text-[10px] text-muted-foreground sm:block truncate">
                      {st.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            This order request has been {order.status === "rto" ? "returned to origin" : "cancelled"}.
          </div>
        )}

        {/* Product Details & Amount Grid */}
        <div className="grid gap-6 border-t border-border pt-5 sm:grid-cols-[100px_1fr_auto]">
          <Link
            to="/product/$slug"
            params={{ slug: order.product.slug }}
            className="block aspect-[4/5] w-24 shrink-0 overflow-hidden bg-muted border"
          >
            {order.product.image ? (
              <img
                src={order.product.image}
                alt={order.product.name}
                className="h-full w-full object-cover transition-transform hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-mono text-[10px] text-muted-foreground">
                OFFSCRIPT
              </div>
            )}
          </Link>

          <div className="space-y-2 text-sm">
            <Link
              to="/product/$slug"
              params={{ slug: order.product.slug }}
              className="font-medium hover:underline text-foreground block text-base"
            >
              {order.product.name}
            </Link>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {order.size && (
                <span className="border px-2 py-0.5 font-mono">
                  Size: {order.size}
                </span>
              )}
              {order.color && (
                <span className="border px-2 py-0.5">
                  Color: {order.color}
                </span>
              )}
              <span className="border px-2 py-0.5">
                Qty: {order.quantity}
              </span>
            </div>

            <div className="pt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Delivery to:</span>{" "}
              {order.customer.fullName},{" "}
              {[
                order.customer.address.house,
                order.customer.address.street,
                order.customer.address.city,
                order.customer.address.state,
                order.customer.address.pin,
              ]
                .filter(Boolean)
                .join(", ")}
            </div>
          </div>

          <div className="text-right sm:self-center">
            <p className="eyebrow text-muted-foreground text-[10px]">Collect On Delivery</p>
            <p className="font-mono text-xl font-bold text-foreground">
              {inr(order.grandTotal)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Cash on delivery
            </p>
          </div>
        </div>

        {/* Status Notes History (if available) */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className="border-t border-border pt-4">
            <details className="text-xs group cursor-pointer">
              <summary className="eyebrow text-muted-foreground hover:text-foreground select-none">
                Dispatch log & notes ({order.statusHistory.length})
              </summary>
              <ul className="mt-3 space-y-2 border-l border-border pl-3 text-muted-foreground">
                {order.statusHistory.map((h, i) => (
                  <li key={i} className="text-[11px]">
                    <span className="font-semibold text-foreground uppercase tracking-wider">
                      {h.status}
                    </span>{" "}
                    · {formatDate(h.timestamp)}
                    {h.note && <p className="mt-0.5 italic">{h.note}</p>}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: OrderTrackItem["status"] }) {
  const styles: Record<OrderTrackItem["status"], { label: string; cls: string }> = {
    pending: { label: "Pending Verification", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
    confirmed: { label: "Confirmed", cls: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" },
    shipped: { label: "Shipped", cls: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30" },
    delivered: { label: "Delivered", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
    cancelled: { label: "Cancelled", cls: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30" },
    rto: { label: "Returned to Origin", cls: "bg-neutral-500/10 text-neutral-700 dark:text-neutral-400 border-neutral-500/30" },
  };

  const current = styles[status] || { label: status, cls: "bg-muted text-muted-foreground" };

  return (
    <span className={cn("inline-flex items-center border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", current.cls)}>
      {current.label}
    </span>
  );
}
