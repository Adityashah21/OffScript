import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  Copy,
  Printer,
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  Tag,
  Compass,
  MapPin,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Order, OrderItem, StatusHistoryEntry } from '../types/api';
import {
  formatINR,
  formatDateTimeIST,
  formatAddressBlock,
  getWhatsAppLink,
} from '../lib/format';
import { getNextAllowedStatuses } from '../lib/orders';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { OrderShippingLabel } from '../components/orders/OrderShippingLabel';
import { OrderStatusModal } from '../components/orders/OrderStatusModal';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

export const OrderDetail: React.FC = () => {
  const { ref } = useParams<{ ref: string }>();
  const queryClient = useQueryClient();
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Fetch single order by ref: GET /api/admin/orders/:ref
  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useQuery<Order>({
    queryKey: ['order', ref],
    queryFn: async () => {
      // Backend: GET /api/admin/orders/:idOrRef returns { data: Order } or direct Order
      const res = await api.get<any>(`/api/admin/orders/${ref}`);
      return res?.data || res;
    },
    enabled: Boolean(ref),
  });

  const handleCopyAddress = () => {
    if (!order) return;
    const text = formatAddressBlock(order.customer, order.deliveryAddress);
    navigator.clipboard.writeText(text);
    toast.success('Shipping address copied to clipboard');
  };

  const handlePrintLabel = () => {
    window.print();
  };

  const handleStatusUpdateSuccess = (updatedOrder: Order) => {
    queryClient.setQueryData(['order', ref], updatedOrder);
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['pending-orders-count'] });
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-muted-foreground">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mb-3" />
        <span className="font-mono text-xs uppercase tracking-wider">Loading order details...</span>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Order Not Found</h2>
        <p className="text-xs text-muted-foreground">
          {error instanceof Error ? error.message : `No order found with reference "${ref}".`}
        </p>
        <Link to="/orders">
          <Button variant="default" size="sm">
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const allowedStatuses = getNextAllowedStatuses(order.status);
  const isTerminal = allowedStatuses.length === 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hidden print-only shipping label */}
      <OrderShippingLabel order={order} />

      {/* Top Breadcrumb & Action Header (Screen view only) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="space-y-1">
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-mono font-bold tracking-tight">{order.ref}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>Placed on {formatDateTimeIST(order.createdAt)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAddress}
            className="gap-1.5 text-xs"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Copy Address</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintLabel}
            className="gap-1.5 text-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Label</span>
          </Button>

          {!isTerminal && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsStatusModalOpen(true)}
              className="gap-1.5 text-xs"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Update Status</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Items, Shipping Address, Customer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Package Items ({order.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              {(order.items || []).map((item: OrderItem, index: number) => (
                <div key={index} className="p-4 flex items-center gap-4">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-16 h-20 object-cover rounded-md border shrink-0 bg-muted"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-muted rounded-md border flex items-center justify-center shrink-0">
                      <Tag className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-mono text-muted-foreground uppercase">
                      {item.brand}
                    </div>
                    <div className="text-sm font-semibold truncate">{item.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
                      {item.selectedSize && (
                        <span className="bg-muted px-1.5 py-0.5 rounded">
                          Size: {item.selectedSize}
                        </span>
                      )}
                      {item.selectedColor && (
                        <span className="bg-muted px-1.5 py-0.5 rounded">
                          Color: {item.selectedColor}
                        </span>
                      )}
                      <span className="bg-muted px-1.5 py-0.5 rounded">Qty: {item.quantity}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-sm">
                      {formatINR(item.price * item.quantity)}
                    </div>
                    {item.quantity > 1 && (
                      <div className="text-[10px] text-muted-foreground">
                        {formatINR(item.price)} each
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Delivery Address & Customer Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Details */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Customer Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <div className="text-base font-bold text-foreground">{order.customer.name}</div>
                  <div className="text-xs text-muted-foreground">Cash On Delivery Buyer</div>
                </div>

                <div className="space-y-2 pt-2 border-t text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${order.customer.phone}`}
                        className="font-mono font-semibold text-foreground hover:underline flex items-center gap-1"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{order.customer.phone}</span>
                      </a>
                      <a
                        href={getWhatsAppLink(order.customer.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 p-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  {order.customer.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <a
                        href={`mailto:${order.customer.email}`}
                        className="font-medium text-foreground hover:underline flex items-center gap-1 truncate max-w-[180px]"
                      >
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{order.customer.email}</span>
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Delivery Destination
                </CardTitle>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-xs leading-relaxed">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-foreground">
                      {order.deliveryAddress.line1}
                    </div>
                    {order.deliveryAddress.line2 && (
                      <div className="text-muted-foreground">{order.deliveryAddress.line2}</div>
                    )}
                    {order.deliveryAddress.landmark && (
                      <div className="text-muted-foreground text-[11px] italic mt-0.5">
                        Landmark: {order.deliveryAddress.landmark}
                      </div>
                    )}
                    <div className="font-semibold text-foreground mt-1">
                      {order.deliveryAddress.city}, {order.deliveryAddress.state} -{' '}
                      <span className="font-mono">{order.deliveryAddress.pincode}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Special Instructions / Notes */}
          {order.notes && (
            <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Customer Delivery Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-amber-900 dark:text-amber-200">
                {order.notes}
              </CardContent>
            </Card>
          )}

          {/* Marketing Attribution / UTM */}
          {(order.utm?.source || order.landingPage) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5" /> Marketing Attribution
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 flex flex-wrap gap-2 text-xs">
                {order.utm?.source && (
                  <Badge variant="secondary">Source: {order.utm.source}</Badge>
                )}
                {order.utm?.medium && (
                  <Badge variant="secondary">Medium: {order.utm.medium}</Badge>
                )}
                {order.utm?.campaign && (
                  <Badge variant="secondary">Campaign: {order.utm.campaign}</Badge>
                )}
                {order.landingPage && (
                  <Badge variant="outline" className="font-mono text-[10px]">
                    Landing: {order.landingPage}
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Financials Summary & Status Timeline */}
        <div className="space-y-6">
          {/* Payment & COD Summary Card */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Items Subtotal</span>
                <span className="font-mono">{formatINR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Shipping Fee</span>
                <span className="font-mono">
                  {order.shippingFee === 0 ? 'FREE' : formatINR(order.shippingFee)}
                </span>
              </div>

              <div className="border-t pt-3 flex justify-between items-baseline">
                <div>
                  <div className="font-bold text-sm">COD Amount to Collect</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Cash on Delivery</div>
                </div>
                <div className="text-xl font-mono font-extrabold text-foreground">
                  {formatINR(order.total)}
                </div>
              </div>

              {!isTerminal && (
                <div className="pt-2">
                  <Button
                    variant="default"
                    className="w-full text-xs font-medium"
                    onClick={() => setIsStatusModalOpen(true)}
                  >
                    Change Status
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Status History
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="relative border-l border-muted-foreground/20 ml-2 space-y-6 pl-4 text-xs">
                {order.statusHistory.map((history: StatusHistoryEntry, idx: number) => (
                  <div key={idx} className="relative">
                    {/* Timeline bullet */}
                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />

                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={history.status} showDot={false} />
                      <span className="text-[11px] text-muted-foreground">
                        {formatDateTimeIST(history.changedAt)}
                      </span>
                    </div>

                    {history.note && (
                      <p className="mt-1 text-xs text-muted-foreground bg-muted/40 p-2 rounded">
                        {history.note}
                      </p>
                    )}

                    {history.changedBy && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        By: {history.changedBy}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Transition Modal */}
      <OrderStatusModal
        order={order}
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSuccess={handleStatusUpdateSuccess}
      />
    </div>
  );
};
