import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Clock,
  IndianRupee,
  Package,
  AlertOctagon,
  Plus,
  ArrowRight,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api';
import type { ApiSuccessResponse, Order, Product } from '../types/api';
import { formatINR, formatDateTimeIST } from '../lib/format';
import {
  computeOrdersToday,
  computePendingCodValue,
  getOrdersNeedingAttention,
  compute14DayTrend,
} from '../lib/dashboard';
import { StatCard } from '../components/dashboard/StatCard';
import { OrdersChart } from '../components/dashboard/OrdersChart';
import { NeedsAttentionCard } from '../components/dashboard/NeedsAttentionCard';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // 1. Fetch recent orders for aggregates & trends: GET /api/admin/orders?limit=100
  const {
    data: ordersData,
    isLoading: isLoadingOrders,
    isFetching: isFetchingOrders,
    refetch: refetchOrders,
  } = useQuery<ApiSuccessResponse<Order[]>>({
    queryKey: ['dashboard-orders'],
    queryFn: async () => {
      const res = await api.get<ApiSuccessResponse<Order[]>>('/api/admin/orders', {
        params: { limit: 100 },
      });
      return res;
    },
    refetchInterval: 30000,
  });

  // 2. Fetch products for catalog stats: GET /api/admin/products?limit=100
  const { data: productsData, isLoading: isLoadingProducts } = useQuery<{
    items: Product[];
    total: number;
  }>({
    queryKey: ['dashboard-products'],
    queryFn: async () => {
      const res = await api.get<{ items: Product[]; total: number }>('/api/admin/products', {
        params: { limit: 100 },
      });
      return res;
    },
  });

  const orders = ordersData?.data || [];
  const products = productsData?.items || [];
  const totalProductsCount = productsData?.total ?? products.length;

  // Aggregate metrics
  const ordersToday = useMemo(() => computeOrdersToday(orders), [orders]);
  const pendingOrdersCount = useMemo(() => {
    return (
      ordersData?.meta?.statusCounts?.pending ??
      orders.filter((o) => o.status === 'pending').length
    );
  }, [ordersData, orders]);
  const pendingCodValue = useMemo(() => computePendingCodValue(orders), [orders]);
  const outOfStockCount = useMemo(() => products.filter((p) => !p.inStock).length, [products]);

  // Attention orders & 14-day trend
  const attentionOrders = useMemo(() => getOrdersNeedingAttention(orders), [orders]);
  const trendData = useMemo(() => compute14DayTrend(orders), [orders]);
  const latestFiveOrders = useMemo(() => orders.slice(0, 5), [orders]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Store Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Key operational metrics, cash-on-delivery tracking, and quick management links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchOrders()}
            disabled={isFetchingOrders}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetchingOrders ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Link to="/products/new">
            <Button variant="default" size="sm" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>Add Product</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards Grid (5 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Orders Today"
          value={ordersToday}
          icon={ShoppingBag}
          subtitle="Placed today in IST"
          isLoading={isLoadingOrders}
          onClick={() => navigate('/orders')}
        />

        <StatCard
          title="Pending Review"
          value={pendingOrdersCount}
          icon={Clock}
          variant={pendingOrdersCount > 0 ? 'warning' : 'default'}
          subtitle="Awaiting confirmation"
          isLoading={isLoadingOrders}
          onClick={() => navigate('/orders?status=pending')}
        />

        <StatCard
          title="Pending COD Value"
          value={formatINR(pendingCodValue)}
          icon={IndianRupee}
          variant="success"
          subtitle="Cash to collect upon delivery"
          isLoading={isLoadingOrders}
        />

        <StatCard
          title="Catalog Pieces"
          value={totalProductsCount}
          icon={Package}
          subtitle="Curated products"
          isLoading={isLoadingProducts}
          onClick={() => navigate('/products')}
        />

        <StatCard
          title="Out of Stock"
          value={outOfStockCount}
          icon={AlertOctagon}
          variant={outOfStockCount > 0 ? 'alert' : 'default'}
          subtitle={outOfStockCount > 0 ? 'Requires restocking' : 'All items in stock'}
          isLoading={isLoadingProducts}
          onClick={() => navigate('/products')}
        />
      </div>

      {/* Main Grid: 14-Day Chart & Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OrdersChart data={trendData} isLoading={isLoadingOrders} />
        </div>

        <div className="space-y-6">
          <NeedsAttentionCard orders={attentionOrders} isLoading={isLoadingOrders} />
        </div>
      </div>

      {/* Latest 5 Orders Section */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Latest Orders
            </CardTitle>
          </div>

          <Link to="/orders">
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
              <span>View All Orders</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          {isLoadingOrders ? (
            <div className="py-12 text-center text-xs text-muted-foreground font-mono">
              Loading recent orders...
            </div>
          ) : latestFiveOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No orders have been placed yet.
            </div>
          ) : (
            <div className="divide-y overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead className="bg-muted/30 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">Ref</th>
                    <th className="p-3">Date (IST)</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Product</th>
                    <th className="p-3 text-right">COD Amount</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {latestFiveOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/orders/${order.ref}`)}
                    >
                      <td className="p-3 font-mono font-bold">{order.ref}</td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {formatDateTimeIST(order.createdAt)}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-foreground">{order.customer.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {order.deliveryAddress.city}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="max-w-[180px] truncate">
                          {order.items[0]?.title || 'Product'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Qty: {order.items[0]?.quantity || 1}
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold">
                        {formatINR(order.total)}
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
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
