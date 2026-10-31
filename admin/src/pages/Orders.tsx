import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  RefreshCw,
  Eye,
  Calendar,
  CheckSquare,
  Square,
  Phone,
  MessageCircle,
  Package,
  MapPin,
  Clock,
} from 'lucide-react';
import { api } from '../lib/api';
import type { ApiSuccessResponse, Order, OrderStatus } from '../types/api';
import { formatINR, formatDateTimeIST, getWhatsAppLink } from '../lib/format';
import { generateOrdersCSV, downloadCSV, ORDER_STATUS_LABELS } from '../lib/orders';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

type StatusTab = 'all' | OrderStatus;

const TABS: { id: StatusTab; label: string }[] = [
  { id: 'all', label: 'All Orders' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'rto', label: 'RTO' },
];

export const Orders: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Selected orders for bulk actions
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Fetch orders with current filters
  const { data, isLoading, isFetching, refetch } = useQuery<ApiSuccessResponse<Order[]>>({
    queryKey: ['orders', activeTab, searchTerm, startDate, endDate, page],
    queryFn: async () => {
      const params: Record<string, any> = {
        page,
        limit,
      };
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      if (searchTerm.trim()) {
        params.query = searchTerm.trim();
      }
      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }

      const res = await api.get<ApiSuccessResponse<Order[]>>('/api/admin/orders', { params });
      return res;
    },
    refetchInterval: 30000, // 30s polling
  });

  const orders: Order[] = (data as any)?.items || (data as any)?.data || [];
  const meta = (data as any)?.meta;
  const statusCounts = meta?.statusCounts || {};
  const totalOrdersCount = (data as any)?.total ?? meta?.total ?? orders.length;
  const totalPages = (data as any)?.total ? Math.ceil((data as any).total / limit) : (meta?.pages ?? 1);

  // Compute product-filtered orders client-side if product filter specified
  const filteredOrders = useMemo(() => {
    if (!productFilter.trim()) return orders;
    const filter = productFilter.toLowerCase().trim();
    return orders.filter((order: Order) =>
      Array.isArray(order.items) &&
      order.items.some(
        (item) =>
          item.title?.toLowerCase().includes(filter) ||
          item.brand?.toLowerCase().includes(filter)
      )
    );
  }, [orders, productFilter]);

  // Bulk selection helpers
  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map((o: Order) => o._id)));
    }
  };

  // Bulk status update action
  const handleBulkStatusUpdate = async (targetStatus: 'confirmed' | 'shipped') => {
    const selectedOrders = filteredOrders.filter((o: Order) => selectedOrderIds.has(o._id));
    const eligibleOrders = selectedOrders.filter((o: Order) => {
      if (targetStatus === 'confirmed') return o.status === 'pending';
      if (targetStatus === 'shipped') return o.status === 'confirmed';
      return false;
    });

    if (eligibleOrders.length === 0) {
      toast.error(
        `None of the selected orders can be marked as ${ORDER_STATUS_LABELS[targetStatus]}.`
      );
      return;
    }

    setIsBulkUpdating(true);
    let successCount = 0;
    let failureCount = 0;

    for (const ord of eligibleOrders) {
      try {
        await api.patch(`/api/admin/orders/${ord._id}/status`, {
          status: targetStatus,
          note: `Bulk update to ${ORDER_STATUS_LABELS[targetStatus]}`,
        });
        successCount++;
      } catch {
        failureCount++;
      }
    }

    setIsBulkUpdating(false);
    setSelectedOrderIds(new Set());
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['pending-orders-count'] });

    if (failureCount === 0) {
      toast.success(
        `Successfully updated ${successCount} orders to ${ORDER_STATUS_LABELS[targetStatus]}.`
      );
    } else {
      toast.warning(
        `Updated ${successCount} orders; ${failureCount} failed. Please review the list.`
      );
    }
  };

  // CSV export handler
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('No orders to export with current filters.');
      return;
    }
    const csvContent = generateOrdersCSV(filteredOrders);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `offscript-orders-${activeTab}-${dateStr}.csv`;
    downloadCSV(csvContent, filename);
    toast.success(`Exported ${filteredOrders.length} orders to CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review cash-on-delivery order requests, customer shipping details, and dispatch statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredOrders.length === 0}
            className="gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Status Tabs with Counts */}
      <div className="border-b overflow-x-auto scrollbar-none">
        <nav className="flex space-x-2 min-w-max pb-1">
          {TABS.map((tab) => {
            const count =
              tab.id === 'all'
                ? totalOrdersCount
                : statusCounts[tab.id] ??
                  orders.filter((o: Order) => tab.id !== 'all' && o.status === tab.id).length;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                  setSelectedOrderIds(new Set());
                }}
                className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-all select-none ${
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                }`}
              >
                <span>{tab.label}</span>
                {typeof count === 'number' && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                      isActive
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-card p-3 rounded-xl border">
        {/* Search */}
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search ref or customer name..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-9 text-xs"
          />
        </div>

        {/* Product Filter */}
        <div className="relative">
          <Package className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Filter by product or brand..."
            value={productFilter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProductFilter(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Start Date */}
        <div className="relative">
          <Calendar className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            type="date"
            placeholder="From Date"
            value={startDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="pl-9 text-xs"
          />
        </div>

        {/* End Date */}
        <div className="relative">
          <Calendar className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            type="date"
            placeholder="To Date"
            value={endDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Bulk Action Sticky Bar when items selected */}
      {selectedOrderIds.size > 0 && (
        <div className="bg-primary text-primary-foreground p-3 rounded-lg flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3 text-xs sm:text-sm font-medium">
            <span>{selectedOrderIds.size} orders selected</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedOrderIds(new Set())}
              className="text-xs h-7"
            >
              Clear
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleBulkStatusUpdate('confirmed')}
              disabled={isBulkUpdating}
              className="text-xs h-7"
            >
              Mark Confirmed
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleBulkStatusUpdate('shipped')}
              disabled={isBulkUpdating}
              className="text-xs h-7"
            >
              Mark Shipped
            </Button>
          </div>
        </div>
      )}

      {/* Main Content: Table on desktop, Cards on mobile */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
          <div className="animate-spin h-7 w-7 border-2 border-primary border-t-transparent rounded-full mb-3" />
          <span className="text-xs uppercase tracking-wider font-mono">Loading orders...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="border border-dashed rounded-xl p-12 text-center">
          <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-base">No orders found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchTerm || startDate || endDate || productFilter
              ? 'Try modifying or clearing your filters to see more results.'
              : 'New cash-on-delivery orders placed on the storefront will appear here.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden lg:block border rounded-xl overflow-hidden bg-card shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3 w-10">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {selectedOrderIds.size === filteredOrders.length &&
                      filteredOrders.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">Order Ref</th>
                  <th className="p-3">Date / Time (IST)</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Delivery Destination</th>
                  <th className="p-3">Items Ordered</th>
                  <th className="p-3 text-right">COD Amount</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.map((order: Order) => {
                  const isSelected = selectedOrderIds.has(order._id);
                  const isPending = order.status === 'pending';

                  return (
                    <tr
                      key={order._id}
                      className={`hover:bg-muted/30 transition-colors cursor-pointer ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => navigate(`/orders/${order.ref}`)}
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleSelectOrder(order._id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-foreground">
                            {order.ref}
                          </span>
                          {isPending && (
                            <Badge variant="warning" className="text-[10px] px-1 py-0">
                              NEW
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {formatDateTimeIST(order.createdAt)}
                      </td>

                      <td className="p-3">
                        <div className="font-medium text-foreground">{order.customer?.name || (order.customer as any)?.fullName || 'Customer'}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <span>{order.customer?.phone || (order.customer as any)?.mobile || ''}</span>
                          {(order.customer?.phone || (order.customer as any)?.mobile) && (
                            <a
                              href={getWhatsAppLink(order.customer?.phone || (order.customer as any)?.mobile)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-emerald-600 hover:text-emerald-700 ml-1"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-muted-foreground">
                        <div className="truncate max-w-[180px]" title={order.deliveryAddress?.line1 || (order.customer as any)?.address?.house || ''}>
                          {order.deliveryAddress?.city || (order.customer as any)?.address?.city || ''}, {order.deliveryAddress?.state || (order.customer as any)?.address?.state || ''}
                        </div>
                        <div className="font-mono text-[11px]">{order.deliveryAddress?.pincode || (order.customer as any)?.address?.pin || ''}</div>
                      </td>

                      <td className="p-3">
                        <div className="max-w-[200px] truncate font-medium">
                          {order.items?.[0]?.title || (order as any)?.product?.name || 'Piece'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {order.items?.[0]?.selectedSize && `Size: ${order.items[0].selectedSize} • `}
                          Qty: {order.items?.[0]?.quantity || (order as any)?.quantity || 1}
                          {(order.items?.length || 0) > 1 && ` (+${order.items.length - 1} more)`}
                        </div>
                      </td>

                      <td className="p-3 text-right">
                        <div className="font-mono font-bold text-foreground">
                          {formatINR(order.total ?? (order as any)?.grandTotal ?? 0)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">COD</div>
                      </td>

                      <td className="p-3 text-center">
                        <OrderStatusBadge status={order.status} />
                      </td>

                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/orders/${order.ref}`)}
                          className="h-7 px-2 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (Shown on screens < lg) */}
          <div className="lg:hidden space-y-3">
            {filteredOrders.map((order: Order) => {
              const isSelected = selectedOrderIds.has(order._id);
              const isPending = order.status === 'pending';

              return (
                <div
                  key={order._id}
                  className={`border rounded-xl p-4 bg-card shadow-sm transition-all ${
                    isSelected ? 'ring-2 ring-primary border-transparent' : ''
                  }`}
                  onClick={() => navigate(`/orders/${order.ref}`)}
                >
                  <div className="flex items-start justify-between gap-2 border-b pb-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectOrder(order._id);
                        }}
                        className="text-muted-foreground"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                      <div>
                        <span className="font-mono font-bold text-sm">{order.ref}</span>
                        {isPending && (
                          <Badge variant="warning" className="ml-1.5 text-[10px] px-1 py-0">
                            NEW
                          </Badge>
                        )}
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{formatDateTimeIST(order.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  {/* Customer info */}
                  <div className="py-3 border-b space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm">{order.customer?.name || (order.customer as any)?.fullName || 'Customer'}</div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {(order.customer?.phone || (order.customer as any)?.mobile) && (
                          <>
                            <a
                              href={`tel:${order.customer?.phone || (order.customer as any)?.mobile}`}
                              className="p-1 rounded-full bg-muted text-muted-foreground hover:text-foreground"
                              title="Call customer"
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                            <a
                              href={getWhatsAppLink(order.customer?.phone || (order.customer as any)?.mobile)}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                              title="WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {order.deliveryAddress?.city || (order.customer as any)?.address?.city || ''}, {order.deliveryAddress?.state || (order.customer as any)?.address?.state || ''} -{' '}
                        {order.deliveryAddress?.pincode || (order.customer as any)?.address?.pin || ''}
                      </span>
                    </div>
                  </div>

                  {/* Product & COD Amount */}
                  <div className="pt-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium truncate max-w-[200px]">
                        {order.items?.[0]?.title || (order as any)?.product?.name || 'Piece'}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {order.items?.[0]?.brand || 'OFFSCRIPT'} • Qty {order.items?.[0]?.quantity || (order as any)?.quantity || 1}
                        {(order.items?.length || 0) > 1 && ` (+${order.items.length - 1} more)`}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-foreground">
                        {formatINR(order.total ?? (order as any)?.grandTotal ?? 0)}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">COD Due</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t text-xs">
              <span className="text-muted-foreground">
                Showing page {page} of {totalPages} ({totalOrdersCount} total orders)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
